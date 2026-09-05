import { create } from 'zustand'
export const useCotizacionesSubStore = create<{ cotizaciones: unknown[] }>(() => ({ cotizaciones: [] }))
