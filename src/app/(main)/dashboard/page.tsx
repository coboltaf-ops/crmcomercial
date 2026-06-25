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
import { useFactoresStore } from '@/features/factores-monedas/store/factores-store'
import { fmtMoney } from '@/shared/lib/format-number'
import { DEPARTAMENTOS } from '@/features/dashboard/colombia-departamentos'

// ── Mapa de Colombia: proyección de coordenadas reales (lat/lon) a SVG ──
const MAPA_W = 300, MAPA_H = 410
const LON_MIN = -79.2, LON_MAX = -66.8, LAT_MIN = -4.3, LAT_MAX = 12.7
const proj = (lat: number, lon: number): [number, number] => [
  ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * MAPA_W,
  ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * MAPA_H,
]
// Borde REAL de Colombia continental (datos geográficos, 176 puntos · lat, lon)
const COLOMBIA_BORDE: [number, number][] = [
  [1.434, -78.829], [1.638, -79.022], [1.822, -78.846], [1.782, -78.571], [2.19, -78.703],
  [2.433, -78.574], [2.648, -78.346], [2.542, -78.255], [2.664, -78.247], [2.493, -78.132],
  [2.651, -78.096], [2.592, -77.76], [2.764, -77.812], [2.932, -77.62], [2.982, -77.722],
  [3.356, -77.457], [3.32, -77.319], [3.548, -77.322], [3.678, -77.118], [3.743, -77.201],
  [3.916, -77.032], [3.841, -77.253], [3.969, -77.3], [4.067, -77.189], [4.108, -77.264],
  [3.93, -77.346], [4.029, -77.435], [4.18, -77.427], [4.265, -77.236], [4.347, -77.387],
  [4.753, -77.326], [4.704, -77.258], [5.403, -77.381], [5.503, -77.559], [5.734, -77.246],
  [6.189, -77.484], [6.566, -77.345], [6.849, -77.696], [7.016, -77.665], [7.235, -77.896],
  [7.53, -77.731], [7.706, -77.764], [7.528, -77.58], [7.939, -77.163], [8.474, -77.489],
  [8.628, -77.434], [8.669, -77.352], [8.129, -76.943], [8.137, -76.832], [7.93, -76.907],
  [7.924, -76.757], [8.417, -76.775], [8.545, -76.947], [8.948, -76.316], [9.441, -75.944],
  [9.453, -75.621], [9.621, -75.576], [9.701, -75.705], [10.241, -75.531], [10.134, -75.704],
  [10.319, -75.516], [10.576, -75.52], [10.707, -75.25], [10.795, -75.267], [11.11, -74.844],
  [10.991, -74.298], [10.868, -74.597], [10.782, -74.598], [10.765, -74.5], [10.845, -74.51],
  [10.749, -74.395], [11.344, -74.153], [11.294, -73.292], [11.708, -72.741], [11.886, -72.263],
  [12.256, -72.139], [12.166, -71.938], [12.256, -71.871], [12.283, -71.961], [12.365, -71.694],
  [12.468, -71.676], [12.342, -71.262], [12.016, -71.138], [11.812, -71.41], [11.649, -71.991],
  [11.155, -72.267], [11.121, -72.499], [10.856, -72.683], [10.433, -72.915], [9.812, -72.986],
  [9.173, -73.391], [9.295, -73.01], [9.104, -72.955], [9.114, -72.791], [8.652, -72.675],
  [8.355, -72.394], [8.104, -72.336], [7.938, -72.491], [7.484, -72.479], [7.382, -72.206],
  [7.013, -71.994], [6.963, -71.184], [7.1, -70.703], [6.938, -70.319], [6.973, -70.129],
  [6.122, -69.444], [6.081, -69.246], [6.218, -69.061], [6.136, -68.635], [6.313, -67.827],
  [6.198, -67.45], [5.978, -67.422], [5.785, -67.625], [5.542, -67.617], [5.339, -67.835],
  [4.533, -67.875], [3.762, -67.632], [3.718, -67.5], [3.384, -67.309], [2.79, -67.856],
  [2.813, -67.627], [2.394, -67.19], [1.35, -66.884], [1.223, -66.875], [1.176, -67.086],
  [1.71, -67.117], [2.138, -67.425], [1.741, -67.929], [2.015, -68.192], [1.829, -68.28],
  [1.721, -68.163], [1.708, -69.856], [1.059, -69.852], [1.038, -69.289], [0.65, -69.137],
  [0.733, -69.478], [0.588, -70.054], [-0.16, -70.068], [-0.525, -69.62], [-0.733, -69.628],
  [-1.183, -69.399], [-4.236, -69.965], [-3.829, -70.311], [-3.782, -70.734], [-2.715, -70.051],
  [-2.625, -70.106], [-2.451, -70.648], [-2.211, -70.905], [-2.376, -71.421], [-2.255, -71.456],
  [-2.315, -71.498], [-2.132, -71.746], [-2.41, -72.176], [-2.451, -72.378], [-2.334, -72.644],
  [-2.425, -72.935], [-2.214, -73.198], [-2.073, -73.111], [-1.789, -73.193], [-1.674, -73.531],
  [-1.478, -73.497], [-1.255, -73.637], [-0.972, -74.267], [-0.543, -74.418], [-0.313, -74.791],
  [-0.17, -74.825], [0.084, -75.79], [0.462, -76.3], [0.402, -76.416], [0.255, -76.408],
  [0.216, -76.565], [0.388, -77.397], [0.651, -77.468], [0.843, -77.703], [0.921, -78.12],
  [1.434, -78.829],
]
// Coordenadas (lat, lon) de ciudades de Colombia
const CIUDAD_COORDS: Record<string, [number, number]> = {
  'bogota': [4.61, -74.08], 'medellin': [6.25, -75.56], 'cali': [3.44, -76.52],
  'barranquilla': [10.96, -74.80], 'cartagena': [10.39, -75.51], 'cucuta': [7.89, -72.50],
  'bucaramanga': [7.12, -73.12], 'pereira': [4.81, -75.69], 'manizales': [5.07, -75.52],
  'santa marta': [11.24, -74.20], 'ibague': [4.44, -75.24], 'pasto': [1.21, -77.28],
  'villavicencio': [4.14, -73.63], 'neiva': [2.93, -75.28], 'armenia': [4.53, -75.68],
  'monteria': [8.75, -75.88], 'valledupar': [10.46, -73.25], 'sincelejo': [9.30, -75.40],
  'popayan': [2.44, -76.61], 'tunja': [5.53, -73.36], 'riohacha': [11.54, -72.91],
  'quibdo': [5.69, -76.66], 'florencia': [1.61, -75.61], 'yopal': [5.34, -72.40],
  'leticia': [-4.21, -69.94], 'palmira': [3.54, -76.30], 'soacha': [4.58, -74.22],
  'bello': [6.34, -75.56], 'tulua': [4.08, -76.20], 'cartago': [4.75, -75.91],
  'duitama': [5.83, -73.03], 'sogamoso': [5.71, -72.93], 'girardot': [4.30, -74.80],
  'buenaventura': [3.88, -77.03], 'maicao': [11.38, -72.24],
  // Municipios y otras ciudades
  'cota': [4.81, -74.10], 'chia': [4.86, -74.06], 'zipaquira': [5.03, -74.00],
  'envigado': [6.17, -75.59], 'itagui': [6.18, -75.61], 'sabaneta': [6.15, -75.62],
  'rionegro': [6.15, -75.37], 'apartado': [7.88, -76.63], 'turbo': [8.09, -76.73],
  'floridablanca': [7.06, -73.09], 'giron': [7.07, -73.17], 'piedecuesta': [6.99, -73.05],
  'facatativa': [4.81, -74.35], 'fusagasuga': [4.34, -74.37], 'madrid': [4.73, -74.27],
  'mosquera': [4.71, -74.23], 'jamundi': [3.26, -76.54], 'yumbo': [3.58, -76.50],
  'malambo': [10.86, -74.77], 'soledad': [10.92, -74.76], 'caucasia': [7.99, -75.20],
  'magangue': [9.24, -74.75], 'aguachica': [8.31, -73.61], 'ocana': [8.24, -73.36],
  // Internacionales (fuera de Colombia)
  'quito': [-0.18, -78.47],
}
const normCiudad = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()

export default function DashboardPage() {
  const router = useRouter()
  const clientes = useClientesStore(s => s.clientes)
  const contactos = useContactosStore(s => s.contactos)
  const productos = useProductosStore(s => s.productos)
  const oportunidades = useOportunidadesStore(s => s.oportunidades)
  const cotizaciones = useCotizacionesStore(s => s.cotizaciones)
  const pqrs = usePQRSStore(s => s.pqrs)
  const proyectos = useProyectosStore(s => s.proyectos)
  const factores = useFactoresStore(s => s.factores)

  // El dashboard carga sus propios datos desde el servidor, así los conteos
  // son reales aunque no hayas visitado cada módulo primero.
  const loadClientes = useClientesStore(s => s.loadClientes)
  const loadContactos = useContactosStore(s => s.loadContactos)
  const loadProductos = useProductosStore(s => s.loadProductos)
  const loadOportunidades = useOportunidadesStore(s => s.loadOportunidades)
  const loadCotizaciones = useCotizacionesStore(s => s.loadCotizaciones)
  const loadPQRS = usePQRSStore(s => s.loadPQRS)
  const loadProyectos = useProyectosStore(s => s.loadProyectos)
  const loadFactores = useFactoresStore(s => s.loadFactores)
  useEffect(() => {
    loadClientes(); loadContactos(); loadProductos()
    loadOportunidades(); loadCotizaciones(); loadPQRS(); loadProyectos(); loadFactores()
  }, [loadClientes, loadContactos, loadProductos, loadOportunidades, loadCotizaciones, loadPQRS, loadProyectos, loadFactores])

  // Factor US$ → Euro (del registro activo más reciente de Factores). Euro = US$ / factor.
  const factorUsdEur = factores.filter(f => f.situacion === 'Activo').slice(-1)[0]?.factor_usd_euro || 0
  const usd = (n: number) => `US$ ${fmtMoney(n)}`
  const eur = (n: number) => factorUsdEur > 0 ? `Euro ${fmtMoney(n / factorUsdEur)}` : 'Euro —'

  const opoAbiertas = oportunidades.filter(o => o.situacion === 'Abierta' || o.situacion === 'En Negociación')
  const pqrsAbiertas = pqrs.filter(p => p.situacion !== 'Cerrada')
  const cotPendientes = cotizaciones.filter(c => c.situacion === 'Borrador' || c.situacion === 'Enviada')

  const cardStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '2px solid #dc2626', borderRadius: 16, padding: 24,
  }

  const cards = [
    { label: 'Empresas', value: clientes.length, icon: '🏢', color: '#000000', href: '/clientes' },
    { label: 'Contactos', value: contactos.length, icon: '👤', color: '#000000', href: '/contactos' },
    { label: 'Oportunidades', value: opoAbiertas.length, icon: '🎯', color: '#000000', href: '/oportunidades' },
    { label: 'Proyectos', value: proyectos.length, icon: '🏗️', color: '#000000', href: '/proyectos' },
    { label: 'Cotizaciones', value: cotizaciones.length, icon: '📋', color: '#000000', href: '/cotizaciones' },
    { label: 'PQRS Abiertas', value: pqrsAbiertas.length, icon: '📩', color: '#000000', href: '/pqrs' },
    { label: 'Productos', value: productos.length, icon: '📦', color: '#000000', href: '/productos' },
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

  // Clientes en el mapa de Colombia (ciudades con coordenadas conocidas)
  const mapaCiudades = Object.entries(ciudadCount)
    .map(([ciudad, count]) => ({ ciudad, count, coord: CIUDAD_COORDS[normCiudad(ciudad)] }))
    .filter((c): c is { ciudad: string; count: number; coord: [number, number] } => !!c.coord)
    .sort((a, b) => b.count - a.count)
  // Separar marcadores de ciudades muy cercanas (ej. Bogotá y Cota) para que no se tapen
  const mapaPuntos = (() => {
    const placed: { x: number; y: number }[] = []
    return mapaCiudades.map(c => {
      let [x, y] = proj(c.coord[0], c.coord[1])
      let t = 0
      while (placed.some(p => Math.hypot(p.x - x, p.y - y) < 24) && t < 18) {
        const ang = t * 1.25
        x += Math.cos(ang) * 14
        y += Math.sin(ang) * 14
        t++
      }
      placed.push({ x, y })
      return { ...c, x, y }
    })
  })()

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

  // Proyectos por situación — monto aprobado y cobrado
  const proySitMap: Record<string, { aprobado: number; cobrado: number; count: number }> = {}
  proyectos.forEach(p => {
    const s = (p.situacion || '').trim() || 'Sin situación'
    if (!proySitMap[s]) proySitMap[s] = { aprobado: 0, cobrado: 0, count: 0 }
    proySitMap[s].aprobado += p.monto_aprobado || 0
    proySitMap[s].cobrado += p.monto_cobrado || 0
    proySitMap[s].count++
  })
  const proyPorSituacion = Object.entries(proySitMap)
    .map(([situacion, v]) => ({ situacion, ...v }))
    .sort((a, b) => b.aprobado - a.aprobado)
  const maxProyMonto = Math.max(1, ...proyPorSituacion.flatMap(p => [p.aprobado, p.cobrado]))
  const totalProyAprobado = proyPorSituacion.reduce((s, p) => s + p.aprobado, 0)
  const totalProyCobrado = proyPorSituacion.reduce((s, p) => s + p.cobrado, 0)

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
            <p style={{ color: '#000000', fontSize: 13 }}>{c.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Pipeline de Ventas — barras verticales por etapa */}
        <div className="dash-card" onClick={() => router.push('/oportunidades')} title="Ir a Oportunidades" style={{ ...cardStyle, cursor: 'pointer' }}>
          <h2 style={{ color: '#000000', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Pipeline de Ventas</h2>
          {/* Totales arriba */}
          <div style={{ display: 'flex', gap: 24, marginBottom: 14 }}>
            <div>
              <p style={{ color: '#000000', fontSize: 12 }}>Total Oportunidades</p>
              <p style={{ color: '#000000', fontSize: 22, fontWeight: 900 }}>{totalOpoCount}</p>
            </div>
            <div>
              <p style={{ color: '#000000', fontSize: 12 }}>Total General</p>
              <p style={{ color: '#000000', fontSize: 19, fontWeight: 900 }}>{usd(totalOpoMonto)}</p>
              <p style={{ color: '#000000', fontSize: 19, fontWeight: 900 }}>{eur(totalOpoMonto)}</p>
            </div>
          </div>
          {totalOpoCount === 0 ? (
            <p style={{ color: '#000000', fontSize: 13 }}>No hay oportunidades registradas</p>
          ) : (
            <div style={{ overflowX: 'auto', paddingTop: 8 }}>
              <svg width={Math.max(opoPorEtapa.length * 110, 240)} height={216} style={{ display: 'block' }}>
                {opoPorEtapa.map((e, i) => {
                  const slot = 110, barW = 48, chartH = 135, topPad = 34
                  const h = Math.max(6, Math.round((e.monto / maxEtapaMonto) * chartH))
                  const cx = i * slot + slot / 2
                  const y = topPad + (chartH - h)
                  return (
                    <g key={e.etapa}>
                      <rect x={cx - barW / 2} y={y} width={barW} height={h} rx={4} fill={ETAPA_COLOR_FIJO[e.etapa] || ETAPA_COLORES[e.cidx]} />
                      <text x={cx} y={y - 16} textAnchor="middle" fontSize={10} fontWeight={900} fill="#000000">{usd(e.monto)}</text>
                      <text x={cx} y={y - 5} textAnchor="middle" fontSize={10} fontWeight={900} fill="#000000">{eur(e.monto)}</text>
                      <text x={cx} y={topPad + chartH + 17} textAnchor="middle" fontSize={11} fontWeight={800} fill="#000000">{e.etapa}</text>
                      <text x={cx} y={topPad + chartH + 31} textAnchor="middle" fontSize={10} fontWeight={700} fill="#000000">{e.count} op.</text>
                    </g>
                  )
                })}
              </svg>
            </div>
          )}
        </div>

        {/* Cotizaciones resumen */}
        <div className="dash-card" onClick={() => router.push('/cotizaciones')} title="Ir a Cotizaciones" style={{ ...cardStyle, cursor: 'pointer' }}>
          <h2 style={{ color: '#000000', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Cotizaciones</h2>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <div>
              <p style={{ color: '#000000', fontSize: 12 }}>Pendientes</p>
              <p style={{ color: '#000000', fontSize: 28, fontWeight: 800 }}>{cotPendientes.length}</p>
            </div>
            <div>
              <p style={{ color: '#000000', fontSize: 12 }}>Total</p>
              <p style={{ color: '#000000', fontSize: 28, fontWeight: 800 }}>{cotizaciones.length}</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['Borrador', 'Enviada', 'Aprobada', 'Rechazada', 'Vencida'].map(s => {
              const count = cotizaciones.filter(c => c.situacion === s).length
              const colors: Record<string, string> = { Borrador: '#1e3a8a', Enviada: '#1e3a8a', Aprobada: '#1e3a8a', Rechazada: '#1e3a8a', Vencida: '#1e3a8a' }
              return (
                <div key={s} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#000000', fontSize: 12 }}>{s}</span>
                  <span style={{ color: colors[s] || '#fff', fontSize: 13, fontWeight: 600 }}>{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* PQRS por tipo */}
        <div className="dash-card" onClick={() => router.push('/pqrs')} title="Ir a PQRS" style={{ ...cardStyle, cursor: 'pointer' }}>
          <h2 style={{ color: '#000000', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>PQRS por Tipo</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {pqrsPorTipo.map(t => (
              <div key={t.tipo} style={{ background: '#f1f5f9', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                <span style={{ fontSize: 24 }}>{tipoIcons[t.tipo]}</span>
                <p style={{ color: '#000000', fontSize: 18, fontWeight: 800 }}>{t.count}</p>
                <p style={{ color: '#000000', fontSize: 11 }}>{t.tipo}</p>
                {t.abiertas > 0 && <p style={{ color: '#000000', fontSize: 10 }}>{t.abiertas} abiertas</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="dash-card" style={cardStyle}>
          <h2 style={{ color: '#000000', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Resumen General</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
              <span style={{ color: '#000000', fontSize: 13 }}>Empresas Activas</span>
              <span style={{ color: '#000000', fontWeight: 600 }}>{clientes.filter(c => c.situacion === 'Activo').length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
              <span style={{ color: '#000000', fontSize: 13 }}>Contactos Principales</span>
              <span style={{ color: '#000000', fontWeight: 600 }}>{contactos.filter(c => c.es_principal).length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
              <span style={{ color: '#000000', fontSize: 13 }}>Productos Activos</span>
              <span style={{ color: '#000000', fontWeight: 600 }}>{productos.filter(p => p.situacion === 'Activo').length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
              <span style={{ color: '#000000', fontSize: 13 }}>Oportunidades Ganadas</span>
              <span style={{ color: '#000000', fontWeight: 600 }}>{oportunidades.filter(o => o.situacion === 'Ganada').length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ color: '#000000', fontSize: 13 }}>PQRS Urgentes</span>
              <span style={{ color: '#000000', fontWeight: 600 }}>{pqrs.filter(p => p.prioridad === 'Urgente' && p.situacion !== 'Cerrada').length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico: Proyectos por Situación (barras horizontales) */}
      <div className="dash-card" onClick={() => router.push('/proyectos')} title="Ir a Proyectos" style={{ ...cardStyle, marginBottom: 24, cursor: 'pointer' }}>
        <h2 style={{ color: '#000000', fontSize: 16, fontWeight: 600, marginBottom: 12 }}>🏗️ Proyectos por Situación</h2>
        {/* Totales + leyenda */}
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <p style={{ color: '#000000', fontSize: 13 }}>Total Aprobado</p>
            <p style={{ color: '#000000', fontSize: 19, fontWeight: 900 }}>{usd(totalProyAprobado)}</p>
            <p style={{ color: '#000000', fontSize: 19, fontWeight: 900 }}>{eur(totalProyAprobado)}</p>
          </div>
          <div>
            <p style={{ color: '#15803d', fontSize: 13 }}>Total Cobrado</p>
            <p style={{ color: '#000000', fontSize: 19, fontWeight: 900 }}>{usd(totalProyCobrado)}</p>
            <p style={{ color: '#000000', fontSize: 19, fontWeight: 900 }}>{eur(totalProyCobrado)}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 18, fontWeight: 800, color: '#000000' }}>
              <svg width="14" height="14"><circle cx="7" cy="7" r="7" fill="#1e3a8a" /></svg>
              Aprobado
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 18, fontWeight: 800, color: '#15803d' }}>
              <svg width="14" height="14"><circle cx="7" cy="7" r="7" fill="#15803d" /></svg>
              Cobrado
            </div>
          </div>
        </div>
        {proyPorSituacion.length === 0 ? (
          <p style={{ color: '#000000', fontSize: 13 }}>No hay proyectos registrados</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <svg width={880} height={proyPorSituacion.length * 72 + 12} style={{ display: 'block' }}>
              {proyPorSituacion.map((p, i) => {
                const rowY = i * 72 + 10
                const x0 = 175, maxW = 300
                const wA = Math.max(2, Math.round((p.aprobado / maxProyMonto) * maxW))
                const wC = Math.max(2, Math.round((p.cobrado / maxProyMonto) * maxW))
                return (
                  <g key={p.situacion}>
                    <text x={0} y={rowY + 30} fontSize={15} fontWeight={900} fill="#000000">{p.situacion}</text>
                    <text x={0} y={rowY + 48} fontSize={12} fontWeight={700} fill="#000000">{p.count} proy.</text>
                    <rect x={x0} y={rowY + 6} width={wA} height={22} rx={4} fill="#1e3a8a" />
                    <text x={x0 + wA + 8} y={rowY + 22} fontSize={12} fontWeight={900} fill="#000000">{usd(p.aprobado)} · {eur(p.aprobado)}</text>
                    <rect x={x0} y={rowY + 34} width={wC} height={22} rx={4} fill="#15803d" />
                    <text x={x0 + wC + 8} y={rowY + 50} fontSize={12} fontWeight={900} fill="#000000">{usd(p.cobrado)} · {eur(p.cobrado)}</text>
                  </g>
                )
              })}
            </svg>
          </div>
        )}
      </div>

      {/* Gráfico: Clientes por Ciudad (barras horizontales) */}
      <div className="dash-card" onClick={() => router.push('/clientes')} title="Ir a Empresas" style={{ ...cardStyle, marginBottom: 24, cursor: 'pointer' }}>
        <h2 style={{ color: '#000000', fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Clientes por Ciudad</h2>
        {clientesPorCiudad.length === 0 ? (
          <p style={{ color: '#000000', fontSize: 13 }}>No hay clientes registrados</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <svg width={600} height={clientesPorCiudad.length * 32 + 10} style={{ display: 'block', maxWidth: '100%' }}>
              {clientesPorCiudad.map((c, i) => {
                const COLORES = ['#1e3a8a', '#15803d', '#38bdf8', '#4ade80'] // azul oscuro, verde oscuro, azul celeste, verde claro
                const rowY = i * 32 + 6
                const x0 = 150, maxW = 370
                const w = Math.max(4, Math.round((c.count / maxCiudad) * maxW))
                return (
                  <g key={c.ciudad}>
                    <text x={0} y={rowY + 17} fontSize={13} fontWeight={700} fill="#000000">{c.ciudad}</text>
                    <rect x={x0} y={rowY + 4} width={w} height={20} rx={4} fill={COLORES[i % COLORES.length]} />
                    <text x={x0 + w + 8} y={rowY + 19} fontSize={13} fontWeight={800} fill="#000000">{c.count}</text>
                  </g>
                )
              })}
            </svg>
          </div>
        )}
      </div>

      {/* Mapa de Colombia: clientes por ubicación */}
      <div className="dash-card" style={{ ...cardStyle, marginBottom: 24 }}>
        <h2 style={{ color: '#000000', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>🗺️ Clientes en el Mapa de Colombia</h2>
        {mapaCiudades.length === 0 ? (
          <p style={{ color: '#000000', fontSize: 13 }}>No hay clientes en ciudades con ubicación en el mapa.</p>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
            <svg width={MAPA_W} height={MAPA_H} viewBox={`0 0 ${MAPA_W} ${MAPA_H}`} style={{ maxWidth: '100%' }}>
              {/* Departamentos (relleno suave + borde gris) */}
              {DEPARTAMENTOS.map(d => (
                <polygon key={d.nombre}
                  points={d.puntos.map(([la, lo]) => proj(la, lo).join(',')).join(' ')}
                  fill="#eef2ff" stroke="#94a3b8" strokeWidth={0.6} strokeLinejoin="round">
                  <title>{d.nombre}</title>
                </polygon>
              ))}
              {/* Contorno del país (encima, para definir el borde) */}
              <polygon
                points={COLOMBIA_BORDE.map(([la, lo]) => proj(la, lo).join(',')).join(' ')}
                fill="none" stroke="#1e3a8a" strokeWidth={1.6} strokeLinejoin="round"
              />
              {mapaPuntos.map(c => (
                <g key={c.ciudad}>
                  <title>{`${c.ciudad}: ${c.count} cliente(s)`}</title>
                  <circle cx={c.x} cy={c.y} r={4} fill="#dc2626" stroke="#ffffff" strokeWidth={1} />
                  <text x={c.x} y={c.y - 6} textAnchor="middle" fontSize={12} fontWeight={900} fill="#000000">{c.count}</text>
                  <text x={c.x} y={c.y + 14} textAnchor="middle" fontSize={9} fontWeight={700} fill="#000000">{c.ciudad}</text>
                </g>
              ))}
            </svg>
          </div>
        )}
        <p style={{ color: '#64748b', fontSize: 11, marginTop: 8, textAlign: 'center' }}>El tamaño del punto indica cuántos clientes hay en cada ciudad.</p>
      </div>
    </div>
  )
}
