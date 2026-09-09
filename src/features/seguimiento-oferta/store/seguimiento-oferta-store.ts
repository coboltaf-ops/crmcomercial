import { create } from 'zustand'
import { Seguimiento } from '@/shared/types/seguimiento'
import { apiUpsert, apiDelete } from '@/shared/lib/list-client'

export type { Seguimiento }

export interface DocumentoExigido {
  id: string
  documento?: string
  nombre?: string
  fecha_procesado?: string
  listo?: boolean
  creado_en?: string
  creado_por?: string
  observaciones?: string
}

// Seguimiento de Oferta — se separa de la Oportunidad. Relación 1:1 vía oportunidad_id.
// Contiene la cabecera (Nro Oferta, Fecha, Cliente, Proyecto) + Control Oferta + Documentos Exigidos.
export interface SeguimientoOferta {
  id: string
  nro_oferta: string
  oportunidad_id: string
  oportunidad_codigo?: string
  fecha_registro: string
  cliente_id: string
  cliente_nombre: string
  contacto_id?: string
  contacto_nombre?: string
  proyecto: string
  ciudad?: string
  pais?: string
  tipo_moneda: string
  // ── Control Oferta ──
  adjudicacion?: string
  mgc?: number
  ejecucion_anyo_pct?: number
  parcial_euros_anyo?: number
  fecha_inicio_consultas?: string
  fecha_final_consultas?: string
  fecha_presentar_oferta?: string
  fecha_real_presentacion_oferta?: string
  monto_real_oferta?: number
  fecha_esperada_veredicto?: string
  veredicto?: string
  empresa_ganadora?: string
  // ── Documentos exigidos en la oferta ──
  documentos_exigidos?: DocumentoExigido[]
  observaciones?: string
  situacion?: string
  seguimientos: Seguimiento[]
  creado_por?: string
  creado_por_usuario?: string
  creado_por_rol?: string
  creado_en?: string
}

interface SeguimientoOfertaState {
  ofertas: SeguimientoOferta[]
  loaded: boolean
  loadOfertas: () => Promise<void>
  addOferta: (o: SeguimientoOferta) => void
  updateOferta: (id: string, o: Partial<SeguimientoOferta>) => void
  deleteOferta: (id: string) => void
}

export const useSeguimientoOfertaStore = create<SeguimientoOfertaState>()((set, get) => ({
  ofertas: [],
  loaded: false,
  loadOfertas: async () => {
    try {
      const res = await fetch('/api/seguimiento-oferta', { cache: 'no-store' })
      const data = await res.json()
      set({ ofertas: Array.isArray(data) ? data : [], loaded: true })
    } catch (err) {
      console.error('[seguimiento-oferta-store] load error:', err)
      set({ loaded: true })
    }
  },
  addOferta: (o) => {
    set({ ofertas: [...get().ofertas, o] })
    apiUpsert('/api/seguimiento-oferta', o)
  },
  updateOferta: (id, o) => {
    set({ ofertas: get().ofertas.map((r) => (r.id === id ? { ...r, ...o } : r)) })
    const item = get().ofertas.find((r) => r.id === id)
    if (item) apiUpsert('/api/seguimiento-oferta', item)
  },
  deleteOferta: (id) => {
    set({ ofertas: get().ofertas.filter((r) => r.id !== id) })
    apiDelete('/api/seguimiento-oferta', id)
  },
}))
