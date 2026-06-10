import { create } from 'zustand'
import { Seguimiento } from '@/shared/types/seguimiento'

export type { Seguimiento }

export interface Cliente {
  id: string
  codigo: string
  tipo_identificacion: string
  nro_documento: string
  razon_social: string
  nombre_comercial: string
  actividad: string
  direccion: string
  ciudad: string
  pais: string
  codigo_postal: string
  telefono: string
  email: string
  sitio_web: string
  condicion_pago: string
  tipo_moneda: string
  observaciones: string
  situacion: string
  creado_por?: string
  creado_en?: string
  fecha_registro: string
  seguimientos: Seguimiento[]
  codigo_acceso: string
}

/** Genera código de acceso aleatorio tipo ACC-XXXXXX */
export function generarCodigoAcceso(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return `ACC-${code}`
}

interface ClientesState {
  clientes: Cliente[]
  loaded: boolean
  loadClientes: () => Promise<void>
  addCliente: (c: Cliente) => void
  updateCliente: (id: string, c: Partial<Cliente>) => void
  deleteCliente: (id: string) => void
}

// Persiste la lista completa en Vercel KV vía /api/clientes.
// Así los datos sobreviven a cualquier navegador o despliegue.
async function persistClientes(clientes: Cliente[]) {
  try {
    await fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientes),
    })
  } catch (err) {
    console.error('[clientes-store] persist error:', err)
  }
}

export const useClientesStore = create<ClientesState>()((set, get) => ({
  clientes: [],
  loaded: false,
  loadClientes: async () => {
    try {
      const res = await fetch('/api/clientes', { cache: 'no-store' })
      const data = await res.json()
      const kvClientes: Cliente[] = Array.isArray(data) ? data : []

      // Migración suave: si KV está vacío pero el navegador tiene datos del
      // localStorage antiguo ('crm-clientes-storage'), súbelos a KV una sola vez.
      if (kvClientes.length === 0 && typeof window !== 'undefined') {
        try {
          const raw = window.localStorage.getItem('crm-clientes-storage')
          const legacy: Cliente[] = raw ? (JSON.parse(raw)?.state?.clientes || []) : []
          if (legacy.length > 0) {
            set({ clientes: legacy, loaded: true })
            await persistClientes(legacy)
            return
          }
        } catch (e) {
          console.error('[clientes-store] migración localStorage error:', e)
        }
      }

      set({ clientes: kvClientes, loaded: true })
    } catch (err) {
      console.error('[clientes-store] load error:', err)
      set({ loaded: true })
    }
  },
  addCliente: (c) => {
    const clientes = [...get().clientes, c]
    set({ clientes })
    persistClientes(clientes)
  },
  updateCliente: (id, c) => {
    const clientes = get().clientes.map((r) => (r.id === id ? { ...r, ...c } : r))
    set({ clientes })
    persistClientes(clientes)
  },
  deleteCliente: (id) => {
    const clientes = get().clientes.filter((r) => r.id !== id)
    set({ clientes })
    persistClientes(clientes)
  },
}))
