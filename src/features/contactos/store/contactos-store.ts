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
  creado_por_usuario?: string
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
