import { NextRequest, NextResponse } from 'next/server'
import { readList, writeList } from '@/shared/lib/kv-store'
import { verifySession, hashPassword, isHashed } from '@/shared/lib/auth-crypto'

const KV_KEY = 'usuarios-datos'

// Solo usuarios con sesión válida pueden ver/guardar la lista (ya NO es público).
function autorizado(req: NextRequest): boolean {
  const token = req.cookies.get('palomares_session')?.value
  return verifySession(token) !== null
}

// GET — listar usuarios (PROTEGIDO: requiere sesión)
export async function GET(req: NextRequest) {
  const token = req.cookies.get('palomares_session')?.value
  const sesion = verifySession(token)
  if (!sesion) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const data = await readList<Record<string, unknown>>(KV_KEY)
  // Las claves (cifrada y visible) SOLO se entregan a sesiones con rol Admin.
  const esAdmin = String(sesion.rol || '').toLowerCase() === 'admin'
  const salida = esAdmin ? data : data.map((u) => ({ ...u, clave: '', clave_visible: '' }))
  return NextResponse.json(salida)
}

// POST — guardar la lista (PROTEGIDO + cifra las claves nuevas)
export async function POST(req: NextRequest) {
  if (!autorizado(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  try {
    const data = await req.json()
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Se esperaba un arreglo de usuarios' }, { status: 400 })
    }
    // BLINDAJE ANTI-BORRADO: nunca permitir vaciar una lista que YA tiene usuarios.
    // Esto evita que un fallo de sesión/red sobrescriba a todos los usuarios.
    const actual = await readList<Record<string, unknown>>(KV_KEY)
    if (Array.isArray(actual) && actual.length > 0 && data.length === 0) {
      console.error('[api/usuarios] BLOQUEADO: intento de vaciar la lista de usuarios')
      return NextResponse.json({ error: 'Bloqueado: no se permite vaciar la lista de usuarios' }, { status: 409 })
    }
    // Cifra las claves nuevas para el login; y guarda una copia VISIBLE (texto plano)
    // SOLO para que un Admin pueda consultarla dentro del módulo de Usuarios.
    const segura = data.map((u: Record<string, unknown>) => {
      const clave = u.clave as string | undefined
      const esPlano = !!(clave && !isHashed(clave))
      const prev = actual.find((a) => (a as { id?: string }).id === (u as { id?: string }).id) as { clave_visible?: string } | undefined
      return {
        ...u,
        clave: esPlano ? hashPassword(clave as string) : clave,
        clave_visible: esPlano ? clave : ((u.clave_visible as string) ?? prev?.clave_visible ?? ''),
      }
    })
    await writeList(KV_KEY, segura)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/usuarios] POST error:', err)
    return NextResponse.json({ error: 'Error al guardar usuarios' }, { status: 500 })
  }
}
