import { create } from 'zustand'
import { Seguimiento } from '@/shared/types/seguimiento'
import { apiUpsert, apiDelete, apiSet } from '@/shared/lib/list-client'

export type { Seguimiento }

export interface Producto {
  id: string
  codigo: string
  descripcion: string
  categoria: string
  unidad_medida: string
  precio_unitario: number
  tipo_moneda: string
  observaciones: string
  situacion: string
  creado_por?: string
  creado_en?: string
  fecha_registro: string
  seguimientos: Seguimiento[]
}

interface ProductosState {
  productos: Producto[]
  loaded: boolean
  loadProductos: () => Promise<void>
  addProducto: (p: Producto) => void
  updateProducto: (id: string, p: Partial<Producto>) => void
  deleteProducto: (id: string) => void
}

export const useProductosStore = create<ProductosState>()((set, get) => ({
  productos: [],
  loaded: false,
  loadProductos: async () => {
    try {
      const res = await fetch('/api/productos', { cache: 'no-store' })
      const data = await res.json()
      const kvProductos: Producto[] = Array.isArray(data) ? data : []

      // Migración suave: si KV está vacío pero el navegador tiene datos del
      // localStorage antiguo ('crm-productos-storage'), súbelos a KV una sola vez.
      if (kvProductos.length === 0 && typeof window !== 'undefined') {
        try {
          const raw = window.localStorage.getItem('crm-productos-storage')
          const legacy: Producto[] = raw ? (JSON.parse(raw)?.state?.productos || []) : []
          if (legacy.length > 0) {
            set({ productos: legacy, loaded: true })
            await apiSet('/api/productos', legacy, true)
            return
          }
        } catch (e) {
          console.error('[productos-store] migración localStorage error:', e)
        }
      }

      set({ productos: kvProductos, loaded: true })
    } catch (err) {
      console.error('[productos-store] load error:', err)
      set({ loaded: true })
    }
  },
  addProducto: (p) => {
    const productos = [...get().productos, p]
    set({ productos })
    apiUpsert('/api/productos', p)
  },
  updateProducto: (id, p) => {
    const prev = get().productos.find((r) => r.id === id)
    const item = { ...prev, ...p, id } as Producto
    const productos = get().productos.map((r) => (r.id === id ? { ...r, ...p } : r))
    set({ productos })
    apiUpsert('/api/productos', item)
  },
  deleteProducto: (id) => {
    const productos = get().productos.filter((r) => r.id !== id)
    set({ productos })
    apiDelete('/api/productos', id)
  },
}))
