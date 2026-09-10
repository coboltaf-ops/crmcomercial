import { makeListHandlers } from '@/shared/lib/list-route'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Módulo NUEVO (Sección I del documento de especificación) — dashboard gerencial de
// control de proyectos: Curva S, WBS/partidas, cortes de avance, KPIs.
// Datos independientes del módulo "Proyectos" actual (no se toca ese).
export const { GET, POST } = makeListHandlers('control-proyectos-datos', { scopePais: true })
