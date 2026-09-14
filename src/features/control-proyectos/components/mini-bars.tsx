'use client'

/**
 * Gráfico de barras horizontales simple y liviano para el módulo Control de Proyectos.
 * Usa <span> para las barras (el CSS global fuerza fondo blanco solo en <div>, no en
 * <span>) y <b> para los valores (no le aplica el color azul global). Así se ve bien
 * dentro de las fichas y el portafolio sin envolver en .po-root.
 */
export interface BarItem { label: string; value: number; color: string }

export default function MiniBars({ items, fmt, maxHint = 0 }: { items: BarItem[]; fmt: (n: number) => string; maxHint?: number }) {
  if (!items.length) return null
  const max = Math.max(maxHint, 1, ...items.map(i => i.value || 0))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 140, minWidth: 140, fontSize: 12, color: '#334155', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</span>
          <span style={{ flex: 1, display: 'block', height: 22, background: '#eceff3', borderRadius: 6, overflow: 'hidden' }}>
            <span style={{ display: 'block', height: '100%', width: (max > 0 ? Math.max(1.5, (it.value / max) * 100) : 0) + '%', background: it.color, borderRadius: 6 }} />
          </span>
          <b style={{ width: 120, minWidth: 120, textAlign: 'right', fontSize: 12, color: '#0f172a', fontFamily: 'monospace' }}>{fmt(it.value)}</b>
        </div>
      ))}
    </div>
  )
}
