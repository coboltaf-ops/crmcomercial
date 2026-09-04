/**
 * Catálogo único de países (modelo "un sistema por empresa" — multipaís).
 *
 * Ver docs/Sistema-por-Empresa-Norton-GTM.pdf.
 *
 * - Cada usuario pertenece a UN país (campo `pais`).
 * - El valor especial GLOBAL = HQ / Admin: ve y administra TODOS los países.
 * - El país viaja con cada registro y el filtro se aplica en el SERVIDOR.
 *
 * Escalar a un país nuevo = agregarlo aquí y activar usuarios. Nada más que desplegar.
 */

/** País especial: HQ / Admin. Ve todos los países. */
export const PAIS_GLOBAL = 'GLOBAL'

export interface Pais {
  /** Valor que se guarda en los registros y en el usuario. */
  codigo: string
  /** Nombre visible. */
  nombre: string
  /** Bandera (emoji) para la UI. */
  bandera: string
  /** false = definido pero aún no operativo (aparece deshabilitado). */
  activo: boolean
}

/**
 * Países de GTM. GTM inicia en Perú; Colombia y Ecuador quedan definidos
 * para activarse después (ver PDF). Sumar uno nuevo = agregar una línea aquí.
 */
export const PAISES: Pais[] = [
  { codigo: 'Colombia', nombre: 'Colombia', bandera: '🇨🇴', activo: true },
  { codigo: 'Perú', nombre: 'Perú', bandera: '🇵🇪', activo: true },
  { codigo: 'Ecuador', nombre: 'Ecuador', bandera: '🇪🇨', activo: false },
]

/** Países disponibles para elegir en formularios (solo los activos). */
export const PAISES_ACTIVOS = PAISES.filter((p) => p.activo)

/** Opción "GLOBAL" para asignar a usuarios de HQ / Admin. */
export const OPCION_GLOBAL: Pais = {
  codigo: PAIS_GLOBAL,
  nombre: 'Global (todos los países)',
  bandera: '🌎',
  activo: true,
}

/** Opciones de país para asignar a un USUARIO (incluye GLOBAL). */
export const PAISES_USUARIO: Pais[] = [OPCION_GLOBAL, ...PAISES]

/** ¿Este país (el de un usuario) ve TODOS los países? */
export function esGlobal(pais: string | undefined | null): boolean {
  return !pais || pais === PAIS_GLOBAL
}

/**
 * Filtra una lista de registros según el país del usuario.
 * - Usuario GLOBAL (o sin país): ve todo.
 * - Usuario de un país: solo ve registros de su país.
 *   Los registros sin país se consideran visibles (compat. datos legados).
 */
export function filtrarPorPais<T extends { pais?: string }>(
  lista: T[],
  paisUsuario: string | undefined | null,
): T[] {
  if (esGlobal(paisUsuario)) return lista
  return lista.filter((r) => !r.pais || r.pais === paisUsuario)
}

/**
 * ¿El usuario (según su país) puede ver/editar/eliminar un registro dado?
 * GLOBAL puede con cualquiera; un usuario de país solo con los de su país
 * (o los que aún no tienen país asignado).
 */
export function puedeAccederRegistro(
  paisUsuario: string | undefined | null,
  paisRegistro: string | undefined | null,
): boolean {
  if (esGlobal(paisUsuario)) return true
  return !paisRegistro || paisRegistro === paisUsuario
}

/** Nombre visible con bandera, p. ej. "🇵🇪 Perú". Para etiquetas de UI. */
export function etiquetaPais(codigo: string | undefined | null): string {
  if (esGlobal(codigo)) return `${OPCION_GLOBAL.bandera} ${OPCION_GLOBAL.nombre}`
  const p = PAISES.find((x) => x.codigo === codigo)
  return p ? `${p.bandera} ${p.nombre}` : String(codigo ?? '')
}
