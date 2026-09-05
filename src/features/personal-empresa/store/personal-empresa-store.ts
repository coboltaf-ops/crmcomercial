import { create } from 'zustand'
export const usePersonalEmpresaStore = create<{ personal: unknown[] }>(() => ({ personal: [] }))
