import { create } from 'zustand'
import { Seguimiento } from '@/shared/types/seguimiento'
import { apiUpsert, apiDelete, apiSet } from '@/shared/lib/list-client'

export type { Seguimiento }

export interface DetalleCotizacion {
  id: string
  producto_id: string
  codigo_producto: string
  descripcion: string
  cantidad: number
  precio_unitario: number
  unidad_medida: string
  descuento_pct: number
  subtotal: number
}

export interface Cotizacion {
  id: string
  codigo: string
  nro: number
  fecha_emision: string
  fecha_vencimiento: string
  cliente_id: string
  cliente_nombre: string
  contacto_id: string
  contacto_nombre: string
  oportunidad_id: string
  oportunidad_nombre: string
  tipo_moneda: string
  condicion_pago: string
  pct_impuesto: number
  observaciones: string
  detalles: DetalleCotizacion[]
  situacion: string
  creado_por?: string
  creado_en?: string
  responsable: string
  vendedor: string
  fecha_registro: string
  seguimientos: Seguimiento[]
}

interface CotizacionesState {
  cotizaciones: Cotizacion[]
  loaded: boolean
  loadCotizaciones: () => Promise<void>
  addCotizacion: (c: Cotizacion) => void
  updateCotizacion: (id: string, c: Partial<Cotizacion>) => void
  deleteCotizacion: (id: string) => void
}

export const useCotizacionesStore = create<CotizacionesState>()((set, get) => ({
  cotizaciones: [],
  loaded: false,
  loadCotizaciones: async () => {
    try {
      const res = await fetch('/api/cotizaciones', { cache: 'no-store' })
      const data = await res.json()
      const kvCotizaciones: Cotizacion[] = Array.isArray(data) ? data : []

      // Migración suave: si KV está vacío pero el navegador tiene datos del
      // localStorage antiguo ('crm-cotizaciones-storage'), súbelos a KV una sola vez.
      if (kvCotizaciones.length === 0 && typeof window !== 'undefined') {
        try {
          const raw = window.localStorage.getItem('crm-cotizaciones-storage')
          const legacy: Cotizacion[] = raw ? (JSON.parse(raw)?.state?.cotizaciones || []) : []
          if (legacy.length > 0) {
            set({ cotizaciones: legacy, loaded: true })
            await apiSet('/api/cotizaciones', legacy, true)
            return
          }
        } catch (e) {
          console.error('[cotizaciones-store] migración localStorage error:', e)
        }
      }

      set({ cotizaciones: kvCotizaciones, loaded: true })
    } catch (err) {
      console.error('[cotizaciones-store] load error:', err)
      set({ loaded: true })
    }
  },
  addCotizacion: (c) => {
    const cotizaciones = [...get().cotizaciones, c]
    set({ cotizaciones })
    apiUpsert('/api/cotizaciones', c)
  },
  updateCotizacion: (id, c) => {
    const prev = get().cotizaciones.find((r) => r.id === id)
    const item = { ...(prev ?? ({} as Cotizacion)), ...c, id }
    const cotizaciones = get().cotizaciones.map((r) => (r.id === id ? { ...r, ...c } : r))
    set({ cotizaciones })
    apiUpsert('/api/cotizaciones', item)
  },
  deleteCotizacion: (id) => {
    const cotizaciones = get().cotizaciones.filter((r) => r.id !== id)
    set({ cotizaciones })
    apiDelete('/api/cotizaciones', id)
  },
}))
