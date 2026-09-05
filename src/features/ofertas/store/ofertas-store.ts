import { create } from 'zustand'
import { apiUpsert, apiDelete } from '@/shared/lib/list-client'
import { stampCreacion, registrarAuditoria, type Auditoria } from '@/shared/lib/audit'
import { type Oferta } from '../types'
import { SEED_OFERTAS } from '../seed-oferta-edificio'

// Presupuesto Ofertas — PROPIO de crmgtm (multipaís). Se persiste POR REGISTRO en el
// servidor (/api/ofertas → ofertas-datos). El servidor filtra y sella el país:
// cada usuario ve/administra solo las ofertas de su país; GLOBAL/Admin ve todas.
// País por defecto de la siembra demo del edificio (visible para GLOBAL y ese país).
const PAIS_SEED = 'Colombia'

interface OfertasState {
  ofertas: Oferta[]
  loaded: boolean
  loadOfertas: () => Promise<void>
  addOferta: (o: Oferta) => void
  updateOferta: (id: string, o: Partial<Oferta>) => void
  deleteOferta: (id: string) => void
  setOfertas: (o: Oferta[]) => void
}

export const useOfertasStore = create<OfertasState>()((set, get) => ({
  ofertas: [],
  loaded: false,
  loadOfertas: async () => {
    try {
      const res = await fetch('/api/ofertas', { cache: 'no-store' })
      const data = await res.json()
      const kv: Oferta[] = Array.isArray(data) ? data : []
      if (kv.length > 0) {
        set({ ofertas: kv, loaded: true })
        return
      }
      // Servidor vacío: sembrar el edificio demo (una sola vez) en el servidor.
      const seed: Oferta[] = SEED_OFERTAS.map((o) => ({ ...o, pais: PAIS_SEED }))
      set({ ofertas: seed, loaded: true })
      for (const o of seed) apiUpsert('/api/ofertas', o)
    } catch (err) {
      console.error('[ofertas-store] load error:', err)
      set({ loaded: true })
    }
  },
  addOferta: (o) => {
    const nuevo = stampCreacion({ ...o, pais: o.pais || PAIS_SEED } as Oferta & Auditoria)
    registrarAuditoria('Crear', 'Presupuesto Ofertas', `Creó presupuesto ${o.consecutivo} (${o.proyecto})`)
    set((s) => ({ ofertas: [...s.ofertas, nuevo] }))
    apiUpsert('/api/ofertas', nuevo)
  },
  updateOferta: (id, o) => {
    const actual = get().ofertas.find((r) => r.id === id)
    registrarAuditoria('Editar', 'Presupuesto Ofertas', `Editó oferta ${o.consecutivo ?? actual?.consecutivo ?? id}`)
    const ofertas = get().ofertas.map((r) => (r.id === id ? { ...r, ...o } : r))
    set({ ofertas })
    const actualizado = ofertas.find((r) => r.id === id)
    if (actualizado) apiUpsert('/api/ofertas', actualizado)
  },
  deleteOferta: (id) => {
    const actual = get().ofertas.find((r) => r.id === id)
    registrarAuditoria('Eliminar', 'Presupuesto Ofertas', `Eliminó oferta ${actual?.consecutivo ?? id}`)
    set((s) => ({ ofertas: s.ofertas.filter((r) => r.id !== id) }))
    apiDelete('/api/ofertas', id)
  },
  setOfertas: (o) => set({ ofertas: o }),
}))
