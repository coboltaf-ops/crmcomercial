import { create } from 'zustand'
import { Seguimiento } from '@/shared/types/seguimiento'
import { apiUpsert, apiDelete, apiSet } from '@/shared/lib/list-client'

export type { Seguimiento }

export interface Contacto {
  id: string
  codigo: string
  cliente_id: string
  cliente_nombre: string
  nombre: string
  apellido: string
  cargo: string
  departamento: string
  telefono: string
  celular: string
  email: string
  fecha_nacimiento: string
  nivel_influencia: string
  es_principal: boolean
  observaciones: string
  situacion: string
  creado_por?: string
  creado_en?: string
  fecha_registro: string
  seguimientos: Seguimiento[]
}

interface ContactosState {
  contactos: Contacto[]
  loaded: boolean
  loadContactos: () => Promise<void>
  addContacto: (c: Contacto) => void
  updateContacto: (id: string, c: Partial<Contacto>) => void
  deleteContacto: (id: string) => void
}

export const useContactosStore = create<ContactosState>()((set, get) => ({
  contactos: [],
  loaded: false,
  loadContactos: async () => {
    try {
      const res = await fetch('/api/contactos', { cache: 'no-store' })
      const data = await res.json()
      const kvContactos: Contacto[] = Array.isArray(data) ? data : []

      // Migración suave: si KV está vacío pero el navegador tiene datos del
      // localStorage antiguo ('crm-contactos-storage'), súbelos a KV una sola vez.
      if (kvContactos.length === 0 && typeof window !== 'undefined') {
        try {
          const raw = window.localStorage.getItem('crm-contactos-storage')
          const legacy: Contacto[] = raw ? (JSON.parse(raw)?.state?.contactos || []) : []
          if (legacy.length > 0) {
            set({ contactos: legacy, loaded: true })
            await apiSet('/api/contactos', legacy, true)
            return
          }
        } catch (e) {
          console.error('[contactos-store] migración localStorage error:', e)
        }
      }

      set({ contactos: kvContactos, loaded: true })
    } catch (err) {
      console.error('[contactos-store] load error:', err)
      set({ loaded: true })
    }
  },
  addContacto: (c) => {
    const contactos = [...get().contactos, c]
    set({ contactos })
    apiUpsert('/api/contactos', c)
  },
  updateContacto: (id, c) => {
    const contactos = get().contactos.map((r) => (r.id === id ? { ...r, ...c } : r))
    set({ contactos })
    const item = get().contactos.find((r) => r.id === id)
    if (item) apiUpsert('/api/contactos', item)
  },
  deleteContacto: (id) => {
    const contactos = get().contactos.filter((r) => r.id !== id)
    set({ contactos })
    apiDelete('/api/contactos', id)
  },
}))
