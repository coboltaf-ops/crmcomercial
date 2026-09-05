import { create } from 'zustand'
// Stub: crmgtm aún no tiene Órdenes de Compra. Devuelve vacío (Pedido = 0).
export const useOrdenesStore = create<{ ordenes: unknown[] }>(() => ({ ordenes: [] }))
