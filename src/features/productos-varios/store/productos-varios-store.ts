import { create } from 'zustand'
import { apiUpsert, apiDelete } from '@/shared/lib/list-client'
import { SEED_PRODUCTOS_VARIOS } from '../seed-edificio'

// Productos Varios PROPIOS de crmgtm (multipaís). Se persisten por registro en el
// servidor (/api/productos-varios → productos-varios-datos). El servidor filtra
// y sella el país. Campos tomados del módulo equivalente de Tamoin.

export interface ProductoVario {
  id: string
  codigo: string
  descripcion: string
  categoria: string
  grupo: string
  sub_grupo: string
  unidad_medida: string
  costo_unitario: number
  pais: string
  situacion: string
  creado_por_usuario?: string
  creado_en?: string
  fecha_registro: string
}

interface ProductosVariosState {
  productosVarios: ProductoVario[]
  loaded: boolean
  loadProductosVarios: () => Promise<void>
  addProductoVario: (p: ProductoVario) => void
  updateProductoVario: (id: string, p: Partial<ProductoVario>) => void
  deleteProductoVario: (id: string) => void
}

export const useProductosVariosStore = create<ProductosVariosState>()((set, get) => ({
  productosVarios: [],
  loaded: false,
  loadProductosVarios: async () => {
    try {
      const res = await fetch('/api/productos-varios', { cache: 'no-store' })
      const data = await res.json()
      const kvProductos: ProductoVario[] = Array.isArray(data) ? data : []
      if (kvProductos.length === 0) {
        const seed = SEED_PRODUCTOS_VARIOS.map((x) => ({ ...x, pais: 'Colombia' })) as ProductoVario[]
        set({ productosVarios: seed, loaded: true })
        for (const x of seed) apiUpsert('/api/productos-varios', x)
        return
      }
      set({ productosVarios: kvProductos, loaded: true })
    } catch (err) {
      console.error('[productos-varios-store] load error:', err)
      set({ loaded: true })
    }
  },
  addProductoVario: (p) => {
    const productosVarios = [...get().productosVarios, p]
    set({ productosVarios })
    apiUpsert('/api/productos-varios', p)
  },
  updateProductoVario: (id, p) => {
    const productosVarios = get().productosVarios.map(x => x.id === id ? { ...x, ...p } : x)
    set({ productosVarios })
    const actualizado = productosVarios.find(x => x.id === id)
    if (actualizado) apiUpsert('/api/productos-varios', actualizado)
  },
  deleteProductoVario: (id) => {
    const productosVarios = get().productosVarios.filter(x => x.id !== id)
    set({ productosVarios })
    apiDelete('/api/productos-varios', id)
  },
}))
