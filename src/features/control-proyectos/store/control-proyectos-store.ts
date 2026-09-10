import { create } from 'zustand'
import { Seguimiento } from '@/shared/types/seguimiento'
import { apiUpsert, apiDelete } from '@/shared/lib/list-client'

export type { Seguimiento }

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
  cliente_id: string
  cliente_nombre: string
  responsable: string
  situacion: string
  pais?: string
  creado_por?: string
  creado_por_usuario?: string
  creado_en?: string
  seguimientos: Seguimiento[]
  // ── Campos de fases siguientes se agregan aquí cuando toque ──
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
