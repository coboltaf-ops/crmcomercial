import { create } from 'zustand'
import { apiUpsert, apiDelete } from '@/shared/lib/list-client'
import { SEED_MAQUINARIAS } from '../seed-edificio'

// Maquinaria y Equipos PROPIOS de crmgtm (multipaís). Se persisten por registro
// en el servidor (/api/maquinarias-equipos → maquinarias-equipos-datos).
// El servidor filtra y sella el país.

export interface MaquinariaEquipo {
  id: string
  codigo: string
  tipo: string
  marca: string
  categoria: string
  grupo: string
  descripcion: string
  vr_hora: number
  vr_dia: number
  vr_semana: number
  vr_mes: number
  proveedor: string
  pais: string
  situacion: string
  creado_por_usuario?: string
  creado_en?: string
  fecha_registro: string
}

interface MaquinariasState {
  maquinarias: MaquinariaEquipo[]
  loaded: boolean
  loadMaquinarias: () => Promise<void>
  addMaquinaria: (m: MaquinariaEquipo) => void
  updateMaquinaria: (id: string, m: Partial<MaquinariaEquipo>) => void
  deleteMaquinaria: (id: string) => void
}

export const useMaquinariasStore = create<MaquinariasState>()((set, get) => ({
  maquinarias: [],
  loaded: false,
  loadMaquinarias: async () => {
    try {
      const res = await fetch('/api/maquinarias-equipos', { cache: 'no-store' })
      const data = await res.json()
      const kv: MaquinariaEquipo[] = Array.isArray(data) ? data : []
      if (kv.length === 0) {
        const seed = SEED_MAQUINARIAS.map((x) => ({ ...x, pais: 'Colombia' })) as MaquinariaEquipo[]
        set({ maquinarias: seed, loaded: true })
        for (const x of seed) apiUpsert('/api/maquinarias-equipos', x)
        return
      }
      set({ maquinarias: kv, loaded: true })
    } catch (err) {
      console.error('[maquinarias-equipos-store] load error:', err)
      set({ loaded: true })
    }
  },
  addMaquinaria: (m) => {
    const maquinarias = [...get().maquinarias, m]
    set({ maquinarias })
    apiUpsert('/api/maquinarias-equipos', m)
  },
  updateMaquinaria: (id, m) => {
    const maquinarias = get().maquinarias.map(x => x.id === id ? { ...x, ...m } : x)
    set({ maquinarias })
    const actualizado = maquinarias.find(x => x.id === id)
    if (actualizado) apiUpsert('/api/maquinarias-equipos', actualizado)
  },
  deleteMaquinaria: (id) => {
    const maquinarias = get().maquinarias.filter(x => x.id !== id)
    set({ maquinarias })
    apiDelete('/api/maquinarias-equipos', id)
  },
}))
