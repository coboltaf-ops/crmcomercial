import { create } from 'zustand'
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
  loaded: boolean
  loadProyectos: () => Promise<void>
  addProyecto: (p: Proyecto) => void
  updateProyecto: (id: string, p: Partial<Proyecto>) => void
  deleteProyecto: (id: string) => void
}

// Persiste la lista completa en Vercel KV vía /api/proyectos.
// Así los datos sobreviven a cualquier navegador o despliegue.
async function persistProyectos(proyectos: Proyecto[]) {
  try {
    await fetch('/api/proyectos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proyectos),
    })
  } catch (err) {
    console.error('[proyectos-store] persist error:', err)
  }
}

export const useProyectosStore = create<ProyectosState>()((set, get) => ({
  proyectos: [],
  loaded: false,
  loadProyectos: async () => {
    try {
      const res = await fetch('/api/proyectos', { cache: 'no-store' })
      const data = await res.json()
      const kvProyectos: Proyecto[] = Array.isArray(data) ? data : []

      // Migración suave: si KV está vacío pero el navegador tiene datos del
      // localStorage antiguo ('crm-proyectos-storage'), súbelos a KV una sola vez.
      if (kvProyectos.length === 0 && typeof window !== 'undefined') {
        try {
          const raw = window.localStorage.getItem('crm-proyectos-storage')
          const legacy: Proyecto[] = raw ? (JSON.parse(raw)?.state?.proyectos || []) : []
          if (legacy.length > 0) {
            set({ proyectos: legacy, loaded: true })
            await persistProyectos(legacy)
            return
          }
        } catch (e) {
          console.error('[proyectos-store] migración localStorage error:', e)
        }
      }

      set({ proyectos: kvProyectos, loaded: true })
    } catch (err) {
      console.error('[proyectos-store] load error:', err)
      set({ loaded: true })
    }
  },
  addProyecto: (p) => {
    const proyectos = [...get().proyectos, p]
    set({ proyectos })
    persistProyectos(proyectos)
  },
  updateProyecto: (id, p) => {
    const proyectos = get().proyectos.map((r) => (r.id === id ? { ...r, ...p } : r))
    set({ proyectos })
    persistProyectos(proyectos)
  },
  deleteProyecto: (id) => {
    const proyectos = get().proyectos.filter((r) => r.id !== id)
    set({ proyectos })
    persistProyectos(proyectos)
  },
}))
