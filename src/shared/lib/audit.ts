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
