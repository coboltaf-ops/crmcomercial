import { create } from 'zustand'
import { Usuario, PERMISOS_DEFAULT } from '../types'

interface UsuariosState {
  usuarios: Usuario[]
  loaded: boolean
  loadUsuarios: () => Promise<void>
  addUsuario: (u: Usuario) => void
  updateUsuario: (id: string, u: Partial<Usuario>) => void
  deleteUsuario: (id: string) => void
}

const defaultAdmin: Usuario = {
  id: 'admin-1',
  nombre: 'Admin',
  apellido: 'CRM',
  usuario: 'admin',
  clave: 'admin123',
  correo: 'admin@crmcomercial.com',
  rol: 'Admin',
  situacion: 'Activo',
  permisos: PERMISOS_DEFAULT['Admin'],
}

const conPermisos = (u: Usuario): Usuario => ({
  ...u,
  permisos: u.permisos || PERMISOS_DEFAULT[u.rol] || PERMISOS_DEFAULT['Ventas'],
})

// Persiste la lista completa de usuarios en KV (servidor). Así los cambios de
// usuarios y claves quedan guardados y se reflejan en cualquier navegador/equipo.
async function persistUsuarios(usuarios: Usuario[]) {
  try {
    await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(usuarios),
    })
  } catch (err) {
    console.error('[usuarios-store] persist error:', err)
  }
}

export const useUsuariosStore = create<UsuariosState>()((set, get) => ({
  usuarios: [defaultAdmin],
  loaded: false,
  loadUsuarios: async () => {
    try {
      const res = await fetch('/api/usuarios')
      const data = await res.json()
      const kv: Usuario[] = Array.isArray(data) ? data : []

      // Si KV ya tiene usuarios, se usan tal cual (NO se sobrescriben con el seed)
      if (kv.length > 0) {
        set({ usuarios: kv.map(conPermisos), loaded: true })
        return
      }

      // KV vacío: migración suave desde el localStorage antiguo, o seed admin
      let lista: Usuario[] = []
      if (typeof window !== 'undefined') {
        try {
          const raw = window.localStorage.getItem('crm-usuarios-storage')
          lista = raw ? (JSON.parse(raw)?.state?.usuarios || []) : []
        } catch { /* ignore */ }
      }
      if (lista.length === 0) lista = [defaultAdmin]
      lista = lista.map(conPermisos)
      set({ usuarios: lista, loaded: true })
      await persistUsuarios(lista) // guardar en KV la primera vez
    } catch (err) {
      console.error('[usuarios-store] load error:', err)
      set({ usuarios: [defaultAdmin], loaded: true })
    }
  },
  addUsuario: (u) => {
    const usuarios = [...get().usuarios, u]
    set({ usuarios })
    persistUsuarios(usuarios)
  },
  updateUsuario: (id, u) => {
    const usuarios = get().usuarios.map((r) => (r.id === id ? { ...r, ...u } : r))
    set({ usuarios })
    persistUsuarios(usuarios)
  },
  deleteUsuario: (id) => {
    const usuarios = get().usuarios.filter((r) => r.id !== id)
    set({ usuarios })
    persistUsuarios(usuarios)
  },
}))
