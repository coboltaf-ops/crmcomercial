import { create } from 'zustand'
import { apiUpsert, apiDelete } from '@/shared/lib/list-client'

// Contratistas (subcontratistas) PROPIOS de crmgtm (multipaís). Se persisten por
// registro en el servidor (/api/subcontratistas → subcontratistas-datos).
// El servidor filtra y sella el país.

export interface Subcontratista {
  id: string
  codigo: string
  tipo_subcontratista: string
  tipo_identificacion: string
  nro_documento: string
  correo: string
  nro_celular: string
  actividad: string
  representante_legal: string
  direccion: string
  ciudad: string
  pais: string
  situacion: string
  creado_por_usuario?: string
  creado_en?: string
  fecha_registro: string
}

interface SubcontratistasState {
  subcontratistas: Subcontratista[]
  loaded: boolean
  loadSubcontratistas: () => Promise<void>
  addSubcontratista: (s: Subcontratista) => void
  updateSubcontratista: (id: string, s: Partial<Subcontratista>) => void
  deleteSubcontratista: (id: string) => void
}

export const useSubcontratistasStore = create<SubcontratistasState>()((set, get) => ({
  subcontratistas: [],
  loaded: false,
  loadSubcontratistas: async () => {
    try {
      const res = await fetch('/api/subcontratistas', { cache: 'no-store' })
      const data = await res.json()
      const kv: Subcontratista[] = Array.isArray(data) ? data : []
      set({ subcontratistas: kv, loaded: true })
    } catch (err) {
      console.error('[subcontratistas-store] load error:', err)
      set({ loaded: true })
    }
  },
  addSubcontratista: (s) => {
    const subcontratistas = [...get().subcontratistas, s]
    set({ subcontratistas })
    apiUpsert('/api/subcontratistas', s)
  },
  updateSubcontratista: (id, s) => {
    const subcontratistas = get().subcontratistas.map(x => x.id === id ? { ...x, ...s } : x)
    set({ subcontratistas })
    const actualizado = subcontratistas.find(x => x.id === id)
    if (actualizado) apiUpsert('/api/subcontratistas', actualizado)
  },
  deleteSubcontratista: (id) => {
    const subcontratistas = get().subcontratistas.filter(x => x.id !== id)
    set({ subcontratistas })
    apiDelete('/api/subcontratistas', id)
  },
}))
