'use client'
import { logAudit, computarDiff } from '@/shared/lib/audit'
import { useState, useEffect } from 'react'
import ModuleHeader from '@/shared/components/module-header'
import { useProveedoresStore, Proveedor } from '@/features/proveedores/store/proveedores-store'
import { useReferenceStore } from '@/features/referencias/store/reference-store'
import { useCurrentUserStore } from '@/features/usuarios-gestion/store/current-user-store'
import { usePermisos } from '@/shared/hooks/use-permisos'
import { fDate, todayColombia } from '@/shared/lib/format-date'
import { nextConsecutivo } from '@/shared/lib/consecutivo'
import SeguimientoPanel from '@/shared/components/seguimiento-panel'
import { Seguimiento } from '@/shared/types/seguimiento'
import { PAISES_ACTIVOS, esGlobal, etiquetaPais } from '@/shared/lib/paises'

const today = todayColombia()

const TIPO_ID_DEFAULT = ['NIT', 'Cédula', 'Pasaporte', 'RUC']
const CALIFICACION_DEFAULT = ['Excelente', 'Bueno', 'Regular', 'Malo']
const SITUACION_DEFAULT = ['Activo', 'Inactivo']
const PAIS_DEFAULT = ['Colombia']
const CIUDAD_DEFAULT = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla']

const emptyProveedor = (codigo: string): Proveedor => ({
  id: '', codigo, fecha_registro: today,
  nombre: '', tipo_id: 'NIT', nro_documento: '', correo: '',
  tel_oficina: '', celular_oficina: '', persona_contacto: '',
  calificacion: '', actividad: '', proveedor_desde: '', representante_legal: '',
  direccion: '', ciudad: '', pais: 'Colombia', codigo_postal: '',
  observaciones: '', situacion: 'Activo', seguimientos: [],
})

export default function ProveedoresPage() {
  const currentUser = useCurrentUserStore(s => s.user)
  const permisos = usePermisos('proveedores')
  const { proveedores, addProveedor, updateProveedor, deleteProveedor } = useProveedoresStore()
  const loadProveedores = useProveedoresStore(s => s.loadProveedores)
  useEffect(() => { loadProveedores() }, [loadProveedores])
  const refData = useReferenceStore(s => s.data)

  const [selected, setSelected] = useState<Proveedor | null>(null)
  const [isForm, setIsForm] = useState(false)
  const [verLectura, setVerLectura] = useState(false)
  const [search, setSearch] = useState('')

  const refOptions = (table: string, fallback: string[]) => {
    const opts = (refData[table as keyof typeof refData] || []).filter(r => r.situacion).map(r => r.descripcion)
    return opts.length ? opts : fallback
  }

  const auditParams = () => ({
    usuario: currentUser?.usuario || 'desconocido',
    usuario_nombre: `${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`.trim(),
    rol: currentUser?.rol || '',
    modulo: 'proveedores',
  })

  const filtered = proveedores.filter(p =>
    !search || p.codigo.toLowerCase().includes(search.toLowerCase()) ||
    (p.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.nro_documento || '').includes(search) ||
    (p.persona_contacto || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    const toSave = { ...selected }
    if (toSave.id) {
      const _anterior = proveedores.find(x => x.id === toSave.id)
      updateProveedor(toSave.id, toSave)
      logAudit({ ...auditParams(), accion: 'MODIFICAR', registro_codigo: toSave.codigo, registro_nombre: toSave.nombre, detalle: computarDiff(_anterior as unknown as Record<string, unknown>, toSave as unknown as Record<string, unknown>) })
    } else {
      addProveedor({ ...toSave, id: crypto.randomUUID(), fecha_registro: today, creado_por: `${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`.trim() || (currentUser?.usuario || 'desconocido'), creado_por_usuario: currentUser?.usuario || '', creado_en: today })
      logAudit({ ...auditParams(), accion: 'CREAR', registro_codigo: toSave.codigo, registro_nombre: toSave.nombre })
    }
    setIsForm(false); setSelected(null); setVerLectura(false)
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, background: '#ffffff', border: '1px solid #1e3a8a', color: '#1e3a8a', fontWeight: 600, fontSize: 13, outline: 'none' }
  const inputRO: React.CSSProperties = { ...inputStyle, opacity: 0.5 }
  const btnStyle: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }
  const labelStyle: React.CSSProperties = { color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }
  const seccion: React.CSSProperties = { color: '#013978', fontSize: 14, fontWeight: 800, margin: '22px 0 10px' }
  const situColor = (s: string): React.CSSProperties => {
    const map: Record<string, string> = { 'Activo': '#16a34a', 'Inactivo': '#dc2626' }
    return { background: 'transparent', color: map[s] || '#6b7280', border: `1px solid ${map[s] || '#6b7280'}`, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, display: 'inline-block' }
  }

  // ── FORMULARIO (crear / editar / ver) ──
  if (isForm && selected) {
    return (
      <div>
        <button onClick={() => { setIsForm(false); setSelected(null); setVerLectura(false) }} style={{ ...btnStyle, background: '#000000', color: '#ffffff', border: '1px solid #333333', marginBottom: 16 }}>← Volver</button>
        <form onSubmit={handleSave} style={{ background: '#ffffff', borderRadius: 16, padding: 24, border: '1px solid #1e3a8a' }}>
          <h2 style={{ color: '#013978', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{verLectura ? 'Ver Proveedor' : selected.id ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
          <fieldset disabled={verLectura} style={{ border: 'none', padding: 0, margin: 0, minInlineSize: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Nro Proveedor *</label>
                {verLectura ? <div className="ver-box">{selected.codigo || '—'}</div> : <input value={selected.codigo} readOnly style={inputRO} />}
              </div>
              <div>
                <label style={labelStyle}>Fecha Registro</label>
                {verLectura ? <div className="ver-box">{fDate(selected.fecha_registro || today) || '—'}</div> : <input value={fDate(selected.fecha_registro || today)} readOnly style={inputRO} />}
              </div>
              <div>
                <label style={labelStyle}>Calificación</label>
                {verLectura ? <div className="ver-box">{selected.calificacion || '—'}</div> : <select value={selected.calificacion} onChange={e => setSelected({ ...selected, calificacion: e.target.value })} style={inputStyle}>
                  <option value="">Seleccionar...</option>
                  {refOptions('calificacion_proveedor', CALIFICACION_DEFAULT).map(o => <option key={o} value={o}>{o}</option>)}
                </select>}
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Nombre *</label>
                {verLectura ? <div className="ver-box">{selected.nombre || '—'}</div> : <input value={selected.nombre} onChange={e => setSelected({ ...selected, nombre: e.target.value.toUpperCase() })} required placeholder="Nombre del proveedor..." style={inputStyle} />}
              </div>
              <div>
                <label style={labelStyle}>Tipo ID</label>
                {verLectura ? <div className="ver-box">{selected.tipo_id || '—'}</div> : <select value={selected.tipo_id} onChange={e => setSelected({ ...selected, tipo_id: e.target.value })} style={inputStyle}>
                  {refOptions('tipo_identificacion', TIPO_ID_DEFAULT).map(o => <option key={o} value={o}>{o}</option>)}
                </select>}
              </div>
              <div>
                <label style={labelStyle}>Nro Documento</label>
                {verLectura ? <div className="ver-box">{selected.nro_documento || '—'}</div> : <input value={selected.nro_documento} onChange={e => setSelected({ ...selected, nro_documento: e.target.value })} placeholder="Número de documento..." style={inputStyle} />}
              </div>
              <div>
                <label style={labelStyle}>Correo</label>
                {verLectura ? <div className="ver-box">{selected.correo || '—'}</div> : <input type="email" value={selected.correo} onChange={e => setSelected({ ...selected, correo: e.target.value })} placeholder="correo@ejemplo.com" style={inputStyle} />}
              </div>
              <div>
                <label style={labelStyle}>Tel Oficina</label>
                {verLectura ? <div className="ver-box">{selected.tel_oficina || '—'}</div> : <input value={selected.tel_oficina} onChange={e => setSelected({ ...selected, tel_oficina: e.target.value })} placeholder="Teléfono oficina..." style={inputStyle} />}
              </div>
              <div>
                <label style={labelStyle}>Celular Oficina</label>
                {verLectura ? <div className="ver-box">{selected.celular_oficina || '—'}</div> : <input value={selected.celular_oficina} onChange={e => setSelected({ ...selected, celular_oficina: e.target.value })} placeholder="Celular oficina..." style={inputStyle} />}
              </div>
              <div>
                <label style={labelStyle}>Persona Contacto</label>
                {verLectura ? <div className="ver-box">{selected.persona_contacto || '—'}</div> : <input value={selected.persona_contacto} onChange={e => setSelected({ ...selected, persona_contacto: e.target.value.toUpperCase() })} placeholder="Persona de contacto..." style={inputStyle} />}
              </div>
              <div>
                <label style={labelStyle}>Proveedor Desde</label>
                {verLectura ? <div className="ver-box">{selected.proveedor_desde || '—'}</div> : <input type="date" value={selected.proveedor_desde} onChange={e => setSelected({ ...selected, proveedor_desde: e.target.value })} style={inputStyle} />}
              </div>
              <div>
                <label style={labelStyle}>Actividad</label>
                {verLectura ? <div className="ver-box">{selected.actividad || '—'}</div> : <select value={selected.actividad} onChange={e => setSelected({ ...selected, actividad: e.target.value })} style={inputStyle}>
                  <option value="">Seleccionar...</option>
                  {selected.actividad && !refOptions('actividad_proveedor', []).includes(selected.actividad) && <option value={selected.actividad}>{selected.actividad}</option>}
                  {refOptions('actividad_proveedor', []).map(o => <option key={o} value={o}>{o}</option>)}
                </select>}
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Representante Legal</label>
                {verLectura ? <div className="ver-box">{selected.representante_legal || '—'}</div> : <input value={selected.representante_legal} onChange={e => setSelected({ ...selected, representante_legal: e.target.value.toUpperCase() })} placeholder="Representante legal..." style={inputStyle} />}
              </div>
            </div>

            {/* ── Ubicación ── */}
            <p style={seccion}>📍 Ubicación</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Dirección</label>
                {verLectura ? <div className="ver-box">{selected.direccion || '—'}</div> : <input value={selected.direccion} onChange={e => setSelected({ ...selected, direccion: e.target.value })} placeholder="Dirección..." style={inputStyle} />}
              </div>
              <div>
                <label style={labelStyle}>Ciudad</label>
                {verLectura ? <div className="ver-box">{selected.ciudad || '—'}</div> : <select value={selected.ciudad} onChange={e => setSelected({ ...selected, ciudad: e.target.value })} style={inputStyle}>
                  <option value="">Seleccionar...</option>
                  {selected.ciudad && !refOptions('ciudad', CIUDAD_DEFAULT).includes(selected.ciudad) && <option value={selected.ciudad}>{selected.ciudad}</option>}
                  {refOptions('ciudad', CIUDAD_DEFAULT).map(o => <option key={o} value={o}>{o}</option>)}
                </select>}
              </div>
              <div>
                <label style={labelStyle}>País</label>
                {verLectura ? <div className="ver-box">{selected.pais || '—'}</div> : <select value={selected.pais} onChange={e => setSelected({ ...selected, pais: e.target.value })} style={inputStyle}>
                  <option value="">Seleccionar...</option>
                  {selected.pais && !refOptions('pais', PAIS_DEFAULT).includes(selected.pais) && <option value={selected.pais}>{selected.pais}</option>}
                  {refOptions('pais', PAIS_DEFAULT).map(o => <option key={o} value={o}>{o}</option>)}
                </select>}
              </div>
              <div>
                <label style={labelStyle}>Código Postal</label>
                {verLectura ? <div className="ver-box">{selected.codigo_postal || '—'}</div> : <input value={selected.codigo_postal} onChange={e => setSelected({ ...selected, codigo_postal: e.target.value })} placeholder="Código postal..." style={inputStyle} />}
              </div>
            </div>

            {/* ── Cierre ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Observaciones</label>
                {verLectura ? <div className="ver-box">{selected.observaciones || '—'}</div> : <textarea value={selected.observaciones} onChange={e => setSelected({ ...selected, observaciones: e.target.value })} rows={3} placeholder="Observaciones..." style={{ ...inputStyle, resize: 'vertical' }} />}
              </div>
              <div>
                <label style={labelStyle}>Situación</label>
                {verLectura ? <div className="ver-box">{selected.situacion || '—'}</div> : <select value={selected.situacion} onChange={e => setSelected({ ...selected, situacion: e.target.value })} style={inputStyle}>
                  {refOptions('situacion_proveedor', SITUACION_DEFAULT).map(o => <option key={o} value={o}>{o}</option>)}
                </select>}
              </div>
            </div>
          </fieldset>
          {verLectura && (
            <p style={{ color: '#000000', fontSize: 13, fontWeight: 700, marginTop: 14 }}>
              👤 Creado por: {selected.creado_por || '—'}{selected.creado_por_usuario ? ` (${selected.creado_por_usuario})` : ''}{selected.creado_en ? ` · ${selected.creado_en}` : ''}
            </p>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            {!verLectura && <button type="submit" style={{ ...btnStyle, background: '#1e3a8a', color: '#ffffff' }}>Guardar</button>}
            <button type="button" onClick={() => { setIsForm(false); setSelected(null); setVerLectura(false) }} style={{ ...btnStyle, background: '#64748b', color: '#ffffff' }}>{verLectura ? 'Volver' : 'Cancelar'}</button>
          </div>
        </form>
        {selected.id && (
          <SeguimientoPanel
            seguimientos={selected.seguimientos || []}
            usuario={`${currentUser?.nombre} ${currentUser?.apellido}`}
            situacionActual={selected.situacion}
            situacionOpciones={refOptions('situacion_proveedor', SITUACION_DEFAULT)}
            readOnly={verLectura}
            onAdd={(seg: Seguimiento) => {
              const updated = { ...selected, situacion: seg.situacion, seguimientos: [...(selected.seguimientos || []), seg] }
              updateProveedor(selected.id, updated); setSelected(updated)
            }}
          />
        )}
      </div>
    )
  }

  // ── VISTA PRINCIPAL ──
  return (
    <div>
      <ModuleHeader title="Proveedores" subtitle="Gestión de proveedores" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por código, nombre, documento o contacto..." style={{ ...inputStyle, maxWidth: 380 }} />
        {permisos.crear && (
          <button onClick={() => { setSelected(emptyProveedor(nextConsecutivo('PRV-', proveedores.map(p => p.codigo)).codigo)); setVerLectura(false); setIsForm(true) }} style={{ ...btnStyle, background: '#1e3a8a', color: '#ffffff' }}>+ Nuevo Proveedor</button>
        )}
      </div>

      <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Nro', 'Nombre', 'Documento', 'Contacto', 'Celular', 'Calificación', 'Situación', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '12px 14px', background: '#1e3a8a', color: '#fff', fontSize: 12, textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={p.id} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#000', fontSize: 13, fontFamily: 'monospace' }}>{p.codigo}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#000', fontSize: 13, fontWeight: 600 }}>{p.nombre || '—'}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#000', fontSize: 13 }}>{p.nro_documento || '—'}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#000', fontSize: 13 }}>{p.persona_contacto || '—'}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#000', fontSize: 13 }}>{p.celular_oficina || '—'}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#000', fontSize: 13 }}>{p.calificacion || '—'}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}><span style={situColor(p.situacion)}>{p.situacion}</span></td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <button onClick={() => { setSelected(p); setVerLectura(true); setIsForm(true) }} style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#ea580c', color: '#ffffff', border: '1px solid #f97316' }}>Ver</button>
                    {permisos.editar && <button onClick={() => { setSelected(p); setVerLectura(false); setIsForm(true) }} style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#2563eb', color: '#ffffff', border: '1px solid #3b82f6' }}>Editar</button>}
                    {permisos.eliminar && <button onClick={() => { if (confirm(`¿Eliminar el proveedor ${p.codigo}?`)) { deleteProveedor(p.id); logAudit({ ...auditParams(), accion: 'ELIMINAR', registro_codigo: p.codigo, registro_nombre: p.nombre }) } }} style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#dc2626', color: '#ffffff', border: '1px solid #ef4444' }}>Eliminar</button>}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#013978', fontSize: 14 }}>No hay proveedores registrados</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
