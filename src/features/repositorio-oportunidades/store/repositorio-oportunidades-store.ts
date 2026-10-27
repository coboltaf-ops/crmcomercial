import { create } from 'zustand'
import { Oportunidad } from '@/features/oportunidades/store/oportunidades-store'
import { apiUpsert, apiDelete } from '@/shared/lib/list-client'

const API = '/api/repositorio-oportunidades'

/** Oportunidad archivada en el Repositorio (imagen de la oportunidad Perdida). */
export interface OportunidadArchivada extends Oportunidad {
  archivado_en?: string
  archivado_por?: string
}

interface RepositorioOportunidadesState {
  archivadas: OportunidadArchivada[]
  loaded: boolean
  loadArchivadas: () => Promise<void>
  archivar: (o: OportunidadArchivada) => void
  quitar: (id: string) => void
}

export const useRepositorioOportunidadesStore = create<RepositorioOportunidadesState>()((set, get) => ({
  archivadas: [],
  loaded: false,
  loadArchivadas: async () => {
    try {
      const res = await fetch(API, { cache: 'no-store' })
      const data = await res.json()
      set({ archivadas: Array.isArray(data) ? data : [], loaded: true })
    } catch (err) {
      console.error('[repositorio-oportunidades-store] load error:', err)
      set({ loaded: true })
    }
  },
  archivar: (o) => {
    set({ archivadas: [...get().archivadas.filter(r => r.id !== o.id), o] })
    apiUpsert(API, o)
  },
  quitar: (id) => {
    set({ archivadas: get().archivadas.filter(r => r.id !== id) })
    apiDelete(API, id)
  },
}))
