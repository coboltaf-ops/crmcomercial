import { create } from 'zustand'
import { Seguimiento } from '@/shared/types/seguimiento'

export type { Seguimiento }

export interface Empresa {
  id: string
  codigo: string
  nombre: string
  tipo_identificacion: string
  nro_documento: string
  correo: string
  telefono: string
  nro_movil: string
  pagina_web: string
  logo_url: string
  representante_legal: string
  direccion: string
  ciudad: string
  pais: string
  codigo_postal: string
  situacion: string
  seguimientos: Seguimiento[]
}

interface EmpresaState {
  empresas: Empresa[]
  loaded: boolean
  loadEmpresas: () => Promise<void>
  addEmpresa: (e: Empresa) => void
  updateEmpresa: (id: string, e: Partial<Empresa>) => void
  deleteEmpresa: (id: string) => void
}

// Persiste la lista completa en Vercel KV vía /api/empresa.
// Así los datos (y el logo) sobreviven a cualquier navegador o despliegue.
async function persistEmpresas(empresas: Empresa[]) {
  try {
    await fetch('/api/empresa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(empresas),
    })
  } catch (err) {
    console.error('[empresa-store] persist error:', err)
  }
}

export const useEmpresaStore = create<EmpresaState>()((set, get) => ({
  empresas: [],
  loaded: false,
  loadEmpresas: async () => {
    try {
      const res = await fetch('/api/empresa')
      const data = await res.json()
      const kvEmpresas: Empresa[] = Array.isArray(data) ? data : []

      // Migración suave: si KV está vacío pero el navegador tiene datos del
      // localStorage antiguo ('crm-empresa-storage'), súbelos a KV una sola vez.
      // Así no se pierden los datos/logo que ya tenías guardados.
      if (kvEmpresas.length === 0 && typeof window !== 'undefined') {
        try {
          const raw = window.localStorage.getItem('crm-empresa-storage')
          const legacy: Empresa[] = raw ? (JSON.parse(raw)?.state?.empresas || []) : []
          if (legacy.length > 0) {
            set({ empresas: legacy, loaded: true })
            await persistEmpresas(legacy)
            return
          }
        } catch (e) {
          console.error('[empresa-store] migración localStorage error:', e)
        }
      }

      set({ empresas: kvEmpresas, loaded: true })
    } catch (err) {
      console.error('[empresa-store] load error:', err)
      set({ loaded: true })
    }
  },
  addEmpresa: (e) => {
    const empresas = [...get().empresas, e]
    set({ empresas })
    persistEmpresas(empresas)
  },
  updateEmpresa: (id, e) => {
    const empresas = get().empresas.map((r) => (r.id === id ? { ...r, ...e } : r))
    set({ empresas })
    persistEmpresas(empresas)
  },
  deleteEmpresa: (id) => {
    const empresas = get().empresas.filter((r) => r.id !== id)
    set({ empresas })
    persistEmpresas(empresas)
  },
}))
