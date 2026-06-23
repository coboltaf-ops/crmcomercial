import { create } from 'zustand'
import { apiUpsert, apiDelete } from '@/shared/lib/list-client'
import { PermisoModulo, MODULOS_CRM } from '../types'

export interface Rol {
  id: string
  nombre: string
  permisos: PermisoModulo[]
}

interface RolesState {
  roles: Rol[]
  loaded: boolean
  loadRoles: () => Promise<void>
  addRol: (r: Rol) => void
  updateRol: (id: string, r: Partial<Rol>) => void
  deleteRol: (id: string) => void
}

const defaultRoles: Rol[] = [
  { id: 'admin', nombre: 'Admin', permisos: MODULOS_CRM.map(m => ({ modulo: m.id, leer: true, editar: true, eliminar: true })) },
  { id: 'ventas', nombre: 'Ventas', permisos: MODULOS_CRM.map(m => ({ modulo: m.id, leer: true, editar: ['clientes', 'contactos', 'oportunidades', 'cotizaciones', 'prospectos'].includes(m.id), eliminar: false })) },
  { id: 'soporte', nombre: 'Soporte', permisos: MODULOS_CRM.map(m => ({ modulo: m.id, leer: true, editar: m.id === 'pqrs', eliminar: false })) },
  { id: 'gerencia', nombre: 'Gerencia', permisos: MODULOS_CRM.map(m => ({ modulo: m.id, leer: true, editar: false, eliminar: false })) },
]

export const useRolesStore = create<RolesState>()((set, get) => ({
  // Empieza con los roles por defecto en memoria (siempre se ve algo), luego carga de KV
  roles: defaultRoles,
  loaded: false,
  loadRoles: async () => {
    try {
      const res = await fetch('/api/roles', { cache: 'no-store' })
      const data = await res.json()
      const kv: Rol[] = Array.isArray(data) ? data : []
      if (kv.length > 0) { set({ roles: kv, loaded: true }); return }
      // KV vacío: migrar UNA sola vez del navegador (localStorage antiguo) o usar defaults
      let legacy: Rol[] = []
      if (typeof window !== 'undefined') {
        try {
          const raw = window.localStorage.getItem('crm-roles-storage')
          legacy = raw ? (JSON.parse(raw)?.state?.roles || []) : []
        } catch { /* ignore */ }
      }
      const inicial = legacy.length > 0 ? legacy : defaultRoles
      set({ roles: inicial, loaded: true })
      for (const r of inicial) apiUpsert('/api/roles', r) // subir a KV (permanente)
    } catch (err) {
      console.error('[roles-store] load error:', err)
      set({ loaded: true })
    }
  },
  addRol: (r) => {
    const roles = [...get().roles, r]
    set({ roles })
    apiUpsert('/api/roles', r)
  },
  updateRol: (id, r) => {
    const prev = get().roles.find(x => x.id === id)
    const item = { ...prev, ...r, id } as Rol
    const roles = get().roles.map(x => x.id === id ? { ...x, ...r } : x)
    set({ roles })
    apiUpsert('/api/roles', item)
  },
  deleteRol: (id) => {
    const roles = get().roles.filter(r => r.id !== id)
    set({ roles })
    apiDelete('/api/roles', id)
  },
}))
