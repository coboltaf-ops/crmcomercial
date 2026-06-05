import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Usuario } from '../types'

interface CurrentUserState {
  user: Usuario | null
  _hydrated: boolean
  setUser: (u: Usuario | null) => void
  logout: () => void
}

export const useCurrentUserStore = create<CurrentUserState>()(
  persist(
    (set) => ({
      user: null,
      _hydrated: false,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'crm-current-user-storage',
      onRehydrateStorage: () => (state) => {
        if (state) state._hydrated = true
      },
    }
  )
)

export const useIsUserStoreHydrated = () => {
  const hydrated = useCurrentUserStore(s => s._hydrated)
  return hydrated
}
