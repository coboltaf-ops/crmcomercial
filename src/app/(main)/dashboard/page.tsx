'use client'
import { useClientesStore } from '@/features/clientes/store/clientes-store'
import { useContactosStore } from '@/features/contactos/store/contactos-store'
import { useProductosStore } from '@/features/productos/store/productos-store'
import { useOportunidadesStore } from '@/features/oportunidades/store/oportunidades-store'
import { useCotizacionesStore } from '@/features/cotizaciones/store/cotizaciones-store'
import { usePQRSStore } from '@/features/pqrs/store/pqrs-store'
import { fmtMoney } from '@/shared/lib/format-number'

export default function DashboardPage() {
  const clientes = useClientesStore(s => s.clientes)
  const contactos = useContactosStore(s => s.contactos)
  const productos = useProductosStore(s => s.productos)
  const oportunidades = useOportunidadesStore(s => s.oportunidades)
  const cotizaciones = useCotizacionesStore(s => s.cotizaciones)
  const pqrs = usePQRSStore(s => s.pqrs)

  const opoAbiertas = oportunidades.filter(o => o.situacion === 'Abierta' || o.situacion === 'En Negociación')
  const pqrsAbiertas = pqrs.filter(p => p.situacion !== 'Cerrada')
  const cotPendientes = cotizaciones.filter(c => c.situacion === 'Borrador' || c.situacion === 'Enviada')

  const cardStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '2px solid #dc2626', borderRadius: 16, padding: 24,
  }

  const cards = [
    { label: 'Empresas', value: clientes.length, icon: '🏢', color: '#1e3a8a' },
    { label: 'Contactos', value: contactos.length, icon: '👤', color: '#1e3a8a' },
    { label: 'Oportunidades', value: opoAbiertas.length, icon: '🎯', color: '#1e3a8a' },
    { label: 'Cotizaciones', value: cotizaciones.length, icon: '📋', color: '#1e3a8a' },
    { label: 'PQRS Abiertas', value: pqrsAbiertas.length, icon: '📩', color: '#1e3a8a' },
    { label: 'Productos', value: productos.length, icon: '📦', color: '#1e3a8a' },
  ]

  // PQRS por tipo
  const pqrsPorTipo = ['Petición', 'Queja', 'Reclamo', 'Sugerencia'].map(t => ({
    tipo: t, count: pqrs.filter(p => p.tipo === t).length,
    abiertas: pqrs.filter(p => p.tipo === t && p.situacion !== 'Cerrada').length,
  }))
  const tipoIcons: Record<string, string> = { 'Petición': '📝', 'Queja': '😤', 'Reclamo': '⚠️', 'Sugerencia': '💡' }

  // Clientes por ciudad (gráfico de barras)
  const ciudadCount: Record<string, number> = {}
  clientes.forEach(c => {
    const ciu = (c.ciudad || '').trim() || 'Sin ciudad'
    ciudadCount[ciu] = (ciudadCount[ciu] || 0) + 1
  })
  const clientesPorCiudad = Object.entries(ciudadCount)
    .map(([ciudad, count]) => ({ ciudad, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)
  const maxCiudad = Math.max(1, ...clientesPorCiudad.map(c => c.count))

  // Pipeline por situación (gráfico de torta)
  const sitColors: Record<string, string> = { 'Abierta': '#2563eb', 'En Negociación': '#f59e0b', 'Ganada': '#16a34a', 'Perdida': '#dc2626' }
  const sitMap: Record<string, { count: number; monto: number }> = {}
  oportunidades.forEach(o => {
    const s = o.situacion || 'Otra'
    if (!sitMap[s]) sitMap[s] = { count: 0, monto: 0 }
    sitMap[s].count++
    sitMap[s].monto += (o.valor_estimado || o.monto_estimado || 0)
  })
  const opoPorSituacion = Object.entries(sitMap)
    .map(([situacion, v]) => ({ situacion, count: v.count, monto: v.monto, color: sitColors[situacion] || '#6b7280' }))
    .sort((a, b) => b.count - a.count)
  const totalOpoCount = oportunidades.length
  const totalOpoMonto = opoPorSituacion.reduce((s, x) => s + x.monto, 0)

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', marginBottom: 24 }}>Dashboard</h1>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {cards.map(c => (
          <div key={c.label} className="dash-card" style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>{c.icon}</span>
              <span style={{ fontSize: 32, fontWeight: 800, color: c.color }}>{c.value}</span>
            </div>
            <p style={{ color: '#1e3a8a', fontSize: 13 }}>{c.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Pipeline de Ventas — torta por situación */}
        <div className="dash-card" style={cardStyle}>
          <h2 style={{ color: '#1e3a8a', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Pipeline de Ventas</h2>
          {/* Totales arriba */}
          <div style={{ display: 'flex', gap: 24, marginBottom: 18 }}>
            <div>
              <p style={{ color: '#1e3a8a', fontSize: 12 }}>Cantidad</p>
              <p style={{ color: '#1e3a8a', fontSize: 28, fontWeight: 800 }}>{totalOpoCount}</p>
            </div>
            <div>
              <p style={{ color: '#1e3a8a', fontSize: 12 }}>Monto Total</p>
              <p style={{ color: '#1e3a8a', fontSize: 28, fontWeight: 800 }}>${fmtMoney(totalOpoMonto)}</p>
            </div>
          </div>
          {totalOpoCount === 0 ? (
            <p style={{ color: '#1e3a8a', fontSize: 13 }}>No hay oportunidades registradas</p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              {/* Torta (donut) en SVG */}
              <svg width="150" height="150" viewBox="0 0 150 150" style={{ flexShrink: 0 }}>
                <g transform="rotate(-90 75 75)">
                  {(() => {
                    const C = 2 * Math.PI * 55
                    let acc = 0
                    return opoPorSituacion.filter(s => s.count > 0).map(s => {
                      const frac = s.count / (totalOpoCount || 1)
                      const dash = frac * C
                      const el = (
                        <circle key={s.situacion} cx="75" cy="75" r="55" fill="none"
                          stroke={s.color} strokeWidth="30"
                          strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-acc} />
                      )
                      acc += dash
                      return el
                    })
                  })()}
                </g>
                <text x="75" y="70" textAnchor="middle" fontSize="22" fontWeight="800" fill="#1e3a8a">{totalOpoCount}</text>
                <text x="75" y="90" textAnchor="middle" fontSize="10" fill="#1e3a8a">oportunidades</text>
              </svg>
              {/* Leyenda */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 160 }}>
                {opoPorSituacion.map(s => (
                  <div key={s.situacion} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="12" height="12" style={{ flexShrink: 0 }}><circle cx="6" cy="6" r="6" fill={s.color} /></svg>
                    <span style={{ color: '#1e3a8a', fontSize: 12, fontWeight: 600, flex: 1 }}>{s.situacion}</span>
                    <span style={{ color: '#1e3a8a', fontSize: 12, fontWeight: 800 }}>{s.count}</span>
                    <span style={{ color: '#1e3a8a', fontSize: 11, fontWeight: 600, minWidth: 70, textAlign: 'right' }}>${fmtMoney(s.monto)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cotizaciones resumen */}
        <div className="dash-card" style={cardStyle}>
          <h2 style={{ color: '#1e3a8a', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Cotizaciones</h2>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <div>
              <p style={{ color: '#1e3a8a', fontSize: 12 }}>Pendientes</p>
              <p style={{ color: '#1e3a8a', fontSize: 28, fontWeight: 800 }}>{cotPendientes.length}</p>
            </div>
            <div>
              <p style={{ color: '#1e3a8a', fontSize: 12 }}>Total</p>
              <p style={{ color: '#1e3a8a', fontSize: 28, fontWeight: 800 }}>{cotizaciones.length}</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['Borrador', 'Enviada', 'Aprobada', 'Rechazada', 'Vencida'].map(s => {
              const count = cotizaciones.filter(c => c.situacion === s).length
              const colors: Record<string, string> = { Borrador: '#1e3a8a', Enviada: '#1e3a8a', Aprobada: '#1e3a8a', Rechazada: '#1e3a8a', Vencida: '#1e3a8a' }
              return (
                <div key={s} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#1e3a8a', fontSize: 12 }}>{s}</span>
                  <span style={{ color: colors[s] || '#fff', fontSize: 13, fontWeight: 600 }}>{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* PQRS por tipo */}
        <div className="dash-card" style={cardStyle}>
          <h2 style={{ color: '#1e3a8a', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>PQRS por Tipo</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {pqrsPorTipo.map(t => (
              <div key={t.tipo} style={{ background: '#f1f5f9', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                <span style={{ fontSize: 24 }}>{tipoIcons[t.tipo]}</span>
                <p style={{ color: '#1e3a8a', fontSize: 18, fontWeight: 800 }}>{t.count}</p>
                <p style={{ color: '#1e3a8a', fontSize: 11 }}>{t.tipo}</p>
                {t.abiertas > 0 && <p style={{ color: '#1e3a8a', fontSize: 10 }}>{t.abiertas} abiertas</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="dash-card" style={cardStyle}>
          <h2 style={{ color: '#1e3a8a', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Resumen General</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
              <span style={{ color: '#1e3a8a', fontSize: 13 }}>Empresas Activas</span>
              <span style={{ color: '#1e3a8a', fontWeight: 600 }}>{clientes.filter(c => c.situacion === 'Activo').length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
              <span style={{ color: '#1e3a8a', fontSize: 13 }}>Contactos Principales</span>
              <span style={{ color: '#1e3a8a', fontWeight: 600 }}>{contactos.filter(c => c.es_principal).length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
              <span style={{ color: '#1e3a8a', fontSize: 13 }}>Productos Activos</span>
              <span style={{ color: '#1e3a8a', fontWeight: 600 }}>{productos.filter(p => p.situacion === 'Activo').length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
              <span style={{ color: '#1e3a8a', fontSize: 13 }}>Oportunidades Ganadas</span>
              <span style={{ color: '#1e3a8a', fontWeight: 600 }}>{oportunidades.filter(o => o.situacion === 'Ganada').length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ color: '#1e3a8a', fontSize: 13 }}>PQRS Urgentes</span>
              <span style={{ color: '#1e3a8a', fontWeight: 600 }}>{pqrs.filter(p => p.prioridad === 'Urgente' && p.situacion !== 'Cerrada').length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico: Clientes por Ciudad (barras verticales) */}
      <div className="dash-card" style={{ ...cardStyle, marginBottom: 24 }}>
        <h2 style={{ color: '#1e3a8a', fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Clientes por Ciudad</h2>
        {clientesPorCiudad.length === 0 ? (
          <p style={{ color: '#1e3a8a', fontSize: 13 }}>No hay clientes registrados</p>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 240, paddingTop: 20, overflowX: 'auto' }}>
            {clientesPorCiudad.map((c, i) => (
              <div key={c.ciudad} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', flex: '1 0 56px', minWidth: 56, height: '100%' }}>
                <span style={{ color: '#1e3a8a', fontSize: 15, fontWeight: 800, marginBottom: 4 }}>{c.count}</span>
                <div className={`bar-c${i % 8}`} style={{ width: '100%', maxWidth: 46, height: `${(c.count / maxCiudad) * 100}%`, minHeight: 6, borderRadius: '6px 6px 0 0' }} />
                <span style={{ color: '#1e3a8a', fontSize: 11, fontWeight: 600, marginTop: 6, textAlign: 'center', wordBreak: 'break-word' }}>{c.ciudad}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
