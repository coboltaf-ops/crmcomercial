import { NextRequest, NextResponse } from 'next/server'
import { readList } from '@/shared/lib/kv-store'
import { verifyPassword, signSession } from '@/shared/lib/auth-crypto'

const KV_KEY = 'usuarios-datos'

interface Usuario {
  usuario: string
  clave: string
  nombre?: string
  rol?: string
  situacion?: string
}

/**
 * Login SEGURO en el servidor. Verifica la clave aquí (cifrada o legada),
 * nunca devuelve la lista de usuarios ni las claves. Solo LEE (no modifica datos).
 */
export async function POST(req: NextRequest) {
  try {
    const { usuario, clave } = await req.json()
    if (!usuario || !clave) {
      return NextResponse.json({ ok: false, error: 'Faltan credenciales.' }, { status: 400 })
    }

    const usuarios = await readList<Usuario>(KV_KEY)
    const u = usuarios.find(
      (x) =>
        (x.usuario || '').trim().toLowerCase() === String(usuario).trim().toLowerCase() &&
        (x.situacion ?? 'Activo') === 'Activo'
    )

    if (!u || !verifyPassword(String(clave), u.clave)) {
      return NextResponse.json({ ok: false, error: 'Usuario o clave incorrectos.' }, { status: 401 })
    }

    const token = signSession({ usuario: u.usuario, rol: u.rol ?? '', nombre: u.nombre ?? '', pais: (u as { pais?: string }).pais ?? '' })
    // Devuelve el usuario COMPLETO (permisos, rol, etc.) pero con la clave en BLANCO.
    const safeUser = { ...u, clave: '' }
    const res = NextResponse.json({ ok: true, user: safeUser })
    res.cookies.set('palomares_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12,
    })
    return res
  } catch {
    return NextResponse.json({ ok: false, error: 'Error procesando el login.' }, { status: 500 })
  }
}
