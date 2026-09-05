import { create } from 'zustand'
import { apiUpsert, apiDelete } from '@/shared/lib/list-client'
import { SEED_PRESUPUESTO_SUBCONTRATISTAS } from '../seed-edificio'

// Presupuesto de Contratistas/Subcontratistas — PROPIO de crmgtm (multipaís).
// Se persiste por registro en el servidor (/api/presupuesto-subcontratistas →
// presupuesto-subcontratistas-datos). El servidor filtra y sella el país.
// Cabecera simplificada (los renglones anidados del origen se resumen a un monto).

export interface PresupuestoSubcontratista {
  id: string
  codigo: string                // PSC-00001
  subcontratista: string        // razón social / representante del contratista
  proyecto: string              // proyecto / obra
  capitulo: string              // capítulo del presupuesto de obra
  descripcion: string           // alcance / descripción
  responsable: string
  monto: number                 // valor total del presupuesto
  moneda: string
  fecha_emision: string
  observaciones: string
  pais: string
  situacion: string             // Recibido | En Revisión | Aprobado | Rechazado
  creado_por?: string
  creado_por_usuario?: string
  creado_en?: string
  fecha_registro: string
}

export const SITUACIONES_PSC = ['Recibido', 'En Revisión', 'Aprobado', 'Rechazado'] as const

interface PresupuestoSubcontratistasState {
  presupuestosSub: PresupuestoSubcontratista[]
  loaded: boolean
  loadPresupuestosSub: () => Promise<void>
  addPresupuestoSub: (p: PresupuestoSubcontratista) => void
  updatePresupuestoSub: (id: string, p: Partial<PresupuestoSubcontratista>) => void
  deletePresupuestoSub: (id: string) => void
}

export const usePresupuestoSubcontratistasStore = create<PresupuestoSubcontratistasState>()((set, get) => ({
  presupuestosSub: [],
  loaded: false,
  loadPresupuestosSub: async () => {
    try {
      const res = await fetch('/api/presupuesto-subcontratistas', { cache: 'no-store' })
      const data = await res.json()
      const kv: PresupuestoSubcontratista[] = Array.isArray(data) ? data : []
      if (kv.length === 0) {
        const seed = SEED_PRESUPUESTO_SUBCONTRATISTAS.map((x) => ({ ...x, pais: 'Colombia' })) as PresupuestoSubcontratista[]
        set({ presupuestosSub: seed, loaded: true })
        for (const x of seed) apiUpsert('/api/presupuesto-subcontratistas', x)
        return
      }
      set({ presupuestosSub: kv, loaded: true })
    } catch (err) {
      console.error('[presupuesto-subcontratistas-store] load error:', err)
      set({ loaded: true })
    }
  },
  addPresupuestoSub: (p) => {
    const presupuestosSub = [...get().presupuestosSub, p]
    set({ presupuestosSub })
    apiUpsert('/api/presupuesto-subcontratistas', p)
  },
  updatePresupuestoSub: (id, p) => {
    const presupuestosSub = get().presupuestosSub.map(x => x.id === id ? { ...x, ...p } : x)
    set({ presupuestosSub })
    const actualizado = presupuestosSub.find(x => x.id === id)
    if (actualizado) apiUpsert('/api/presupuesto-subcontratistas', actualizado)
  },
  deletePresupuestoSub: (id) => {
    const presupuestosSub = get().presupuestosSub.filter(x => x.id !== id)
    set({ presupuestosSub })
    apiDelete('/api/presupuesto-subcontratistas', id)
  },
}))
