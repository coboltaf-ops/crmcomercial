import { create } from 'zustand'
import { Seguimiento } from '@/shared/types/seguimiento'
import { apiUpsert, apiDelete } from '@/shared/lib/list-client'

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
  creado_por_usuario?: string
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
