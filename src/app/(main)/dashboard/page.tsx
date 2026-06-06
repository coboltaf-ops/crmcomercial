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
  const totalPipeline = opoAbiertas.reduce((s, o) => s + (o.valor_estimado || o.monto_estimado || 0), 0)
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

  // Oportunidades por etapa
  const etapas = ['Prospección', 'Calificación', 'Propuesta', 'Negociación', 'Cierre']
  const opoPorEtapa = etapas.map(e => ({
    etapa: e,
    count: oportunidades.filter(o => o.etapa === e && (o.situacion === 'Abierta' || o.situacion === 'En Negociación')).length,
    valor: oportunidades.filter(o => o.etapa === e && (o.situacion === 'Abierta' || o.situacion === 'En Negociación')).reduce((s, o) => s + (o.valor_estimado || o.monto_estimado || 0), 0),
  }))

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
        {/* Pipeline */}
        <div className="dash-card" style={cardStyle}>
          <h2 style={{ color: '#1e3a8a', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Pipeline de Ventas</h2>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <div>
              <p style={{ color: '#1e3a8a', fontSize: 12 }}>Oportunidades</p>
              <p style={{ color: '#1e3a8a', fontSize: 28, fontWeight: 800 }}>{opoAbiertas.length}</p>
            </div>
            <div>
              <p style={{ color: '#1e3a8a', fontSize: 12 }}>Valor Total</p>
              <p style={{ color: '#1e3a8a', fontSize: 28, fontWeight: 800 }}>${fmtMoney(totalPipeline)}</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {opoPorEtapa.map(e => (
              <div key={e.etapa} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: '#1e3a8a', fontSize: 12, width: 100 }}>{e.etapa}</span>
                <div style={{ flex: 1, height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${opoAbiertas.length ? (e.count / opoAbiertas.length) * 100 : 0}%`, background: '#1e3a8a', borderRadius: 4, transition: 'width 0.3s' }} />
                </div>
                <span style={{ color: '#1e3a8a', fontSize: 12, fontWeight: 600, width: 24, textAlign: 'right' }}>{e.count}</span>
              </div>
            ))}
          </div>
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
