import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Seguimiento } from '@/shared/types/seguimiento'

export type { Seguimiento }

export interface Proyecto {
  id: string
  codigo: string              // Nro consecutivo automático (PRY-XXX)
  fecha_registro: string      // automática del día
  codigo_proyecto: string     // código del proyecto (ingresado por el usuario)
  cliente_id: string
  cliente_nombre: string
  descripcion: string         // descripción detallada del proyecto
  fecha_estimada_inicio: string
  fecha_real_inicio: string
  es_consorcio: boolean       // el proyecto es con consorcio (Sí/No)
  nombre_consorcio: string
  responsable: string         // responsable del proyecto
  monto_aprobado: number
  monto_cobrado: number
  tipo_moneda: string
  situacion: string
  creado_por?: string
  creado_en?: string
  seguimientos: Seguimiento[]
}

interface ProyectosState {
  proyectos: Proyecto[]
  addProyecto: (p: Proyecto) => void
  updateProyecto: (id: string, p: Partial<Proyecto>) => void
  deleteProyecto: (id: string) => void
}

export const useProyectosStore = create<ProyectosState>()(
  persist(
    (set) => ({
      proyectos: [],
      addProyecto: (p) => set((s) => ({ proyectos: [...s.proyectos, p] })),
      updateProyecto: (id, p) => set((s) => ({ proyectos: s.proyectos.map((r) => r.id === id ? { ...r, ...p } : r) })),
      deleteProyecto: (id) => set((s) => ({ proyectos: s.proyectos.filter((r) => r.id !== id) })),
    }),
    { name: 'crm-proyectos-storage' }
  )
)
