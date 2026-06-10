import { create } from 'zustand'
import { Seguimiento } from '@/shared/types/seguimiento'
import { apiUpsert, apiDelete, apiSet } from '@/shared/lib/list-client'

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
  situacion: string
  creado_por?: string
  creado_por_usuario?: string
  creado_en?: string
  fecha_registro: string
  seguimientos: Seguimiento[]
}

const defaultSituaciones: SituacionTarea[] = [
  { id: 'pendiente', nombre: 'Pendiente', color: 'yellow' },
  { id: 'en-proceso', nombre: 'En Proceso', color: 'blue' },
  { id: 'completada', nombre: 'Completada', color: 'green' },
  { id: 'cancelada', nombre: 'Cancelada', color: 'red' },
]

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

      // Migración suave: si KV está vacío pero el navegador tiene datos del
      // localStorage antiguo ('crm-tareas-storage'), súbelos a KV una sola vez.
      if (kvTareas.length === 0 && typeof window !== 'undefined') {
        try {
          const raw = window.localStorage.getItem('crm-tareas-storage')
          const legacy: Tarea[] = raw ? (JSON.parse(raw)?.state?.tareas || []) : []
          if (legacy.length > 0) {
            set({ tareas: legacy, loaded: true })
            await apiSet('/api/tareas', legacy, true)
            return
          }
        } catch (e) {
          console.error('[tareas-store] migración localStorage error:', e)
        }
      }

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
