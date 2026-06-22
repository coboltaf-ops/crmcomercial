import { create } from 'zustand'
import { apiUpsert, apiDelete } from '@/shared/lib/list-client'

export interface FactorMoneda {
  id: string
  codigo: string              // Consecutivo automático (FCM-XXXXX)
  fecha_registro: string      // automática del día
  factor_pesos_usd: number    // Factor Pesos a US$
  factor_usd_euro: number     // Factor US$ a Euro
  situacion: string           // Activo / Inactivo
  creado_por?: string
  creado_por_usuario?: string
  creado_en?: string
}

interface FactoresState {
  factores: FactorMoneda[]
  loaded: boolean
  loadFactores: () => Promise<void>
  addFactor: (f: FactorMoneda) => void
  updateFactor: (id: string, f: Partial<FactorMoneda>) => void
  deleteFactor: (id: string) => void
}

export const useFactoresStore = create<FactoresState>()((set, get) => ({
  factores: [],
  loaded: false,
  loadFactores: async () => {
    try {
      const res = await fetch('/api/factores-monedas', { cache: 'no-store' })
      const data = await res.json()
      const kv: FactorMoneda[] = Array.isArray(data) ? data : []
      set({ factores: kv, loaded: true })
    } catch (err) {
      console.error('[factores-store] load error:', err)
      set({ loaded: true })
    }
  },
  addFactor: (f) => {
    const factores = [...get().factores, f]
    set({ factores })
    apiUpsert('/api/factores-monedas', f)
  },
  updateFactor: (id, f) => {
    const prev = get().factores.find((r) => r.id === id)
    const item = { ...prev, ...f, id } as FactorMoneda
    const factores = get().factores.map((r) => (r.id === id ? { ...r, ...f } : r))
    set({ factores })
    apiUpsert('/api/factores-monedas', item)
  },
  deleteFactor: (id) => {
    const factores = get().factores.filter((r) => r.id !== id)
    set({ factores })
    apiDelete('/api/factores-monedas', id)
  },
}))
