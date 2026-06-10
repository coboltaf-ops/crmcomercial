import { NextRequest, NextResponse } from 'next/server'
import { readList, writeList } from '@/shared/lib/kv-store'

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

type WithId = { id?: string | number }

export function makeListHandlers(KV_KEY: string) {
  async function GET() {
    const data = await readList(KV_KEY)
    return NextResponse.json(data, { headers: noStore })
  }

  async function POST(req: NextRequest) {
    try {
      const body = await req.json()
      const current = await readList<WithId>(KV_KEY)

      // ── Operaciones por registro ──
      if (body && typeof body === 'object' && !Array.isArray(body) && 'op' in body) {
        if (body.op === 'upsert' && body.item && body.item.id != null) {
          const idx = current.findIndex((r) => r.id === body.item.id)
          if (idx >= 0) current[idx] = body.item
          else current.push(body.item)
          await writeList(KV_KEY, current)
          return NextResponse.json({ ok: true, count: current.length }, { headers: noStore })
        }
        if (body.op === 'delete' && body.id != null) {
          const next = current.filter((r) => r.id !== body.id)
          await writeList(KV_KEY, next)
          return NextResponse.json({ ok: true, count: next.length }, { headers: noStore })
        }
        if (body.op === 'set' && Array.isArray(body.items)) {
          if (body.items.length === 0 && current.length > 0 && !body.force) {
            return NextResponse.json(
              { error: 'Bloqueado: vaciar una lista con datos requiere force' },
              { status: 409, headers: noStore },
            )
          }
          await writeList(KV_KEY, body.items)
          return NextResponse.json({ ok: true, count: body.items.length }, { headers: noStore })
        }
        return NextResponse.json({ error: 'Operación inválida' }, { status: 400, headers: noStore })
      }

      // ── Compatibilidad: array crudo = reemplazo total, con guardia anti-vaciado ──
      if (Array.isArray(body)) {
        if (body.length === 0 && current.length > 0) {
          return NextResponse.json(
            { error: 'Bloqueado: intento de vaciar una lista con datos' },
            { status: 409, headers: noStore },
          )
        }
        await writeList(KV_KEY, body)
        return NextResponse.json({ ok: true, count: body.length }, { headers: noStore })
      }

      return NextResponse.json({ error: 'Formato inválido' }, { status: 400, headers: noStore })
    } catch (err) {
      console.error(`[api/${KV_KEY}] POST error:`, err)
      return NextResponse.json({ error: 'Error al guardar' }, { status: 500, headers: noStore })
    }
  }

  return { GET, POST }
}
