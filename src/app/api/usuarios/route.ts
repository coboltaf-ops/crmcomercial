import { NextRequest, NextResponse } from 'next/server'
import { readList, writeList } from '@/shared/lib/kv-store'
import { verifySession, hashPassword, isHashed } from '@/shared/lib/auth-crypto'
import { esGlobal, filtrarPorPais } from '@/shared/lib/paises'

const KV_KEY = 'usuarios-datos'

type UsuarioRow = Record<string, unknown> & { id?: string; pais?: string; clave?: string; clave_visible?: string }

/** Cifra las claves nuevas y conserva la clave_visible para consulta del Admin. */
function cifrarClaves(data: UsuarioRow[], actual: UsuarioRow[]): UsuarioRow[] {
  return data.map((u) => {
    const clave = u.clave as string | undefined
    const esPlano = !!(clave && !isHashed(clave))
    const prev = actual.find((a) => a.id === u.id)
    return {
      ...u,
      clave: esPlano ? hashPassword(clave as string) : clave,
      clave_visible: esPlano ? clave : ((u.clave_visible as string) ?? prev?.clave_visible ?? ''),
    }
  })
}

// GET — listar usuarios (PROTEGIDO: requiere sesión)
export async function GET(req: NextRequest) {
  const token = req.cookies.get('palomares_session')?.value
  const sesion = verifySession(token)
  if (!sesion) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const data = await readList<UsuarioRow>(KV_KEY)
  const esAdmin = String(sesion.rol || '').toLowerCase() === 'admin'
  const veTodo = esGlobal(String(sesion.pais || ''))
  // Admin/usuario de país: SOLO ve los usuarios de su propio país (GLOBAL ve todos).
  // Un usuario sin país (heredado) queda visible para todos (no se oculta a nadie).
  const visibles = veTodo ? data : filtrarPorPais(data, String(sesion.pais || ''))
  // Las claves (cifrada y visible) SOLO se entregan a sesiones con rol Admin.
  const salida = esAdmin ? visibles : visibles.map((u) => ({ ...u, clave: '', clave_visible: '' }))
  return NextResponse.json(salida)
}

// POST — guardar la lista (PROTEGIDO + cifra las claves nuevas)
export async function POST(req: NextRequest) {
  const token = req.cookies.get('palomares_session')?.value
  const sesion = verifySession(token)
  if (!sesion) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  try {
    const data = await req.json()
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Se esperaba un arreglo de usuarios' }, { status: 400 })
    }
    const actual = await readList<UsuarioRow>(KV_KEY)
    const veTodo = esGlobal(String(sesion.pais || ''))

    let finalList: UsuarioRow[]
    if (veTodo) {
      // Admin GLOBAL: guarda la lista completa. Blindaje anti-vaciado.
      if (Array.isArray(actual) && actual.length > 0 && data.length === 0) {
        console.error('[api/usuarios] BLOQUEADO: intento de vaciar la lista de usuarios')
        return NextResponse.json({ error: 'Bloqueado: no se permite vaciar la lista de usuarios' }, { status: 409 })
      }
      finalList = data as UsuarioRow[]
    } else {
      // Usuario POR PAÍS: solo puede afectar usuarios de SU país. Los de otros países
      // (y los GLOBAL) se preservan intactos desde el KV → nunca puede borrarlos.
      const miPais = String(sesion.pais || '')
      const otros = (actual as UsuarioRow[]).filter((u) => {
        const p = String(u.pais || '')
        return p && p !== miPais // GLOBAL y otros países quedan intactos
      })
      // Sella el país de los usuarios entrantes a su propio país (no puede crear en otro país ni GLOBAL).
      const mios = (data as UsuarioRow[]).map((u) => ({ ...u, pais: miPais }))
      finalList = [...otros, ...mios]
      if (finalList.length === 0) {
        return NextResponse.json({ error: 'Bloqueado: lista vacía' }, { status: 409 })
      }
    }

    const segura = cifrarClaves(finalList, actual as UsuarioRow[])
    await writeList(KV_KEY, segura)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/usuarios] POST error:', err)
    return NextResponse.json({ error: 'Error al guardar usuarios' }, { status: 500 })
  }
}
