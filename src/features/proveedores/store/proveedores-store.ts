import { create } from 'zustand'
import { Seguimiento } from '@/shared/types/seguimiento'
import { apiUpsert, apiDelete } from '@/shared/lib/list-client'

export type { Seguimiento }

export interface Proveedor {
  id: string
  codigo: string              // Nro consecutivo automático (PRV-XXXXX)
  fecha_registro: string      // automática del día
  nombre: string
  tipo_id: string
  nro_documento: string
  correo: string
  tel_oficina: string
  celular_oficina: string
  persona_contacto: string
  calificacion: string
  proveedor_desde: string     // fecha
  representante_legal: string
  // Ubicación
  direccion: string
  ciudad: string
  pais: string
  codigo_postal: string
  // Cierre
  observaciones: string
  situacion: string
  creado_por?: string
  creado_por_usuario?: string
  creado_en?: string
  seguimientos: Seguimiento[]
}

interface ProveedoresState {
  proveedores: Proveedor[]
  loaded: boolean
  loadProveedores: () => Promise<void>
  addProveedor: (p: Proveedor) => void
  updateProveedor: (id: string, p: Partial<Proveedor>) => void
  deleteProveedor: (id: string) => void
}

export const useProveedoresStore = create<ProveedoresState>()((set, get) => ({
  proveedores: [],
  loaded: false,
  loadProveedores: async () => {
    try {
      const res = await fetch('/api/proveedores', { cache: 'no-store' })
      const data = await res.json()
      const kv: Proveedor[] = Array.isArray(data) ? data : []
      set({ proveedores: kv, loaded: true })
    } catch (err) {
      console.error('[proveedores-store] load error:', err)
      set({ loaded: true })
    }
  },
  addProveedor: (p) => {
    const proveedores = [...get().proveedores, p]
    set({ proveedores })
    apiUpsert('/api/proveedores', p)
  },
  updateProveedor: (id, p) => {
    const prev = get().proveedores.find((r) => r.id === id)
    const item = { ...prev, ...p, id } as Proveedor
    const proveedores = get().proveedores.map((r) => (r.id === id ? { ...r, ...p } : r))
    set({ proveedores })
    apiUpsert('/api/proveedores', item)
  },
  deleteProveedor: (id) => {
    const proveedores = get().proveedores.filter((r) => r.id !== id)
    set({ proveedores })
    apiDelete('/api/proveedores', id)
  },
}))
