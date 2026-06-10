import { create } from 'zustand'
import { Seguimiento } from '@/shared/types/seguimiento'
import { apiUpsert, apiDelete, apiSet } from '@/shared/lib/list-client'

export type { Seguimiento }

export interface Prospecto {
  id: string
  external_id?: string
  codigo: string
  nombre: string
  apellido: string
  empresa: string
  correo: string
  nro_movil: string
  origen_prospecto: string
  detalle_requerimiento: string
  actividad: string
  ciudad: string
  pais: string
  situacion: string
  creado_por?: string
  creado_en?: string
  fecha_registro: string
  seguimientos: Seguimiento[]
}

interface ProspectosState {
  prospectos: Prospecto[]
  loaded: boolean
  loadProspectos: () => Promise<void>
  addProspecto: (p: Prospecto) => void
  updateProspecto: (id: string, p: Partial<Prospecto>) => void
  deleteProspecto: (id: string) => void
}

export const useProspectosStore = create<ProspectosState>()((set, get) => ({
  prospectos: [],
  loaded: false,
  loadProspectos: async () => {
    try {
      const res = await fetch('/api/prospectos', { cache: 'no-store' })
      const data = await res.json()
      const kvProspectos: Prospecto[] = Array.isArray(data) ? data : []

      // Migración suave: si KV está vacío pero el navegador tiene datos del
      // localStorage antiguo ('crm-prospectos-storage'), súbelos a KV una sola vez.
      if (kvProspectos.length === 0 && typeof window !== 'undefined') {
        try {
          const raw = window.localStorage.getItem('crm-prospectos-storage')
          const legacy: Prospecto[] = raw ? (JSON.parse(raw)?.state?.prospectos || []) : []
          if (legacy.length > 0) {
            set({ prospectos: legacy, loaded: true })
            await apiSet('/api/prospectos', legacy, true)
            return
          }
        } catch (e) {
          console.error('[prospectos-store] migración localStorage error:', e)
        }
      }

      set({ prospectos: kvProspectos, loaded: true })
    } catch (err) {
      console.error('[prospectos-store] load error:', err)
      set({ loaded: true })
    }
  },
  addProspecto: (p) => {
    const prospectos = [...get().prospectos, p]
    set({ prospectos })
    apiUpsert('/api/prospectos', p)
  },
  updateProspecto: (id, p) => {
    const prev = get().prospectos.find((r) => r.id === id)
    const item = { ...(prev ?? ({} as Prospecto)), ...p, id }
    const prospectos = get().prospectos.map((r) => (r.id === id ? { ...r, ...p } : r))
    set({ prospectos })
    apiUpsert('/api/prospectos', item)
  },
  deleteProspecto: (id) => {
    const prospectos = get().prospectos.filter((r) => r.id !== id)
    set({ prospectos })
    apiDelete('/api/prospectos', id)
  },
}))
