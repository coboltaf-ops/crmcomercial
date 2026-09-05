import { create } from 'zustand'
import { apiUpsert, apiDelete } from '@/shared/lib/list-client'

// Presupuesto de Obras PROPIO de crmgtm (multipaís). Se persiste por registro en el
// servidor (/api/presupuesto-obras → presupuesto-obras-datos). El servidor filtra y
// sella el país. Es un registro de CABECERA (sin cálculos APU ni gráficos): resume
// lo que en TAMOIN estaba anidado (renglones/etapas) a campos simples.

export interface PresupuestoObra {
  id: string
  codigo: string
  obra: string            // Obra / Proyecto
  cliente: string
  capitulo: string
  descripcion: string
  valor_total: number     // Monto / valor total del presupuesto
  moneda: string          // PEN | USD | COP …
  avance: number          // % de avance
  pais: string
  situacion: string       // Activo | Cerrado | Anulado
  creado_por_usuario?: string
  creado_en?: string
  fecha_registro: string
}

interface PresupuestoObrasState {
  presupuestos: PresupuestoObra[]
  loaded: boolean
  loadPresupuestos: () => Promise<void>
  addPresupuesto: (p: PresupuestoObra) => void
  updatePresupuesto: (id: string, p: Partial<PresupuestoObra>) => void
  deletePresupuesto: (id: string) => void
}

export const usePresupuestoObrasStore = create<PresupuestoObrasState>()((set, get) => ({
  presupuestos: [],
  loaded: false,
  loadPresupuestos: async () => {
    try {
      const res = await fetch('/api/presupuesto-obras', { cache: 'no-store' })
      const data = await res.json()
      const kv: PresupuestoObra[] = Array.isArray(data) ? data : []
      set({ presupuestos: kv, loaded: true })
    } catch (err) {
      console.error('[presupuesto-obras-store] load error:', err)
      set({ loaded: true })
    }
  },
  addPresupuesto: (p) => {
    const presupuestos = [...get().presupuestos, p]
    set({ presupuestos })
    apiUpsert('/api/presupuesto-obras', p)
  },
  updatePresupuesto: (id, p) => {
    const presupuestos = get().presupuestos.map(x => x.id === id ? { ...x, ...p } : x)
    set({ presupuestos })
    const actualizado = presupuestos.find(x => x.id === id)
    if (actualizado) apiUpsert('/api/presupuesto-obras', actualizado)
  },
  deletePresupuesto: (id) => {
    const presupuestos = get().presupuestos.filter(x => x.id !== id)
    set({ presupuestos })
    apiDelete('/api/presupuesto-obras', id)
  },
}))
