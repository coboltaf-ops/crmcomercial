'use client'
import { useEffect, useState, useCallback } from 'react'
import { useCurrentUserStore } from '@/features/usuarios-gestion/store/current-user-store'

interface Registro {
  id: string
  usuario: string
  usuario_nombre: string
  rol: string
  modulo: string
  accion: string
  registro_codigo?: string
  registro_nombre?: string
  detalle?: string
  fecha: string
}

const MODULOS = ['clientes', 'contactos', 'oportunidades', 'cotizaciones', 'tareas', 'prospectos', 'pqrs', 'productos', 'usuarios']
const ACCIONES = ['CREAR', 'MODIFICAR', 'ELIMINAR']

const accColor = (a: string) => a === 'CREAR' ? '#16a34a' : a === 'ELIMINAR' ? '#dc2626' : '#2563eb'
// Fondo suave (pastel) por acción, para que la letra del color fuerte se lea bien
const accBg = (a: string) => a === 'CREAR' ? '#dcfce7' : a === 'ELIMINAR' ? '#fee2e2' : '#dbeafe'

export default function AuditoriaPage() {
  const currentUser = useCurrentUserStore(s => s.user)
  const [registros, setRegistros] = useState<Registro[]>([])
  const [cargando, setCargando] = useState(false)
  const [fUsuario, setFUsuario] = useState('')
  const [fModulo, setFModulo] = useState('')
  const [fAccion, setFAccion] = useState('')
  const [fDesde, setFDesde] = useState('')
  const [fHasta, setFHasta] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const p = new URLSearchParams()
      if (fUsuario) p.set('usuario', fUsuario)
      if (fModulo) p.set('modulo', fModulo)
      if (fAccion) p.set('accion', fAccion)
      if (fDesde) p.set('desde', fDesde)
      if (fHasta) p.set('hasta', fHasta)
      const res = await fetch(`/api/auditoria?${p.toString()}`, { cache: 'no-store' })
      const data = await res.json()
      setRegistros(Array.isArray(data) ? data : [])
    } catch { setRegistros([]) }
    setCargando(false)
  }, [fUsuario, fModulo, fAccion, fDesde, fHasta])

  useEffect(() => { cargar() }, [cargar])

  const [borrando, setBorrando] = useState(false)
  const borrar = async () => {
    const porRango = !!(fDesde && fHasta)
    const msg = porRango
      ? `⚠️ ¿Borrar los registros de auditoría del ${fDesde} al ${fHasta}? No se puede deshacer.`
      : '⚠️ ¿Borrar TODA la auditoría? No se puede deshacer.'
    if (!confirm(msg)) return
    setBorrando(true)
    try {
      const res = await fetch('/api/auditoria', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(porRango
          ? { modo: 'rango', fechaInicio: fDesde, fechaFinal: fHasta }
          : { modo: 'todo' }),
      })
      const data = await res.json()
      if (res.ok) {
        alert(`✅ ${data.mensaje || 'Auditoría limpiada'}`)
        await cargar()
      } else {
        alert(`❌ ${data.error || 'No se pudo borrar'}`)
      }
    } catch (err) {
      alert(`❌ Error de conexión: ${err}`)
    }
    setBorrando(false)
  }

  if (currentUser?.rol?.toLowerCase() !== 'admin') {
    return <div style={{ color: '#013978', padding: 40, textAlign: 'center' }}>No tienes acceso a esta sección (solo Admin).</div>
  }

  const fmtFecha = (iso: string) => {
    try { return new Date(iso).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'short', timeStyle: 'short' }) } catch { return iso }
  }

  const inputStyle: React.CSSProperties = { padding: '8px 10px', borderRadius: 8, background: '#ffffff', border: '1px solid #1e3a8a', color: '#000', fontSize: 13 }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>🔍 Auditoría del Sistema</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Historial de acciones: quién hizo qué, cuándo y en qué módulo</p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16, background: '#ffffff', padding: 14, borderRadius: 12, border: '1px solid #1e3a8a' }}>
        <input placeholder="Usuario..." value={fUsuario} onChange={e => setFUsuario(e.target.value)} style={inputStyle} />
        <select value={fModulo} onChange={e => setFModulo(e.target.value)} style={inputStyle}>
          <option value="">Todos los módulos</option>
          {MODULOS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={fAccion} onChange={e => setFAccion(e.target.value)} style={inputStyle}>
          <option value="">Todas las acciones</option>
          {ACCIONES.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <input type="date" value={fDesde} onChange={e => setFDesde(e.target.value)} style={inputStyle} title="Desde" />
        <input type="date" value={fHasta} onChange={e => setFHasta(e.target.value)} style={inputStyle} title="Hasta" />
        <button onClick={() => { setFUsuario(''); setFModulo(''); setFAccion(''); setFDesde(''); setFHasta('') }} style={{ ...inputStyle, background: '#64748b', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Limpiar filtros</button>
        <button onClick={borrar} disabled={borrando} style={{ ...inputStyle, background: borrando ? '#9ca3af' : '#dc2626', color: '#fff', border: 'none', cursor: borrando ? 'default' : 'pointer', fontWeight: 700 }}>
          {borrando ? 'Borrando…' : (fDesde && fHasta ? '🗑️ Borrar rango' : '🗑️ Borrar auditoría')}
        </button>
      </div>

      {/* Tabla */}
      <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Fecha/Hora', 'Usuario', 'Acción', 'Módulo', 'Registro', 'Qué cambió'].map(h => (
                <th key={h} style={{ padding: '10px 12px', background: '#1e3a8a', color: '#fff', fontSize: 12, textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cargando && <tr><td colSpan={6} style={{ padding: 30, textAlign: 'center', color: '#888' }}>Cargando...</td></tr>}
            {!cargando && registros.length === 0 && <tr><td colSpan={6} style={{ padding: 30, textAlign: 'center', color: '#888' }}>Sin registros de auditoría.</td></tr>}
            {registros.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#000', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtFecha(r.fecha)}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#000', fontSize: 12, fontWeight: 600 }}>{r.usuario_nombre || r.usuario}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'inline-block', background: accBg(r.accion), color: accColor(r.accion), border: `1px solid ${accColor(r.accion)}`, padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 800 }}>{r.accion}</div>
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#000', fontSize: 12, textTransform: 'capitalize' }}>{r.modulo}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#000', fontSize: 12 }}>{r.registro_codigo} {r.registro_nombre}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: 11, maxWidth: 320 }}>{r.detalle || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 10 }}>Mostrando las últimas {registros.length} acciones (máx. 1000).</p>
    </div>
  )
}
