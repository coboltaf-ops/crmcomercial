import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { stampCreacion, registrarAuditoria, type Auditoria } from '@/shared/lib/audit'
import { SEED_PRESUPUESTOS } from '../seed-edificio'

// Un renglón del presupuesto = una ACTIVIDAD (Código + Descripción).
// Cada etapa maneja CANTIDAD y VALOR ($). Proyectado/Asignado los digita el
// usuario; Pedido y Consumido se CALCULAN (cant y valor) desde OC/Recepciones.
export type RenglonPresupuesto = {
  id: string
  codigo: string
  descripcion: string
  proyectado: number       // cantidad proyectada
  proyectado_val: number   // valor proyectado ($)
  asignado: number         // cantidad asignada
  asignado_val: number     // valor asignado ($)
  cantidad?: number        // (legado, ya no se usa)
}

export type Presupuesto = Auditoria & {
  id: string
  nro: number
  consecutivo: string          // PRES-00001
  proyecto: string
  fecha: string
  observaciones: string
  renglones: RenglonPresupuesto[]
  situacion: string            // Activo | Cerrado | Anulado
}

interface PresupuestoState {
  presupuestos: Presupuesto[]
  addPresupuesto: (p: Presupuesto) => void
  updatePresupuesto: (id: string, p: Partial<Presupuesto>) => void
  deletePresupuesto: (id: string) => void
  setPresupuestos: (p: Presupuesto[]) => void
}

export const usePresupuestoStore = create<PresupuestoState>()(
  persist(
    (set, get) => ({
      presupuestos: SEED_PRESUPUESTOS,
      addPresupuesto: (p) => {
        const nuevo = stampCreacion(p)
        registrarAuditoria('Crear', 'Control de Presupuesto', `Creó presupuesto ${p.consecutivo} (${p.proyecto})`)
        set((s) => ({ presupuestos: [...s.presupuestos, nuevo] }))
      },
      updatePresupuesto: (id, p) => {
        const actual = get().presupuestos.find((x) => x.id === id)
        registrarAuditoria('Editar', 'Control de Presupuesto', `Editó presupuesto ${p.consecutivo ?? actual?.consecutivo ?? id}`)
        set((s) => ({ presupuestos: s.presupuestos.map((x) => x.id === id ? { ...x, ...p } : x) }))
      },
      deletePresupuesto: (id) => {
        const actual = get().presupuestos.find((x) => x.id === id)
        registrarAuditoria('Eliminar', 'Control de Presupuesto', `Eliminó presupuesto ${actual?.consecutivo ?? id}`)
        set((s) => ({ presupuestos: s.presupuestos.filter((x) => x.id !== id) }))
      },
      setPresupuestos: (p) => set({ presupuestos: p }),
    }),
    { name: 'control-presupuesto-storage' }
  )
)

export const nextPresupuestoConsecutivo = (lista: Presupuesto[]): string => {
  const max = lista.reduce((m, r) => Math.max(m, r.nro || 0), 0)
  return `PRES-${String(max + 1).padStart(5, '0')}`
}
