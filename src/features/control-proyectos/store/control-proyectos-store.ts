import { create } from 'zustand'
import { Seguimiento } from '@/shared/types/seguimiento'
import { apiUpsert, apiDelete } from '@/shared/lib/list-client'

export type { Seguimiento }

/**
 * Partida del WBS (estructura jerárquica capítulo > partida > sub-partida).
 * El nivel se deriva del código: "1" = 1, "1.1" = 2, "1.1.1" = 3.
 * Fase 2a: presupuesto (línea base). Las capas Proyectado/Real/etc. y los
 * cortes por semana/mes se agregan en fases siguientes.
 */
export interface Partida {
  id: string
  codigo: string              // "1", "1.1", "1.1.1"
  item: string                // nombre de la partida
  unidad: string              // glb, Kg, Ton, m2, un...
  cantidad: number
  valor_unitario: number
  total_presupuesto: number   // línea base (viene del Excel o cantidad × VU)
}

/**
 * Corte de avance (Fase 3). Cada corte es un punto histórico de la Curva S:
 * el % de avance acumulado PLANEADO vs REAL a una fecha. La desviación se
 * calcula (real − plan). Pensados como registro histórico (no se sobrescriben).
 */
export interface Corte {
  id: string
  periodo: string      // "Semana 1", "Mayo", etc.
  fecha: string        // fecha del corte
  pct_plan: number     // % avance PLANEADO acumulado (0–100)
  pct_real: number     // % avance REAL acumulado (0–100)
  nota?: string        // hito / observación del período
  // ── Fase 4: Curva S financiera ($ acumulados) — opcionales ──
  monto_plan?: number  // presupuesto acumulado ($)
  monto_real?: number  // costo real acumulado ($)
  monto_fact?: number  // facturación acumulada ($)
}

/** Nivel jerárquico según el código WBS ("1"->1, "1.2"->2, "1.2.3"->3). */
export const nivelDeCodigo = (codigo: string): number =>
  String(codigo || '').replace(/\.+$/, '').split('.').filter(Boolean).length || 1

/** ¿El código es una hoja (no tiene hijos en la lista)? Sirve para sumar sin duplicar. */
export const esHoja = (codigo: string, todos: string[]): boolean => {
  const pref = String(codigo || '').replace(/\.+$/, '') + '.'
  return !todos.some(c => String(c || '').replace(/\.+$/, '').startsWith(pref))
}

/**
 * Módulo NUEVO: Control de Proyectos (dashboard gerencial).
 * Corresponde a la Sección I del documento de especificación de Norton.
 * OJO: es un módulo aparte del "Proyectos" actual (ese NO se toca).
 *
 * 🚧 EN CONSTRUCCIÓN — el modelo de datos se irá ampliando por fases:
 *   Fase 1: ficha del proyecto + datos base (esta interfaz)
 *   Fase 2: WBS / partidas jerárquicas con peso  (se define con el Excel real)
 *   Fase 3: cortes de avance (histórico inmutable)
 *   Fase 4: Curva S + KPIs
 *   Fase 5: portafolio + semáforos + cartera
 *   Fase 6: alertas + exportación
 */
export interface ControlProyecto {
  id: string
  codigo: string              // consecutivo automático (CTP-XXX)
  fecha_registro: string      // automática del día
  nombre_proyecto: string
  codigo_proyecto: string     // código interno del proyecto (opcional)
  cliente_id: string
  cliente_nombre: string
  descripcion: string         // alcance del proyecto
  responsable: string         // gerente / responsable del proyecto
  tipo_contrato: string
  // ── Línea base (viene de la oferta ganada; se detalla por partidas en Fase 2) ──
  presupuesto_base: number    // valor total aprobado (línea base)
  tipo_moneda: string
  // ── Cronograma línea base (fechas macro; el detalle por partida va en Fase 2/3) ──
  fecha_inicio_plan: string
  fecha_fin_plan: string
  fecha_inicio_real: string
  frecuencia_corte: string    // 'Semanal' | 'Mensual' — para la Curva S (Fase 3/4)
  // ── Vínculos para evitar doble digitación ──
  oferta_id?: string          // Seguimiento Oferta de origen
  oferta_nro?: string
  proyecto_id?: string        // Proyecto del módulo actual (opcional)
  situacion: string
  pais?: string
  creado_por?: string
  creado_por_usuario?: string
  creado_en?: string
  seguimientos: Seguimiento[]
  // ── Fase 2a: WBS / partidas con presupuesto (línea base) ──
  partidas?: Partida[]
  // ── Fase 3: cortes de avance (histórico para la Curva S) ──
  cortes?: Corte[]
  // ── Fase 4: datos financieros del Resumen Gerencial (nivel proyecto) ──
  costo_presupuestado?: number  // costo directo previsto (línea base)
  valor_proyectado?: number     // valor total proyectado (reestimado)
  costo_proyectado?: number     // costo proyectado
  ingresos_real?: number        // ingresos reales (recaudado / cobrado)
  egresos_real?: number         // egresos reales (costos incurridos)
  facturado_acum?: number       // facturación acumulada a la fecha
  // ── Fase 2b+: capas Proyectado/Real por partida, eje semanal→mensual, etc. ──
}

interface ControlProyectosState {
  items: ControlProyecto[]
  loaded: boolean
  loadItems: () => Promise<void>
  addItem: (p: ControlProyecto) => void
  updateItem: (id: string, p: Partial<ControlProyecto>) => void
  deleteItem: (id: string) => void
}

export const useControlProyectosStore = create<ControlProyectosState>()((set, get) => ({
  items: [],
  loaded: false,
  loadItems: async () => {
    try {
      const res = await fetch('/api/control-proyectos', { cache: 'no-store' })
      const data = await res.json()
      set({ items: Array.isArray(data) ? data : [], loaded: true })
    } catch (err) {
      console.error('[control-proyectos-store] load error:', err)
      set({ loaded: true })
    }
  },
  addItem: (p) => {
    set({ items: [...get().items, p] })
    apiUpsert('/api/control-proyectos', p)
  },
  updateItem: (id, p) => {
    const prev = get().items.find((r) => r.id === id)
    const item = { ...prev, ...p, id } as ControlProyecto
    set({ items: get().items.map((r) => (r.id === id ? { ...r, ...p } : r)) })
    apiUpsert('/api/control-proyectos', item)
  },
  deleteItem: (id) => {
    set({ items: get().items.filter((r) => r.id !== id) })
    apiDelete('/api/control-proyectos', id)
  },
}))
