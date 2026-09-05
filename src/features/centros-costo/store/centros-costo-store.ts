import { create } from 'zustand'
// Stub: crmgtm aún no tiene Centros de Costo. Devuelve vacío.
export const useCentrosCostoStore = create<{ centros: unknown[] }>(() => ({ centros: [] }))
