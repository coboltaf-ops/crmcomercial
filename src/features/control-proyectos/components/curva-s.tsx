'use client'
import { Corte } from '@/features/control-proyectos/store/control-proyectos-store'

/**
 * Gráfico de Curva S (avance físico acumulado): línea PLANEADA vs REAL.
 * SVG puro (sin librerías). Los textos van en <text> del SVG, que no se ve
 * afectado por las reglas de color globales del CRM.
 */
export default function CurvaS({ cortes }: { cortes: Corte[] }) {
  const data = (cortes || []).filter(c => c)
  if (data.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#9a3412', fontSize: 13, background: '#fff' }}>
        Aún no hay cortes. Agrega cortes de avance y la Curva S se dibuja sola. 📈
      </div>
    )
  }

  // Lienzo
  const W = 720, H = 300, padL = 44, padR = 16, padT = 16, padB = 46
  const iw = W - padL - padR, ih = H - padT - padB
  const n = data.length
  const x = (i: number) => padL + (n === 1 ? iw / 2 : (iw * i) / (n - 1))
  const maxY = Math.max(100, ...data.map(c => Math.max(c.pct_plan || 0, c.pct_real || 0)))
  const y = (v: number) => padT + ih - (ih * Math.min(v, maxY)) / maxY

  const linea = (sel: (c: Corte) => number) => data.map((c, i) => `${x(i)},${y(sel(c) || 0)}`).join(' ')
  const yTicks = [0, 25, 50, 75, 100].filter(t => t <= maxY).concat(maxY > 100 ? [Math.round(maxY)] : [])

  return (
    <div style={{ background: '#fff', padding: '8px 4px 4px', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 480, display: 'block' }} preserveAspectRatio="xMidYMid meet">
        {/* grilla + eje Y */}
        {yTicks.map(t => (
          <g key={t}>
            <line x1={padL} y1={y(t)} x2={W - padR} y2={y(t)} stroke="#e2e8f0" strokeWidth={1} />
            <text x={padL - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#64748b">{t}%</text>
          </g>
        ))}
        {/* eje X: periodos */}
        {data.map((c, i) => (
          <text key={c.id || i} x={x(i)} y={H - padB + 18} textAnchor="middle" fontSize={10} fill="#475569"
            transform={n > 8 ? `rotate(35 ${x(i)} ${H - padB + 18})` : undefined}>
            {c.periodo || (i + 1)}
          </text>
        ))}
        {/* línea PLANEADA */}
        <polyline points={linea(c => c.pct_plan)} fill="none" stroke="#2563eb" strokeWidth={2.5} />
        {data.map((c, i) => <circle key={'p' + i} cx={x(i)} cy={y(c.pct_plan || 0)} r={3} fill="#2563eb" />)}
        {/* línea REAL */}
        <polyline points={linea(c => c.pct_real)} fill="none" stroke="#ea580c" strokeWidth={2.5} />
        {data.map((c, i) => <circle key={'r' + i} cx={x(i)} cy={y(c.pct_real || 0)} r={3} fill="#ea580c" />)}
      </svg>
      {/* leyenda */}
      <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 4, fontSize: 12, color: '#334155', fontWeight: 600 }}>
        <span><span style={{ display: 'inline-block', width: 14, height: 3, background: '#2563eb', verticalAlign: 'middle', marginRight: 6 }} />Planeado</span>
        <span><span style={{ display: 'inline-block', width: 14, height: 3, background: '#ea580c', verticalAlign: 'middle', marginRight: 6 }} />Real</span>
      </div>
    </div>
  )
}
