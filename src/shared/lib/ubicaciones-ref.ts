// ─────────────────────────────────────────────────────────────
// Ubicación geográfica (País → Ciudad) leída desde la tabla jerárquica
// 'ubicaciones' de Referencias. SOLO informativa (dónde está el cliente):
// NO tiene nada que ver con el país de REGISTRO/multipaís (campo `pais`).
// ─────────────────────────────────────────────────────────────
import type { BaseReference } from '@/features/referencias/types'

const norm = (s: string) => (s || '').trim().toLowerCase()

/** Países (nodos raíz) activos, ordenados alfabéticamente. */
export function paisesUbicRef(ubic: BaseReference[]): string[] {
  return (ubic || [])
    .filter((u) => !u.padre_id && u.situacion)
    .map((u) => u.descripcion)
    .sort((a, b) => a.localeCompare(b, 'es'))
}

/** Ciudades activas de un país (por nombre), ordenadas. */
export function ciudadesUbicRef(ubic: BaseReference[], paisNombre: string): string[] {
  if (!paisNombre) return []
  const pais = (ubic || []).find((u) => !u.padre_id && norm(u.descripcion) === norm(paisNombre))
  if (!pais) return []
  return (ubic || [])
    .filter((u) => u.padre_id === pais.id && u.situacion)
    .map((u) => u.descripcion)
    .sort((a, b) => a.localeCompare(b, 'es'))
}

/** Coordenada [lat, lon] de una ciudad por NOMBRE (en cualquier país del catálogo); null si no tiene. */
export function coordDeCiudad(ubic: BaseReference[], ciudad: string): [number, number] | null {
  const c = (ubic || []).find(
    (u) => u.padre_id && norm(u.descripcion) === norm(ciudad) && typeof u.lat === 'number' && typeof u.lon === 'number',
  )
  return c ? [c.lat as number, c.lon as number] : null
}

/** Coordenada (lat/lon) de una ciudad para el mapa; null si no tiene. */
export function coordCiudadRef(
  ubic: BaseReference[],
  paisNombre: string,
  ciudad: string,
): { lat: number; lon: number } | null {
  const pais = (ubic || []).find((u) => !u.padre_id && norm(u.descripcion) === norm(paisNombre))
  if (!pais) return null
  const c = (ubic || []).find((u) => u.padre_id === pais.id && norm(u.descripcion) === norm(ciudad))
  if (c && typeof c.lat === 'number' && typeof c.lon === 'number') return { lat: c.lat, lon: c.lon }
  return null
}
