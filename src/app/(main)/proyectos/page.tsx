'use client'
import { logAudit, computarDiff } from '@/shared/lib/audit'
import { useState, useEffect } from 'react'
import ModuleHeader from '@/shared/components/module-header'
import { useProyectosStore, Proyecto } from '@/features/proyectos/store/proyectos-store'
import { useClientesStore } from '@/features/clientes/store/clientes-store'
import { useReferenceStore } from '@/features/referencias/store/reference-store'
import { useCurrentUserStore } from '@/features/usuarios-gestion/store/current-user-store'
import { usePermisos } from '@/shared/hooks/use-permisos'
import { fDate, todayColombia } from '@/shared/lib/format-date'
import { fmtMoney } from '@/shared/lib/format-number'
import { nextConsecutivo } from '@/shared/lib/consecutivo'
import SeguimientoPanel from '@/shared/components/seguimiento-panel'
import DocumentosPanel from '@/shared/components/documentos-panel'
import { Seguimiento } from '@/shared/types/seguimiento'

const today = todayColombia()

const SITUACION_DEFAULT = ['En Planeación', 'En Ejecución', 'Suspendido', 'Finalizado', 'Cancelado']
const MONEDA_DEFAULT = ['Pesos Colombianos', 'Dólares', 'Euros']

const emptyProyecto = (codigo: string, responsable: string): Proyecto => ({
  id: '', codigo, fecha_registro: today, codigo_proyecto: '',
  cliente_id: '', cliente_nombre: '', descripcion: '',
  fecha_estimada_inicio: '', fecha_real_inicio: '',
  es_consorcio: false, nombre_consorcio: '',
  responsable, monto_aprobado: 0, monto_cobrado: 0,
  tipo_moneda: 'Pesos Colombianos', situacion: 'En Planeación', seguimientos: [],
})

export default function ProyectosPage() {
  const currentUser = useCurrentUserStore(s => s.user)
  const permisos = usePermisos('proyectos')
  const { proyectos, addProyecto, updateProyecto, deleteProyecto } = useProyectosStore()
  const loadProyectos = useProyectosStore(s => s.loadProyectos)
  useEffect(() => { loadProyectos() }, [loadProyectos])
  const clientes = useClientesStore(s => s.clientes).filter(c => (c.situacion || '').toLowerCase() === 'activo')
  const allClientes = useClientesStore(s => s.clientes)
  const refData = useReferenceStore(s => s.data)

  const [selected, setSelected] = useState<Proyecto | null>(null)
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
    modulo: 'proyectos',
  })

  const filtered = proyectos.filter(p =>
    !search || p.codigo.toLowerCase().includes(search.toLowerCase()) ||
    p.codigo_proyecto.toLowerCase().includes(search.toLowerCase()) ||
    p.cliente_nombre.toLowerCase().includes(search.toLowerCase()) ||
    p.responsable.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    const cli = allClientes.find(c => c.id === selected.cliente_id)
    const toSave = { ...selected, cliente_nombre: cli?.razon_social || selected.cliente_nombre }
    if (toSave.id) {
      const _anterior = proyectos.find(x => x.id === toSave.id)
      updateProyecto(toSave.id, toSave)
      logAudit({ ...auditParams(), accion: 'MODIFICAR', registro_codigo: toSave.codigo, registro_nombre: toSave.codigo_proyecto, detalle: computarDiff(_anterior as unknown as Record<string, unknown>, toSave as unknown as Record<string, unknown>) })
    } else {
      addProyecto({ ...toSave, id: crypto.randomUUID(), fecha_registro: today, creado_por: `${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`.trim() || (currentUser?.usuario || 'desconocido'), creado_por_usuario: currentUser?.usuario || '', creado_en: today })
      logAudit({ ...auditParams(), accion: 'CREAR', registro_codigo: toSave.codigo, registro_nombre: toSave.codigo_proyecto })
    }
    setIsForm(false); setSelected(null); setVerLectura(false)
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, background: '#ffffff', border: '1px solid #1e3a8a', color: '#1e3a8a', fontWeight: 600, fontSize: 13, outline: 'none' }
  const inputRO: React.CSSProperties = { ...inputStyle, opacity: 0.5 }
  const btnStyle: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }
  const labelStyle: React.CSSProperties = { color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }
  const situColor = (s: string): React.CSSProperties => {
    const map: Record<string, string> = { 'En Planeación': '#2563eb', 'En Ejecución': '#16a34a', 'Suspendido': '#f59e0b', 'Finalizado': '#059669', 'Cancelado': '#dc2626' }
    return { background: 'transparent', color: map[s] || '#6b7280', border: `1px solid ${map[s] || '#6b7280'}`, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, display: 'inline-block' }
  }

  // ── FORMULARIO (crear / editar / ver) ──
  if (isForm && selected) {
    return (
      <div>
        <button onClick={() => { setIsForm(false); setSelected(null); setVerLectura(false) }} style={{ ...btnStyle, background: '#000000', color: '#ffffff', border: '1px solid #333333', marginBottom: 16 }}>← Volver</button>
        <form onSubmit={handleSave} style={{ background: '#ffffff', borderRadius: 16, padding: 24, border: '1px solid #1e3a8a' }}>
          <h2 style={{ color: '#013978', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{verLectura ? 'Ver Proyecto' : selected.id ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h2>
          <fieldset disabled={verLectura} style={{ border: 'none', padding: 0, margin: 0, minInlineSize: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Nro Proyecto *</label>
                <input value={selected.codigo} readOnly style={inputRO} />
              </div>
              <div>
                <label style={labelStyle}>Fecha Registro</label>
                <input value={fDate(selected.fecha_registro || today)} readOnly style={inputRO} />
              </div>
              <div>
                <label style={labelStyle}>Código Proyecto</label>
                <input value={selected.codigo_proyecto} onChange={e => setSelected({ ...selected, codigo_proyecto: e.target.value.toUpperCase() })} placeholder="Código del proyecto..." style={inputStyle} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Cliente *</label>
                <select value={selected.cliente_id} onChange={e => {
                  const cli = clientes.find(c => c.id === e.target.value)
                  setSelected({ ...selected, cliente_id: e.target.value, cliente_nombre: cli?.razon_social || '' })
                }} required style={inputStyle}>
                  <option value="">Seleccionar cliente...</option>
                  {selected.cliente_id && !clientes.some(c => c.id === selected.cliente_id) && (
                    <option value={selected.cliente_id}>{selected.cliente_nombre || '(cliente del registro)'}</option>
                  )}
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Responsable del Proyecto</label>
                <input value={selected.responsable} onChange={e => setSelected({ ...selected, responsable: e.target.value })} placeholder="Responsable..." style={inputStyle} />
              </div>
              <div style={{ gridColumn: 'span 3' }}>
                <label style={labelStyle}>Descripción Detallada del Proyecto</label>
                <textarea value={selected.descripcion} onChange={e => setSelected({ ...selected, descripcion: e.target.value })} rows={3} placeholder="Descripción del proyecto..." style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div>
                <label style={labelStyle}>Fecha Estimada Inicio</label>
                <input type="date" value={selected.fecha_estimada_inicio} onChange={e => setSelected({ ...selected, fecha_estimada_inicio: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Fecha Real Inicio</label>
                <input type="date" value={selected.fecha_real_inicio} onChange={e => setSelected({ ...selected, fecha_real_inicio: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>¿Es con Consorcio?</label>
                <select value={selected.es_consorcio ? 'Si' : 'No'} onChange={e => setSelected({ ...selected, es_consorcio: e.target.value === 'Si', nombre_consorcio: e.target.value === 'Si' ? selected.nombre_consorcio : '' })} style={inputStyle}>
                  <option value="No">No</option>
                  <option value="Si">Sí</option>
                </select>
              </div>
              {selected.es_consorcio && (
                <div style={{ gridColumn: 'span 3' }}>
                  <label style={labelStyle}>Nombre del Consorcio</label>
                  <input value={selected.nombre_consorcio} onChange={e => setSelected({ ...selected, nombre_consorcio: e.target.value.toUpperCase() })} placeholder="Nombre del consorcio..." style={inputStyle} />
                </div>
              )}
              <div>
                <label style={labelStyle}>Tipo de Moneda</label>
                <select value={selected.tipo_moneda} onChange={e => setSelected({ ...selected, tipo_moneda: e.target.value })} style={inputStyle}>
                  {refOptions('tipo_moneda', MONEDA_DEFAULT).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Monto Aprobado</label>
                <input type="number" step="0.01" min="0" value={selected.monto_aprobado || ''} onChange={e => setSelected({ ...selected, monto_aprobado: parseFloat(e.target.value) || 0 })} placeholder="0" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Monto Cobrado</label>
                <input type="number" step="0.01" min="0" value={selected.monto_cobrado || ''} onChange={e => setSelected({ ...selected, monto_cobrado: parseFloat(e.target.value) || 0 })} placeholder="0" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Situación</label>
                <select value={selected.situacion} onChange={e => setSelected({ ...selected, situacion: e.target.value })} style={inputStyle}>
                  {refOptions('situacion_proyecto', SITUACION_DEFAULT).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </fieldset>
          <div style={{ marginTop: 16, padding: '12px 16px', background: '#eef2ff', borderRadius: 12, border: '1px solid #1e3a8a' }}>
            <p style={{ color: '#000000', fontSize: 13, fontWeight: 800, marginBottom: 2 }}>👤 Creado por</p>
            <p style={{ color: '#000000', fontSize: 24, fontWeight: 900 }}>
              {selected.creado_por || '—'}{selected.creado_por_usuario ? ` (${selected.creado_por_usuario})` : ''}{selected.creado_en ? ` · ${selected.creado_en}` : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            {!verLectura && <button type="submit" style={{ ...btnStyle, background: '#1e3a8a', color: '#ffffff' }}>Guardar</button>}
            <button type="button" onClick={() => { setIsForm(false); setSelected(null); setVerLectura(false) }} style={{ ...btnStyle, background: '#64748b', color: '#ffffff' }}>{verLectura ? 'Volver' : 'Cancelar'}</button>
          </div>
        </form>
        {selected.id && (
          <>
            <SeguimientoPanel
              seguimientos={selected.seguimientos || []}
              usuario={`${currentUser?.nombre} ${currentUser?.apellido}`}
              situacionActual={selected.situacion}
              situacionOpciones={refOptions('situacion_proyecto', SITUACION_DEFAULT)}
              readOnly={verLectura}
              onAdd={(seg: Seguimiento) => {
                const updated = { ...selected, situacion: seg.situacion, seguimientos: [...(selected.seguimientos || []), seg] }
                updateProyecto(selected.id, updated); setSelected(updated)
              }}
            />
            <DocumentosPanel modulo="proyectos" registroId={selected.id} />
          </>
        )}
      </div>
    )
  }

  // ── VISTA PRINCIPAL ──
  return (
    <div>
      <ModuleHeader title="Proyectos" subtitle="Gestión de proyectos" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por código, cliente o responsable..." style={{ ...inputStyle, maxWidth: 360 }} />
        {permisos.editar && (
          <button onClick={() => { setSelected(emptyProyecto(nextConsecutivo('PRY-', proyectos.map(p => p.codigo)).codigo, `${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`.trim())); setVerLectura(false); setIsForm(true) }} style={{ ...btnStyle, background: '#1e3a8a', color: '#ffffff' }}>+ Nuevo Proyecto</button>
        )}
      </div>

      <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Nro', 'Código', 'Cliente', 'Responsable', 'Monto Aprobado', 'Situación', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '12px 14px', background: '#1e3a8a', color: '#fff', fontSize: 12, textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={p.id} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#000', fontSize: 13, fontFamily: 'monospace' }}>{p.codigo}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#000', fontSize: 13, fontWeight: 600 }}>{p.codigo_proyecto || '—'}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#000', fontSize: 13 }}>{p.cliente_nombre || '—'}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#000', fontSize: 13 }}>{p.responsable || '—'}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#000', fontSize: 13, textAlign: 'right' }}>{fmtMoney(p.monto_aprobado || 0)}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}><span style={situColor(p.situacion)}>{p.situacion}</span></td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <button onClick={() => { setSelected(p); setVerLectura(true); setIsForm(true) }} style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#ea580c', color: '#ffffff', border: '1px solid #f97316' }}>Ver</button>
                    {permisos.editar && <button onClick={() => { setSelected(p); setVerLectura(false); setIsForm(true) }} style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#2563eb', color: '#ffffff', border: '1px solid #3b82f6' }}>Editar</button>}
                    {permisos.eliminar && <button onClick={() => { if (confirm(`¿Eliminar el proyecto ${p.codigo}?`)) { deleteProyecto(p.id); logAudit({ ...auditParams(), accion: 'ELIMINAR', registro_codigo: p.codigo, registro_nombre: p.codigo_proyecto }) } }} style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#dc2626', color: '#ffffff', border: '1px solid #ef4444' }}>Eliminar</button>}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#013978', fontSize: 14 }}>No hay proyectos registrados</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
