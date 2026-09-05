import { create } from 'zustand'
import { apiUpsert, apiDelete } from '@/shared/lib/list-client'

// Cargos y Salarios PROPIOS de crmgtm (multipaís). Se persisten por registro en
// el servidor (/api/cargos-salarios → cargos-salarios-datos). El servidor filtra
// y sella el país. Solo CRUD de datos (sin cálculos de costo cargado).

export interface CargoSalario {
  id: string
  codigo: string               // CAR-00001
  especialidad: string         // Especialidad del empleado
  descripcion: string          // nombre del cargo
  tipo_mo: string              // Directa | Indirecta
  salario_dia: number
  pct_prestaciones: number
  salario_mes: number
  fecha_actualizacion: string
  pais: string
  situacion: string            // Activo | Inactivo
  creado_por_usuario?: string
  creado_en?: string
  fecha_registro: string
}

interface CargosSalariosState {
  cargos: CargoSalario[]
  loaded: boolean
  loadCargos: () => Promise<void>
  addCargo: (c: CargoSalario) => void
  updateCargo: (id: string, c: Partial<CargoSalario>) => void
  deleteCargo: (id: string) => void
}

export const useCargosSalariosStore = create<CargosSalariosState>()((set, get) => ({
  cargos: [],
  loaded: false,
  loadCargos: async () => {
    try {
      const res = await fetch('/api/cargos-salarios', { cache: 'no-store' })
      const data = await res.json()
      const kvCargos: CargoSalario[] = Array.isArray(data) ? data : []
      set({ cargos: kvCargos, loaded: true })
    } catch (err) {
      console.error('[cargos-salarios-store] load error:', err)
      set({ loaded: true })
    }
  },
  addCargo: (c) => {
    const cargos = [...get().cargos, c]
    set({ cargos })
    apiUpsert('/api/cargos-salarios', c)
  },
  updateCargo: (id, c) => {
    const cargos = get().cargos.map(x => x.id === id ? { ...x, ...c } : x)
    set({ cargos })
    const actualizado = cargos.find(x => x.id === id)
    if (actualizado) apiUpsert('/api/cargos-salarios', actualizado)
  },
  deleteCargo: (id) => {
    const cargos = get().cargos.filter(x => x.id !== id)
    set({ cargos })
    apiDelete('/api/cargos-salarios', id)
  },
}))
