import { create } from 'zustand'
// Stub: crmgtm aún no tiene Recepción de Facturas. Devuelve vacío (Consumido = 0).
export const useRecepcionesStore = create<{ recepciones: unknown[] }>(() => ({ recepciones: [] }))
