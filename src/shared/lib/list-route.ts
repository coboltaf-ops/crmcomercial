import { NextRequest, NextResponse } from 'next/server'
import { readList, writeList } from '@/shared/lib/kv-store'
import { getSesion, sesionVeTodo } from '@/shared/lib/session'
import { filtrarPorPais, puedeAccederRegistro } from '@/shared/lib/paises'

/**
 * Fábrica de handlers GET/POST para listas en KV — SEGURA ante navegadores
 * desactualizados o guardados en blanco.
 *
 * El POST acepta operaciones POR REGISTRO (no pisa la lista completa):
 *   { op: 'upsert', item }      → inserta o reemplaza por id
 *   { op: 'delete', id }        → elimina por id (puede dejar la lista vacía)
 *   { op: 'set', items, force } → reemplazo total; si 'items' vacía una lista
 *                                 NO vacía, se BLOQUEA salvo force:true
 *
 * Compatibilidad: si llega un array crudo (cliente viejo) se trata como
 * reemplazo total, pero con la MISMA guardia anti-vaciado.
 */

const noStore = { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' }

/**
 * INTERRUPTOR DE AISLAMIENTO POR PAÍS (crmcomercial).
 *
 * false  → El país es solo una ETIQUETA informativa/filtro opcional en la UI.
 *          Nadie pierde acceso: un usuario de Colombia ve TODOS los registros
 *          (incluidos clientes/prospectos ubicados en otros países), porque el
 *          equipo comercial de Colombia gestiona cuentas de varios países.
 *          Los datos NO se sellan ni se bloquean por país.  ← estado actual.
 *
 * true   → Aislamiento real "un país por usuario": cada usuario ve/edita solo
 *          su país (GLOBAL/Admin ve todo). Activar SOLO cuando existan usuarios
 *          de otras operaciones (p.ej. un usuario de Perú que deba ver solo Perú).
 *
 * Cambiar este valor NO altera ningún dato: solo cambia qué se muestra/permite.
 */
const AISLAR_POR_PAIS = false

type WithId = { id?: string | number; pais?: string }

interface ListOptions {
  /**
   * Si es true, aplica el modelo multipaís:
   *  - GET solo devuelve registros del país del usuario (GLOBAL/Admin ve todo).
   *  - upsert sella el país del usuario y bloquea tocar registros de otro país.
   *  - delete bloquea borrar registros de otro país.
   * Debe quedar en false para catálogos/config globales (roles, monedas, etc.).
   */
  scopePais?: boolean
}

export function makeListHandlers(KV_KEY: string, options: ListOptions = {}) {
  // El aislamiento solo aplica si el interruptor global está encendido.
  // Con AISLAR_POR_PAIS=false, el país queda como etiqueta (no oculta ni bloquea).
  const scopePais = AISLAR_POR_PAIS && (options.scopePais ?? false)

  async function GET(req: NextRequest) {
    const data = await readList<WithId>(KV_KEY)
    if (!scopePais) return NextResponse.json(data, { headers: noStore })
    const sesion = getSesion(req)
    const visible = filtrarPorPais(data, sesion?.pais)
    return NextResponse.json(visible, { headers: noStore })
  }

  async function POST(req: NextRequest) {
    try {
      const body = await req.json()
      const current = await readList<WithId>(KV_KEY)
      const sesion = scopePais ? getSesion(req) : null
      const veTodo = sesionVeTodo(sesion)

      // ── Operaciones por registro ──
      if (body && typeof body === 'object' && !Array.isArray(body) && 'op' in body) {
        if (body.op === 'upsert' && body.item && body.item.id != null) {
          const idx = current.findIndex((r) => r.id === body.item.id)
          if (scopePais && !veTodo) {
            // No puede tocar un registro existente de otro país.
            if (idx >= 0 && !puedeAccederRegistro(sesion?.pais, current[idx].pais)) {
              return NextResponse.json({ error: 'No autorizado: registro de otro país' }, { status: 403, headers: noStore })
            }
            // Sella el país del usuario en el registro (no puede crear para otro país).
            body.item.pais = sesion?.pais || body.item.pais
          }
          if (idx >= 0) current[idx] = body.item
          else current.push(body.item)
          await writeList(KV_KEY, current)
          return NextResponse.json({ ok: true, count: current.length }, { headers: noStore })
        }
        if (body.op === 'delete' && body.id != null) {
          if (scopePais && !veTodo) {
            const target = current.find((r) => r.id === body.id)
            if (target && !puedeAccederRegistro(sesion?.pais, target.pais)) {
              return NextResponse.json({ error: 'No autorizado: registro de otro país' }, { status: 403, headers: noStore })
            }
          }
          const next = current.filter((r) => r.id !== body.id)
          await writeList(KV_KEY, next)
          return NextResponse.json({ ok: true, count: next.length }, { headers: noStore })
        }
        // Reemplazo masivo (set): SOLO permitido con el secreto del servidor.
        // Esto impide que un navegador desactualizado resucite datos viejos.
        if (body.op === 'set' && Array.isArray(body.items)) {
          if (!process.env.CRON_SECRET || body.secret !== process.env.CRON_SECRET) {
            return NextResponse.json(
              { error: 'Reemplazo masivo deshabilitado por seguridad' },
              { status: 403, headers: noStore },
            )
          }
          await writeList(KV_KEY, body.items)
          return NextResponse.json({ ok: true, count: body.items.length }, { headers: noStore })
        }
        return NextResponse.json({ error: 'Operación inválida' }, { status: 400, headers: noStore })
      }

      // ── Array crudo (reemplazo total) BLOQUEADO: lo usaba el código viejo para
      //    resucitar datos. El cliente actual solo usa upsert/delete por registro. ──
      if (Array.isArray(body)) {
        return NextResponse.json(
          { error: 'Reemplazo masivo deshabilitado por seguridad' },
          { status: 403, headers: noStore },
        )
      }

      return NextResponse.json({ error: 'Formato inválido' }, { status: 400, headers: noStore })
    } catch (err) {
      console.error(`[api/${KV_KEY}] POST error:`, err)
      return NextResponse.json({ error: 'Error al guardar' }, { status: 500, headers: noStore })
    }
  }

  return { GET, POST }
}
