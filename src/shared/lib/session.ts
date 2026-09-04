/**
 * Lectura de la sesión en el SERVIDOR (para las APIs).
 *
 * La sesión es una cookie httpOnly firmada (ver auth-crypto.ts). Aquí se lee
 * de forma uniforme para saber quién es el usuario y —clave para el modelo
 * multipaís— a qué país pertenece, y así filtrar los datos en el servidor.
 */
import { NextRequest } from 'next/server'
import { verifySession } from '@/shared/lib/auth-crypto'
import { esGlobal } from '@/shared/lib/paises'

export interface Sesion {
  usuario: string
  rol: string
  nombre: string
  /** País del usuario. GLOBAL / vacío = ve todos los países. */
  pais: string
}

/** Devuelve la sesión válida de la petición, o null si no hay/está vencida. */
export function getSesion(req: NextRequest): Sesion | null {
  const token = req.cookies.get('palomares_session')?.value
  const payload = verifySession(token)
  if (!payload) return null
  return {
    usuario: String(payload.usuario ?? ''),
    rol: String(payload.rol ?? ''),
    nombre: String(payload.nombre ?? ''),
    pais: String(payload.pais ?? ''),
  }
}

/** ¿La sesión ve TODOS los países? (rol Admin o país GLOBAL). */
export function sesionVeTodo(sesion: Sesion | null): boolean {
  if (!sesion) return false
  return String(sesion.rol).toLowerCase() === 'admin' || esGlobal(sesion.pais)
}
