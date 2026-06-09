import { create } from 'zustand'
import { Seguimiento } from '@/shared/types/seguimiento'

export type { Seguimiento }

export interface PQRS {
  id: string
  codigo: string
  nro: number
  tipo: string
  prioridad: string
  cliente_id: string
  cliente_nombre: string
  contacto_id: string
  contacto_nombre: string
  asunto: string
  descripcion: string
  fecha_aviso: string
  hora_aviso: string
  persona_avisa: string
  movil_avisa: string
  persona_caso: string
  movil_caso: string
  detalle_incidencia: string
  responsable: string
  fecha_registro: string
  fecha_cierre: string
  seguimientos: Seguimiento[]
  situacion: string
  creado_por?: string
  creado_en?: string
}

interface PQRSState {
  pqrs: PQRS[]
  loaded: boolean
  loadPQRS: () => Promise<void>
  addPQRS: (p: PQRS) => void
  updatePQRS: (id: string, p: Partial<PQRS>) => void
  deletePQRS: (id: string) => void
}

// Persiste la lista completa en Vercel KV vía /api/pqrs.
// Así los datos sobreviven a cualquier navegador o despliegue.
async function persistPQRS(pqrs: PQRS[]) {
  try {
    await fetch('/api/pqrs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pqrs),
    })
  } catch (err) {
    console.error('[pqrs-store] persist error:', err)
  }
}

export const usePQRSStore = create<PQRSState>()((set, get) => ({
  pqrs: [],
  loaded: false,
  loadPQRS: async () => {
    try {
      const res = await fetch('/api/pqrs')
      const data = await res.json()
      const kvPQRS: PQRS[] = Array.isArray(data) ? data : []

      // Migración suave: si KV está vacío pero el navegador tiene datos del
      // localStorage antiguo ('crm-pqrs-storage'), súbelos a KV una sola vez.
      if (kvPQRS.length === 0 && typeof window !== 'undefined') {
        try {
          const raw = window.localStorage.getItem('crm-pqrs-storage')
          const legacy: PQRS[] = raw ? (JSON.parse(raw)?.state?.pqrs || []) : []
          if (legacy.length > 0) {
            set({ pqrs: legacy, loaded: true })
            await persistPQRS(legacy)
            return
          }
        } catch (e) {
          console.error('[pqrs-store] migración localStorage error:', e)
        }
      }

      set({ pqrs: kvPQRS, loaded: true })
    } catch (err) {
      console.error('[pqrs-store] load error:', err)
      set({ loaded: true })
    }
  },
  addPQRS: (p) => {
    const pqrs = [...get().pqrs, p]
    set({ pqrs })
    persistPQRS(pqrs)
  },
  updatePQRS: (id, p) => {
    const pqrs = get().pqrs.map((r) => (r.id === id ? { ...r, ...p } : r))
    set({ pqrs })
    persistPQRS(pqrs)
  },
  deletePQRS: (id) => {
    const pqrs = get().pqrs.filter((r) => r.id !== id)
    set({ pqrs })
    persistPQRS(pqrs)
  },
}))
