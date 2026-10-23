import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Filtro de país GLOBAL (solo lo usan usuarios GLOBAL desde el selector del menú lateral).
 * '' = Todos los países. Se persiste para que sobreviva recargas.
 * Cada módulo lee `paisFiltro` en vez de su estado local, así el selector del sidebar
 * filtra TODAS las pantallas a la vez. El filtrado real por país sigue en el servidor (scopePais).
 */
interface PaisFiltroState {
  paisFiltro: string
  setPaisFiltro: (p: string) => void
}

export const usePaisFiltroStore = create<PaisFiltroState>()(
  persist(
    (set) => ({
      paisFiltro: '',
      setPaisFiltro: (paisFiltro) => set({ paisFiltro }),
    }),
    { name: 'crm-pais-filtro-global' }
  )
)
