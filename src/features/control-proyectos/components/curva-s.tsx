'use client'

export interface Serie { label: string; color: string; values: number[] }

/**
 * Gráfico de Curva S multi-serie (SVG puro, sin librerías).
 * Sirve tanto para la curva FÍSICA (%) como para la FINANCIERA ($):
 * se le pasan las series y una función de formato para el eje/leyenda.
 */
export default function CurvaS({
  labels, series, fmt = (n) => String(Math.round(n)), maxHint = 0, vacio = 'Aún no hay datos.',
}: {
  labels: string[]
  series: Serie[]
  fmt?: (n: number) => string
  maxHint?: number
  vacio?: string
}) {
  const n = labels.length
  if (n === 0 || series.length === 0) {
    return <div style={{ padding: 24, textAlign: 'center', color: '#9a3412', fontSize: 13, background: '#fff' }}>{vacio} 📈</div>
  }

  const W = 720, H = 300, padL = 66, padR = 16, padT = 16, padB = 46
  const iw = W - padL - padR, ih = H - padT - padB
  const x = (i: number) => padL + (n === 1 ? iw / 2 : (iw * i) / (n - 1))
  const allVals = series.flatMap(s => s.values.filter(v => typeof v === 'number'))
  const maxY = Math.max(maxHint, 1, ...allVals)
  const y = (v: number) => padT + ih - (ih * Math.min(v || 0, maxY)) / maxY

  const puntos = (vals: number[]) => vals.map((v, i) => `${x(i)},${y(v || 0)}`).join(' ')
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => f * maxY)

  return (
    <div style={{ background: '#fff', padding: '8px 4px 4px', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 480, display: 'block' }} preserveAspectRatio="xMidYMid meet">
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={padL} y1={y(t)} x2={W - padR} y2={y(t)} stroke="#e2e8f0" strokeWidth={1} />
            <text x={padL - 8} y={y(t) + 4} textAnchor="end" fontSize={10} fill="#64748b">{fmt(t)}</text>
          </g>
        ))}
        {labels.map((lab, i) => (
          <text key={i} x={x(i)} y={H - padB + 18} textAnchor="middle" fontSize={10} fill="#475569"
            transform={n > 8 ? `rotate(35 ${x(i)} ${H - padB + 18})` : undefined}>{lab}</text>
        ))}
        {series.map((s, si) => (
          <g key={si}>
            <polyline points={puntos(s.values)} fill="none" stroke={s.color} strokeWidth={2.5} />
            {s.values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v || 0)} r={3} fill={s.color} />)}
          </g>
        ))}
      </svg>
      <div style={{ display: 'flex', gap: 18, justifyContent: 'center', flexWrap: 'wrap', marginTop: 4, fontSize: 12, color: '#334155', fontWeight: 600 }}>
        {series.map((s, i) => (
          <span key={i}><span style={{ display: 'inline-block', width: 14, height: 3, background: s.color, verticalAlign: 'middle', marginRight: 6 }} />{s.label}</span>
        ))}
      </div>
    </div>
  )
}
