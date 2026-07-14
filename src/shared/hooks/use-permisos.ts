import { useCurrentUserStore } from '@/features/usuarios-gestion/store/current-user-store'

export function usePermisos(moduloId: string) {
  const user = useCurrentUserStore(s => s.user)
  if (!user) return { leer: false, crear: false, editar: false, eliminar: false, esAdmin: false }
  const esAdmin = user.rol.toLowerCase() === 'admin'
  if (esAdmin) return { leer: true, crear: true, editar: true, eliminar: true, esAdmin: true }
  const p = user.permisos?.find(p => p.modulo === moduloId)
  // "crear" respeta el permiso explícito del rol; si un rol antiguo no lo define, cae a "editar" (compatibilidad).
  return { leer: p?.leer ?? false, crear: p?.crear ?? p?.editar ?? false, editar: p?.editar ?? false, eliminar: p?.eliminar ?? false, esAdmin }
}
