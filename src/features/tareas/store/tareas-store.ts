import { create } from 'zustand'
import { Seguimiento } from '@/shared/types/seguimiento'
import { apiUpsert, apiDelete } from '@/shared/lib/list-client'

export type { Seguimiento }

export interface SituacionTarea {
  id: string
  nombre: string
  color: string // yellow | blue | green | gray | red
}

export interface Tarea {
  id: string
  codigo: string
  fecha_asignacion: string
  hora_asignacion: string
  persona_asigna: string
  persona_ejecuta: string
  fecha_requerida_fin: string
  fecha_real_fin: string
  descripcion: string
  origen_tarea?: string
  origen_codigo?: string
  cliente_nombre?: string
  proyecto?: string
  situacion: string
  creado_por?: string
  creado_por_usuario?: string
  creado_en?: string
  fecha_registro: string
  seguimientos: Seguimiento[]
  pais?: string
}

const defaultSituaciones: SituacionTarea[] = [
  { id: 'pendiente', nombre: 'Pendiente', color: 'yellow' },
  { id: 'en-proceso', nombre: 'En Proceso', color: 'blue' },
  { id: 'finalizada', nombre: 'Finalizada', color: 'green' },
  { id: 'cancelada', nombre: 'Cancelada', color: 'purple' },
  { id: 'anulada', nombre: 'Anulada', color: 'red' },
]

/** Estado "finalizado" de una tarea. Acepta 'Finalizada' (nuevo) y 'Completada' (datos viejos). */
export const esTareaFinalizada = (s?: string) => s === 'Finalizada' || s === 'Completada'

/** Mensaje estándar de notificación (WhatsApp) para una tarea asignada. */
export function mensajeWhatsAppTarea(t: Tarea): string {
  const fFecha = (d?: string) => { if (!d) return '—'; const [y, m, dd] = d.split('-'); return (dd && m && y) ? `${dd}/${m}/${y}` : d }
  const origen = t.origen_tarea === 'Oportunidad' ? `Oportunidad N° ${t.origen_codigo || ''}`.trim()
    : t.origen_tarea === 'Seguimiento Oferta' ? `Seguimiento Oferta N° ${t.origen_codigo || ''}`.trim()
    : 'Tarea Independiente'
  const fechaHora = `${fFecha(t.fecha_asignacion)}${t.hora_asignacion ? ' ' + t.hora_asignacion : ''}`
  return [
    `Hola ${t.persona_ejecuta},`,
    `Se te ha asignado una nueva tarea (${t.codigo}).`,
    `Persona que te asigna: ${t.persona_asigna}`,
    `Fecha y hora: ${fechaHora}`,
    `Viene de: ${origen}`,
    `Fecha en que debes terminar la tarea: ${fFecha(t.fecha_requerida_fin)}`,
    `Detalle del requerimiento: ${t.descripcion}`,
  ].join('\n')
}

interface TareasState {
  tareas: Tarea[]
  situaciones: SituacionTarea[]
  loaded: boolean
  loadTareas: () => Promise<void>
  addTarea: (t: Tarea) => void
  updateTarea: (id: string, t: Partial<Tarea>) => void
  deleteTarea: (id: string) => void
  addSituacion: (s: SituacionTarea) => void
  updateSituacion: (id: string, s: Partial<SituacionTarea>) => void
  deleteSituacion: (id: string) => void
}

export const useTareasStore = create<TareasState>()((set, get) => ({
  tareas: [],
  situaciones: defaultSituaciones,
  loaded: false,
  loadTareas: async () => {
    try {
      const res = await fetch('/api/tareas', { cache: 'no-store' })
      const data = await res.json()
      const kvTareas: Tarea[] = Array.isArray(data) ? data : []
      set({ tareas: kvTareas, loaded: true })
    } catch (err) {
      console.error('[tareas-store] load error:', err)
      set({ loaded: true })
    }
  },
  addTarea: (t) => {
    const tareas = [...get().tareas, t]
    set({ tareas })
    apiUpsert('/api/tareas', t)
  },
  updateTarea: (id, t) => {
    const prev = get().tareas.find((r) => r.id === id)
    const item = { ...(prev ?? ({} as Tarea)), ...t, id }
    const tareas = get().tareas.map((r) => (r.id === id ? { ...r, ...t } : r))
    set({ tareas })
    apiUpsert('/api/tareas', item)
  },
  deleteTarea: (id) => {
    const tareas = get().tareas.filter((r) => r.id !== id)
    set({ tareas })
    apiDelete('/api/tareas', id)
  },
  addSituacion: (sit) => set((s) => ({ situaciones: [...s.situaciones, sit] })),
  updateSituacion: (id, sit) => set((s) => ({ situaciones: s.situaciones.map((r) => r.id === id ? { ...r, ...sit } : r) })),
  deleteSituacion: (id) => set((s) => ({ situaciones: s.situaciones.filter((r) => r.id !== id) })),
}))
