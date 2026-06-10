import { create } from 'zustand'
import { Seguimiento } from '@/shared/types/seguimiento'
import { apiUpsert, apiDelete } from '@/shared/lib/list-client'

export type { Seguimiento }

export interface Proyecto {
  id: string
  codigo: string              // Nro consecutivo automático (PRY-XXX)
  fecha_registro: string      // automática del día
  codigo_proyecto: string     // código del proyecto (ingresado por el usuario)
  cliente_id: string
  cliente_nombre: string
  descripcion: string         // descripción detallada del proyecto
  fecha_estimada_inicio: string
  fecha_real_inicio: string
  es_consorcio: boolean       // el proyecto es con consorcio (Sí/No)
  nombre_consorcio: string
  responsable: string         // responsable del proyecto
  monto_aprobado: number
  monto_cobrado: number
  tipo_moneda: string
  situacion: string
  creado_por?: string
  creado_por_usuario?: string
  creado_en?: string
  seguimientos: Seguimiento[]
}

interface ProyectosState {
  proyectos: Proyecto[]
  loaded: boolean
  loadProyectos: () => Promise<void>
  addProyecto: (p: Proyecto) => void
  updateProyecto: (id: string, p: Partial<Proyecto>) => void
  deleteProyecto: (id: string) => void
}

export const useProyectosStore = create<ProyectosState>()((set, get) => ({
  proyectos: [],
  loaded: false,
  loadProyectos: async () => {
    try {
      const res = await fetch('/api/proyectos', { cache: 'no-store' })
      const data = await res.json()
      const kvProyectos: Proyecto[] = Array.isArray(data) ? data : []
      set({ proyectos: kvProyectos, loaded: true })
    } catch (err) {
      console.error('[proyectos-store] load error:', err)
      set({ loaded: true })
    }
  },
  addProyecto: (p) => {
    const proyectos = [...get().proyectos, p]
    set({ proyectos })
    apiUpsert('/api/proyectos', p)
  },
  updateProyecto: (id, p) => {
    const prev = get().proyectos.find((r) => r.id === id)
    const item = { ...prev, ...p, id } as Proyecto
    const proyectos = get().proyectos.map((r) => (r.id === id ? { ...r, ...p } : r))
    set({ proyectos })
    apiUpsert('/api/proyectos', item)
  },
  deleteProyecto: (id) => {
    const proyectos = get().proyectos.filter((r) => r.id !== id)
    set({ proyectos })
    apiDelete('/api/proyectos', id)
  },
}))
