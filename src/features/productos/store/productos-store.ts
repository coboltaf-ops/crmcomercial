import { create } from 'zustand'
import { Seguimiento } from '@/shared/types/seguimiento'

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

// Persiste la lista completa en Vercel KV vía /api/productos.
// Así los datos sobreviven a cualquier navegador o despliegue.
async function persistProductos(productos: Producto[]) {
  try {
    await fetch('/api/productos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productos),
    })
  } catch (err) {
    console.error('[productos-store] persist error:', err)
  }
}

export const useProductosStore = create<ProductosState>()((set, get) => ({
  productos: [],
  loaded: false,
  loadProductos: async () => {
    try {
      const res = await fetch('/api/productos')
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
            await persistProductos(legacy)
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
    persistProductos(productos)
  },
  updateProducto: (id, p) => {
    const productos = get().productos.map((r) => (r.id === id ? { ...r, ...p } : r))
    set({ productos })
    persistProductos(productos)
  },
  deleteProducto: (id) => {
    const productos = get().productos.filter((r) => r.id !== id)
    set({ productos })
    persistProductos(productos)
  },
}))
