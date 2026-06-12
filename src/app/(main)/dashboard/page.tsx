'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useClientesStore } from '@/features/clientes/store/clientes-store'
import { useContactosStore } from '@/features/contactos/store/contactos-store'
import { useProductosStore } from '@/features/productos/store/productos-store'
import { useOportunidadesStore } from '@/features/oportunidades/store/oportunidades-store'
import { useCotizacionesStore } from '@/features/cotizaciones/store/cotizaciones-store'
import { usePQRSStore } from '@/features/pqrs/store/pqrs-store'
import { useProyectosStore } from '@/features/proyectos/store/proyectos-store'
import { fmtMoney } from '@/shared/lib/format-number'

export default function DashboardPage() {
  const router = useRouter()
  const clientes = useClientesStore(s => s.clientes)
  const contactos = useContactosStore(s => s.contactos)
  const productos = useProductosStore(s => s.productos)
  const oportunidades = useOportunidadesStore(s => s.oportunidades)
  const cotizaciones = useCotizacionesStore(s => s.cotizaciones)
  const pqrs = usePQRSStore(s => s.pqrs)
  const proyectos = useProyectosStore(s => s.proyectos)

  // El dashboard carga sus propios datos desde el servidor, así los conteos
  // son reales aunque no hayas visitado cada módulo primero.
  const loadClientes = useClientesStore(s => s.loadClientes)
  const loadContactos = useContactosStore(s => s.loadContactos)
  const loadProductos = useProductosStore(s => s.loadProductos)
  const loadOportunidades = useOportunidadesStore(s => s.loadOportunidades)
  const loadCotizaciones = useCotizacionesStore(s => s.loadCotizaciones)
  const loadPQRS = usePQRSStore(s => s.loadPQRS)
  const loadProyectos = useProyectosStore(s => s.loadProyectos)
  useEffect(() => {
    loadClientes(); loadContactos(); loadProductos()
    loadOportunidades(); loadCotizaciones(); loadPQRS(); loadProyectos()
  }, [loadClientes, loadContactos, loadProductos, loadOportunidades, loadCotizaciones, loadPQRS, loadProyectos])

  const opoAbiertas = oportunidades.filter(o => o.situacion === 'Abierta' || o.situacion === 'En Negociación')
  const pqrsAbiertas = pqrs.filter(p => p.situacion !== 'Cerrada')
  const cotPendientes = cotizaciones.filter(c => c.situacion === 'Borrador' || c.situacion === 'Enviada')

  const cardStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '2px solid #dc2626', borderRadius: 16, padding: 24,
  }

  const cards = [
    { label: 'Empresas', value: clientes.length, icon: '🏢', color: '#1e3a8a', href: '/clientes' },
    { label: 'Contactos', value: contactos.length, icon: '👤', color: '#1e3a8a', href: '/contactos' },
    { label: 'Oportunidades', value: opoAbiertas.length, icon: '🎯', color: '#1e3a8a', href: '/oportunidades' },
    { label: 'Proyectos', value: proyectos.length, icon: '🏗️', color: '#1e3a8a', href: '/proyectos' },
    { label: 'Cotizaciones', value: cotizaciones.length, icon: '📋', color: '#1e3a8a', href: '/cotizaciones' },
    { label: 'PQRS Abiertas', value: pqrsAbiertas.length, icon: '📩', color: '#1e3a8a', href: '/pqrs' },
    { label: 'Productos', value: productos.length, icon: '📦', color: '#1e3a8a', href: '/productos' },
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

  // Pipeline de Ventas — barras verticales por ETAPA (monto por etapa)
  const ETAPA_ORDEN = ['Prospección', 'Calificación', 'Propuesta', 'Negociación', 'Cierre']
  // Colores: azul oscuro, azul claro, rojo intenso, rojo suave, morado suave
  const ETAPA_COLORES = ['#1e3a8a', '#60a5fa', '#dc2626', '#f87171', '#c4b5fd']
  // Colores FIJOS para etapas específicas (lo demás usa la paleta de arriba)
  const ETAPA_COLOR_FIJO: Record<string, string> = {
    'Negociación': '#1e3a8a',   // azul oscuro
    'Cancelada': '#dc2626',     // rojo intenso
    'Sin etapa': '#ea580c',     // naranja intenso
    'Construccion Oferta': '#38bdf8',  // azul celeste
  }
  const etapaMap: Record<string, { count: number; monto: number }> = {}
  oportunidades.forEach(o => {
    const e = (o.etapa || '').trim() || 'Sin etapa'
    if (!etapaMap[e]) etapaMap[e] = { count: 0, monto: 0 }
    etapaMap[e].count++
    etapaMap[e].monto += (o.valor_estimado || o.monto_estimado || 0)
  })
  const orden = (x: string) => { const i = ETAPA_ORDEN.indexOf(x); return i === -1 ? 99 : i }
  const opoPorEtapa = Object.keys(etapaMap)
    .sort((a, b) => orden(a) - orden(b))
    .map((etapa, idx) => ({
      etapa,
      count: etapaMap[etapa].count,
      monto: etapaMap[etapa].monto,
      cidx: (ETAPA_ORDEN.indexOf(etapa) !== -1 ? ETAPA_ORDEN.indexOf(etapa) : idx) % ETAPA_COLORES.length,
    }))
  const maxEtapaMonto = Math.max(1, ...opoPorEtapa.map(e => e.monto))
  const totalOpoCount = oportunidades.length
  const totalOpoMonto = opoPorEtapa.reduce((s, x) => s + x.monto, 0)

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', marginBottom: 24 }}>Dashboard</h1>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {cards.map(c => (
          <div key={c.label} className="dash-card" onClick={() => router.push(c.href)}
            title={`Ir a ${c.label}`} style={{ ...cardStyle, cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>{c.icon}</span>
              <span style={{ fontSize: 32, fontWeight: 800, color: c.color }}>{c.value}</span>
            </div>
            <p style={{ color: '#1e3a8a', fontSize: 13 }}>{c.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Pipeline de Ventas — barras verticales por etapa */}
        <div className="dash-card" onClick={() => router.push('/oportunidades')} title="Ir a Oportunidades" style={{ ...cardStyle, cursor: 'pointer' }}>
          <h2 style={{ color: '#1e3a8a', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Pipeline de Ventas</h2>
          {/* Totales arriba */}
          <div style={{ display: 'flex', gap: 24, marginBottom: 14 }}>
            <div>
              <p style={{ color: '#1e3a8a', fontSize: 12 }}>Total Oportunidades</p>
              <p style={{ color: '#1e3a8a', fontSize: 24, fontWeight: 800 }}>{totalOpoCount}</p>
            </div>
            <div>
              <p style={{ color: '#1e3a8a', fontSize: 12 }}>Total General</p>
              <p style={{ color: '#1e3a8a', fontSize: 24, fontWeight: 800 }}>${fmtMoney(totalOpoMonto)}</p>
            </div>
          </div>
          {totalOpoCount === 0 ? (
            <p style={{ color: '#1e3a8a', fontSize: 13 }}>No hay oportunidades registradas</p>
          ) : (
            <div style={{ overflowX: 'auto', paddingTop: 8 }}>
              <svg width={Math.max(opoPorEtapa.length * 104, 220)} height={210} style={{ display: 'block' }}>
                {opoPorEtapa.map((e, i) => {
                  const slot = 104, barW = 50, chartH = 145, topPad = 22
                  const h = Math.max(6, Math.round((e.monto / maxEtapaMonto) * chartH))
                  const cx = i * slot + slot / 2
                  const y = topPad + (chartH - h)
                  return (
                    <g key={e.etapa}>
                      <rect x={cx - barW / 2} y={y} width={barW} height={h} rx={4} fill={ETAPA_COLOR_FIJO[e.etapa] || ETAPA_COLORES[e.cidx]} />
                      <text x={cx} y={y - 6} textAnchor="middle" fontSize={11} fontWeight={800} fill="#1e3a8a">${fmtMoney(e.monto)}</text>
                      <text x={cx} y={topPad + chartH + 17} textAnchor="middle" fontSize={11} fontWeight={700} fill="#1e3a8a">{e.etapa}</text>
                      <text x={cx} y={topPad + chartH + 31} textAnchor="middle" fontSize={10} fill="#64748b">{e.count} op.</text>
                    </g>
                  )
                })}
              </svg>
            </div>
          )}
        </div>

        {/* Cotizaciones resumen */}
        <div className="dash-card" onClick={() => router.push('/cotizaciones')} title="Ir a Cotizaciones" style={{ ...cardStyle, cursor: 'pointer' }}>
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
        <div className="dash-card" onClick={() => router.push('/pqrs')} title="Ir a PQRS" style={{ ...cardStyle, cursor: 'pointer' }}>
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
      <div className="dash-card" onClick={() => router.push('/clientes')} title="Ir a Empresas" style={{ ...cardStyle, marginBottom: 24, cursor: 'pointer' }}>
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
