import { useCurrentUserStore } from '@/features/usuarios-gestion/store/current-user-store'

/** Campos de auditoría que se estampan al crear un registro (compat. módulos portados de Ofertas). */
export type Auditoria = {
  creado_por?: string
  creado_en?: string
}

/** Estampa creador y fecha/hora de creación en un registro nuevo. */
export function stampCreacion<T extends object>(record: T): T & Auditoria {
  const r = record as T & Auditoria
  let nombre = 'Sistema'
  try {
    const u = useCurrentUserStore.getState().user
    nombre = [u?.nombre, u?.apellido].filter(Boolean).join(' ').trim() || u?.usuario || 'Sistema'
  } catch { /* fuera de React o sin sesión */ }
  return { ...record, creado_por: r.creado_por ?? nombre, creado_en: r.creado_en ?? new Date().toISOString() }
}

/** Registro de auditoría por acción (no-op; la auditoría real usa logAudit). */
export function registrarAuditoria(_accion: string, _modulo: string, _descripcion: string): void {
  /* no-op */
}

export interface AuditLog {
  usuario: string
  usuario_nombre: string
  rol: string
  modulo: string
  accion: string
  registro_codigo?: string
  registro_nombre?: string
  detalle?: string
  fecha?: string
}

export function logAudit(log: AuditLog): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUDIT]', log)
  }
  // Persistir en el servidor (fire-and-forget, no bloquea la UI)
  try {
    fetch('/api/auditoria', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    }).catch(() => {})
  } catch { /* ignore */ }
}

export function computarDiff(anterior: Record<string, unknown>, actual: Record<string, unknown>): string {
  const cambios: string[] = []

  for (const key in actual) {
    if (anterior[key] !== actual[key]) {
      cambios.push(`${key}: "${anterior[key]}" → "${actual[key]}"`)
    }
  }

  return cambios.join('; ')
}
