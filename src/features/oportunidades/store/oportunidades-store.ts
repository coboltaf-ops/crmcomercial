import { create } from 'zustand'
import { Seguimiento } from '@/shared/types/seguimiento'
import { apiUpsert, apiDelete, apiSet } from '@/shared/lib/list-client'

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

export interface Oportunidad {
  id: string
  codigo: string
  proyecto: string
  cliente_id: string
  cliente_nombre: string
  contacto_id: string
  contacto_nombre: string
  ciudad?: string
  pais?: string
  fecha_presupuesto?: string
  monto_estimado?: number
  estimado_cop?: number
  valor_estimado?: number
  tipo_moneda: string
  probabilidad?: number
  probable_pct?: number
  etapa?: string
  origen?: string
  fecha_cierre_estimada?: string
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
  responsable: string
  observaciones: string
  situacion: string
  fecha_registro: string
  creado_por?: string
  creado_por_usuario?: string
  creado_por_rol?: string
  creado_en?: string
  codigo_interno?: string
  seguimientos: Seguimiento[]
  documentos_exigidos?: any[]
}

interface OportunidadesState {
  oportunidades: Oportunidad[]
  loaded: boolean
  loadOportunidades: () => Promise<void>
  addOportunidad: (o: Oportunidad) => void
  updateOportunidad: (id: string, o: Partial<Oportunidad>) => void
  deleteOportunidad: (id: string) => void
}

export const useOportunidadesStore = create<OportunidadesState>()((set, get) => ({
  oportunidades: [],
  loaded: false,
  loadOportunidades: async () => {
    try {
      const res = await fetch('/api/oportunidades', { cache: 'no-store' })
      const data = await res.json()
      const kvOportunidades: Oportunidad[] = Array.isArray(data) ? data : []
      set({ oportunidades: kvOportunidades, loaded: true })
    } catch (err) {
      console.error('[oportunidades-store] load error:', err)
      set({ loaded: true })
    }
  },
  addOportunidad: (o) => {
    const oportunidades = [...get().oportunidades, o]
    set({ oportunidades })
    apiUpsert('/api/oportunidades', o)
  },
  updateOportunidad: (id, o) => {
    const oportunidades = get().oportunidades.map((r) => (r.id === id ? { ...r, ...o } : r))
    set({ oportunidades })
    const item = get().oportunidades.find((r) => r.id === id)
    if (item) apiUpsert('/api/oportunidades', item)
  },
  deleteOportunidad: (id) => {
    const oportunidades = get().oportunidades.filter((r) => r.id !== id)
    set({ oportunidades })
    apiDelete('/api/oportunidades', id)
  },
}))
