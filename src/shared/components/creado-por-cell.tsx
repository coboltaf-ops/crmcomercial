import { type Auditoria } from '@/shared/lib/audit'
import { formatDateTimeCO } from '@/shared/lib/format-date'

/**
 * Celda reutilizable para la columna "Creado Por": muestra el nombre del
 * usuario y, debajo, la fecha/hora de creación (DD/MM/AAAA HH:mm).
 */
export function CreadoPorCell({ r }: { r?: Auditoria | null }) {
  if (!r || !r.creado_por) {
    return <span style={{ color: '#374151' }}>—</span>
  }
  return (
    <div className="leading-tight">
      <div className="text-[#0b1d4a] font-semibold text-xs whitespace-nowrap">{r.creado_por}</div>
      {r.creado_en && (
        <div className="text-[11px] whitespace-nowrap" style={{ color: '#374151' }}>
          {formatDateTimeCO(r.creado_en)}
        </div>
      )}
    </div>
  )
}
