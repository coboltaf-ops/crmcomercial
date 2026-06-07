import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Seguimiento } from '@/shared/types/seguimiento'

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
  creado_en?: string
  codigo_interno?: string
  seguimientos: Seguimiento[]
  documentos_exigidos?: any[]
}

interface OportunidadesState {
  oportunidades: Oportunidad[]
  addOportunidad: (o: Oportunidad) => void
  updateOportunidad: (id: string, o: Partial<Oportunidad>) => void
  deleteOportunidad: (id: string) => void
}

export const useOportunidadesStore = create<OportunidadesState>()(
  persist(
    (set) => ({
      oportunidades: [],
      addOportunidad: (o) => set((s) => ({ oportunidades: [...s.oportunidades, o] })),
      updateOportunidad: (id, o) => set((s) => ({ oportunidades: s.oportunidades.map((r) => r.id === id ? { ...r, ...o } : r) })),
      deleteOportunidad: (id) => set((s) => ({ oportunidades: s.oportunidades.filter((r) => r.id !== id) })),
    }),
    { name: 'crm-oportunidades-storage' }
  )
)
