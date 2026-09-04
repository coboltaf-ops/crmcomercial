import { create } from 'zustand'
import { Usuario, PERMISOS_DEFAULT } from '../types'
import { PAIS_GLOBAL } from '@/shared/lib/paises'

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
  pais: PAIS_GLOBAL,
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
      const res = await fetch('/api/usuarios', { cache: 'no-store' })
      const data = await res.json()

      // BLINDAJE: si la respuesta NO es un arreglo (error de sesión, fallo de red,
      // {"error":...}), NO se toca NADA. Jamás sobrescribir el servidor por un fallo.
      if (!Array.isArray(data)) {
        console.error('[usuarios-store] respuesta no válida, se conserva lo existente:', data)
        set({ loaded: true })
        return
      }
      const kv = data as Usuario[]

      // Si KV ya tiene usuarios, se usan tal cual (NO se sobrescriben con el seed)
      if (kv.length > 0) {
        let lista = kv.map(conPermisos)
        // Garantizar SIEMPRE un admin de respaldo de emergencia (admin/admin123)
        if (!lista.some(u => u.usuario === 'admin')) {
          lista = [...lista, defaultAdmin]
          persistUsuarios(lista)
        }
        set({ usuarios: lista, loaded: true })
        return
      }

      // KV realmente vacío (primer arranque del sistema): sembrar el admin base.
      // (Ya NO se migra desde localStorage para no resucitar datos viejos.)
      const lista = [defaultAdmin].map(conPermisos)
      set({ usuarios: lista, loaded: true })
      await persistUsuarios(lista)
    } catch (err) {
      // BLINDAJE: ante cualquier error, NO sobrescribir; solo marcar cargado.
      console.error('[usuarios-store] load error (se conserva lo existente):', err)
      set({ loaded: true })
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
