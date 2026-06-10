import { create } from 'zustand'
import { Seguimiento } from '@/shared/types/seguimiento'
import { apiUpsert, apiDelete } from '@/shared/lib/list-client'

export type { Seguimiento }

export interface PQRS {
  id: string
  codigo: string
  nro: number
  tipo: string
  prioridad: string
  cliente_id: string
  cliente_nombre: string
  contacto_id: string
  contacto_nombre: string
  asunto: string
  descripcion: string
  fecha_aviso: string
  hora_aviso: string
  persona_avisa: string
  movil_avisa: string
  persona_caso: string
  movil_caso: string
  detalle_incidencia: string
  responsable: string
  fecha_registro: string
  fecha_cierre: string
  seguimientos: Seguimiento[]
  situacion: string
  creado_por?: string
  creado_por_usuario?: string
  creado_en?: string
}

interface PQRSState {
  pqrs: PQRS[]
  loaded: boolean
  loadPQRS: () => Promise<void>
  addPQRS: (p: PQRS) => void
  updatePQRS: (id: string, p: Partial<PQRS>) => void
  deletePQRS: (id: string) => void
}

export const usePQRSStore = create<PQRSState>()((set, get) => ({
  pqrs: [],
  loaded: false,
  loadPQRS: async () => {
    try {
      const res = await fetch('/api/pqrs', { cache: 'no-store' })
      const data = await res.json()
      const kvPQRS: PQRS[] = Array.isArray(data) ? data : []
      set({ pqrs: kvPQRS, loaded: true })
    } catch (err) {
      console.error('[pqrs-store] load error:', err)
      set({ loaded: true })
    }
  },
  addPQRS: (p) => {
    const pqrs = [...get().pqrs, p]
    set({ pqrs })
    apiUpsert('/api/pqrs', p)
  },
  updatePQRS: (id, p) => {
    const prev = get().pqrs.find((r) => r.id === id)
    const item = { ...prev, ...p, id } as PQRS
    const pqrs = get().pqrs.map((r) => (r.id === id ? { ...r, ...p } : r))
    set({ pqrs })
    apiUpsert('/api/pqrs', item)
  },
  deletePQRS: (id) => {
    const pqrs = get().pqrs.filter((r) => r.id !== id)
    set({ pqrs })
    apiDelete('/api/pqrs', id)
  },
}))
