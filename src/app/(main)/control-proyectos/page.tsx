'use client'
import { useIdioma } from '@/shared/i18n/use-t'
import { logAudit, computarDiff } from '@/shared/lib/audit'
import { useState, useEffect } from 'react'
import { useControlProyectosStore, ControlProyecto } from '@/features/control-proyectos/store/control-proyectos-store'
import { useSeguimientoOfertaStore } from '@/features/seguimiento-oferta/store/seguimiento-oferta-store'
import { useProyectosStore } from '@/features/proyectos/store/proyectos-store'
import { useClientesStore } from '@/features/clientes/store/clientes-store'
import { useReferenceStore } from '@/features/referencias/store/reference-store'
import { useCurrentUserStore } from '@/features/usuarios-gestion/store/current-user-store'
import { usePermisos } from '@/shared/hooks/use-permisos'
import { fDate, todayColombia } from '@/shared/lib/format-date'
import { fmtMoney } from '@/shared/lib/format-number'
import MoneyInput from '@/shared/components/money-input'
import { nextConsecutivo } from '@/shared/lib/consecutivo'
import SeguimientoPanel from '@/shared/components/seguimiento-panel'
import DocumentosPanel from '@/shared/components/documentos-panel'
import { Seguimiento } from '@/shared/types/seguimiento'
import { PAISES_ACTIVOS, esGlobal, etiquetaPais } from '@/shared/lib/paises'

const today = todayColombia()

const SITUACION_DEFAULT = ['En Planeación', 'En Ejecución', 'Suspendido', 'Finalizado', 'Cancelado']
const MONEDA_DEFAULT = ['Pesos Colombianos', 'Dólares', 'Euros']
const FRECUENCIA = ['Mensual', 'Semanal']
const CONTRATO_DEFAULT = ['Precio Fijo', 'Administración Delegada', 'Precios Unitarios', 'Llave en Mano', 'Otro']

const emptyControlProyecto = (codigo: string, responsable: string, pais: string): ControlProyecto => ({
  id: '', codigo, fecha_registro: today, nombre_proyecto: '', codigo_proyecto: '',
  cliente_id: '', cliente_nombre: '', descripcion: '', responsable,
  tipo_contrato: 'Precio Fijo', presupuesto_base: 0, tipo_moneda: 'Pesos Colombianos',
  fecha_inicio_plan: '', fecha_fin_plan: '', fecha_inicio_real: '', frecuencia_corte: 'Mensual',
  oferta_id: '', oferta_nro: '', proyecto_id: '',
  situacion: 'En Planeación', pais, seguimientos: [],
})

export default function ControlProyectosPage() {
  const idioma = useIdioma()
  const es = idioma !== 'en'
  const currentUser = useCurrentUserStore(s => s.user)
  const paisUsuario = currentUser?.pais || ''
  const usuarioGlobal = esGlobal(paisUsuario)
  const permisos = usePermisos('control-proyectos')

  const items = useControlProyectosStore(s => s.items)
  const addItem = useControlProyectosStore(s => s.addItem)
  const updateItem = useControlProyectosStore(s => s.updateItem)
  const deleteItem = useControlProyectosStore(s => s.deleteItem)
  const loadItems = useControlProyectosStore(s => s.loadItems)

  const ofertas = useSeguimientoOfertaStore(s => s.ofertas)
  const loadOfertas = useSeguimientoOfertaStore(s => s.loadOfertas)
  const proyectosActuales = useProyectosStore(s => s.proyectos)
  const loadProyectos = useProyectosStore(s => s.loadProyectos)

  useEffect(() => { loadItems(); loadOfertas(); loadProyectos() }, [loadItems, loadOfertas, loadProyectos])

  const clientes = useClientesStore(s => s.clientes).filter(c => (c.situacion || '').toLowerCase() === 'activo')
  const allClientes = useClientesStore(s => s.clientes)
  const refData = useReferenceStore(s => s.data)

  const [selected, setSelected] = useState<ControlProyecto | null>(null)
  const [isForm, setIsForm] = useState(false)
  const [verLectura, setVerLectura] = useState(false)
  const [search, setSearch] = useState('')
  const [filtroPais, setFiltroPais] = useState('')

  const refOptions = (table: string, fallback: string[]) => {
    const opts = (refData[table as keyof typeof refData] || []).filter(r => r.situacion).map(r => r.descripcion)
    return opts.length ? opts : fallback
  }

  const auditParams = () => ({
    usuario: currentUser?.usuario || 'desconocido',
    usuario_nombre: `${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`.trim(),
    rol: currentUser?.rol || '',
    modulo: 'control-proyectos',
    pais: currentUser?.pais || '',
  })

  const filtered = items.filter(p =>
    (!usuarioGlobal || !filtroPais || p.pais === filtroPais) &&
    (!search || p.codigo.toLowerCase().includes(search.toLowerCase()) ||
      (p.nombre_proyecto || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.cliente_nombre || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.responsable || '').toLowerCase().includes(search.toLowerCase()))
  )

  // Vincular una Oferta → auto-rellena para evitar doble digitación (Sección 3.6 del documento)
  const vincularOferta = (ofertaId: string) => {
    if (!selected) return
    if (!ofertaId) { setSelected({ ...selected, oferta_id: '', oferta_nro: '' }); return }
    const of = ofertas.find(o => o.id === ofertaId)
    if (!of) return
    setSelected({
      ...selected,
      oferta_id: of.id,
      oferta_nro: of.nro_oferta || '',
      cliente_id: of.cliente_id || selected.cliente_id,
      cliente_nombre: of.cliente_nombre || selected.cliente_nombre,
      nombre_proyecto: selected.nombre_proyecto || of.proyecto || '',
      tipo_moneda: of.tipo_moneda || selected.tipo_moneda,
      presupuesto_base: (of.monto_real_oferta && of.monto_real_oferta > 0) ? of.monto_real_oferta : selected.presupuesto_base,
    })
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    const cli = allClientes.find(c => c.id === selected.cliente_id)
    const toSave = { ...selected, cliente_nombre: cli?.razon_social || selected.cliente_nombre }
    if (toSave.id) {
      const _anterior = items.find(x => x.id === toSave.id)
      updateItem(toSave.id, toSave)
      logAudit({ ...auditParams(), accion: 'MODIFICAR', registro_codigo: toSave.codigo, registro_nombre: toSave.nombre_proyecto, detalle: computarDiff(_anterior as unknown as Record<string, unknown>, toSave as unknown as Record<string, unknown>) })
    } else {
      addItem({ ...toSave, id: crypto.randomUUID(), fecha_registro: today, creado_por: `${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`.trim() || (currentUser?.usuario || 'desconocido'), creado_por_usuario: currentUser?.usuario || '', creado_en: today })
      logAudit({ ...auditParams(), accion: 'CREAR', registro_codigo: toSave.codigo, registro_nombre: toSave.nombre_proyecto })
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

  // Encabezado naranja de obra (identidad del módulo). Envuelto en .po-root para
  // saltar las reglas !important globales y poder usar naranja de verdad.
  const OrangeHeader = () => (
    <div className="po-root" style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 26 }}>📈</span>
        <h1 style={{ margin: 0, fontSize: 23, fontWeight: 900, color: '#ea580c' }}>Control de Proyectos</h1>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#ffffff', background: '#ea580c', padding: '3px 9px', borderRadius: 8, letterSpacing: 0.3 }}>🚧 EN CONSTRUCCIÓN</span>
      </div>
      <div style={{ fontSize: 12.5, color: '#9a3412', marginTop: 4 }}>
        Dashboard gerencial de obra — <b>Fase 1: ficha y datos base</b>. Módulo independiente del módulo Proyectos actual.
      </div>
    </div>
  )

  // ── FORMULARIO (crear / editar / ver) ──
  if (isForm && selected) {
    const ofSel = ofertas.find(o => o.id === selected.oferta_id)
    return (
      <div>
        <OrangeHeader />
        <button onClick={() => { setIsForm(false); setSelected(null); setVerLectura(false) }} style={{ ...btnStyle, background: '#000000', color: '#ffffff', border: '1px solid #333333', marginBottom: 16 }}>← Volver</button>
        <form onSubmit={handleSave} style={{ background: '#ffffff', borderRadius: 16, padding: 24, border: '2px solid #ea580c' }}>
          <h2 style={{ color: '#9a3412', fontSize: 18, fontWeight: 800, marginBottom: 20 }}>{verLectura ? 'Ver Control de Proyecto' : selected.id ? 'Editar Control de Proyecto' : 'Nuevo Control de Proyecto'}</h2>
          <fieldset disabled={verLectura} style={{ border: 'none', padding: 0, margin: 0, minInlineSize: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Nro Control *</label>
                {verLectura ? <div className="ver-box">{selected.codigo || '—'}</div> : <input value={selected.codigo} readOnly style={inputRO} />}
              </div>
              <div>
                <label style={labelStyle}>Fecha Registro</label>
                {verLectura ? <div className="ver-box">{fDate(selected.fecha_registro || today) || '—'}</div> : <input value={fDate(selected.fecha_registro || today)} readOnly style={inputRO} />}
              </div>
              <div>
                <label style={labelStyle}>Código Proyecto</label>
                {verLectura ? <div className="ver-box">{selected.codigo_proyecto || '—'}</div> : <input value={selected.codigo_proyecto} onChange={e => setSelected({ ...selected, codigo_proyecto: e.target.value.toUpperCase() })} placeholder="Código interno..." style={inputStyle} />}
              </div>

              {/* Vínculo a Oferta ganada (auto-rellena) */}
              <div style={{ gridColumn: 'span 3', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 10, padding: 12 }}>
                <label style={{ ...labelStyle, color: '#9a3412' }}>🔗 Vincular Oferta (opcional — trae cliente, proyecto, moneda y presupuesto)</label>
                {verLectura
                  ? <div className="ver-box">{selected.oferta_nro ? `${selected.oferta_nro}${ofSel ? ' · ' + (ofSel.proyecto || '') : ''}` : '— sin vincular —'}</div>
                  : <select value={selected.oferta_id || ''} onChange={e => vincularOferta(e.target.value)} style={inputStyle}>
                      <option value="">— sin vincular —</option>
                      {ofertas.map(o => <option key={o.id} value={o.id}>{o.nro_oferta} · {o.cliente_nombre} · {o.proyecto}{o.situacion ? ` (${o.situacion})` : ''}</option>)}
                    </select>}
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Nombre del Proyecto *</label>
                {verLectura ? <div className="ver-box">{selected.nombre_proyecto || '—'}</div> : <input value={selected.nombre_proyecto} onChange={e => setSelected({ ...selected, nombre_proyecto: e.target.value })} required placeholder="Nombre del proyecto..." style={inputStyle} />}
              </div>
              <div>
                <label style={labelStyle}>País{usuarioGlobal && ' *'}</label>
                {verLectura ? <div className="ver-box">{etiquetaPais(selected.pais)}</div> : usuarioGlobal ? (
                  <select value={selected.pais || ''} onChange={e => setSelected({ ...selected, pais: e.target.value })} style={inputStyle}>
                    {PAISES_ACTIVOS.map(p => <option key={p.codigo} value={p.codigo}>{p.bandera} {p.nombre}</option>)}
                  </select>
                ) : <div style={{ ...inputStyle, background: '#f1f5f9', color: '#64748b' }}>{etiquetaPais(selected.pais)}</div>}
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Cliente *</label>
                {verLectura ? <div className="ver-box">{selected.cliente_nombre || '—'}</div> : <select value={selected.cliente_id} onChange={e => {
                  const cli = clientes.find(c => c.id === e.target.value)
                  setSelected({ ...selected, cliente_id: e.target.value, cliente_nombre: cli?.razon_social || '' })
                }} required style={inputStyle}>
                  <option value="">Seleccionar cliente...</option>
                  {selected.cliente_id && !clientes.some(c => c.id === selected.cliente_id) && (
                    <option value={selected.cliente_id}>{selected.cliente_nombre || '(cliente del registro)'}</option>
                  )}
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
                </select>}
              </div>
              <div>
                <label style={labelStyle}>Responsable / Gerente</label>
                {verLectura ? <div className="ver-box">{selected.responsable || '—'}</div> : <input value={selected.responsable} onChange={e => setSelected({ ...selected, responsable: e.target.value })} placeholder="Responsable..." style={inputStyle} />}
              </div>

              <div style={{ gridColumn: 'span 3' }}>
                <label style={labelStyle}>Alcance / Descripción</label>
                {verLectura ? <div className="ver-box">{selected.descripcion || '—'}</div> : <textarea value={selected.descripcion} onChange={e => setSelected({ ...selected, descripcion: e.target.value })} rows={2} placeholder="Alcance del proyecto..." style={{ ...inputStyle, resize: 'vertical' }} />}
              </div>

              <div>
                <label style={labelStyle}>Tipo de Contrato</label>
                {verLectura ? <div className="ver-box">{selected.tipo_contrato || '—'}</div> : <select value={selected.tipo_contrato} onChange={e => setSelected({ ...selected, tipo_contrato: e.target.value })} style={inputStyle}>
                  {CONTRATO_DEFAULT.map(o => <option key={o} value={o}>{o}</option>)}
                </select>}
              </div>
              <div>
                <label style={labelStyle}>Tipo de Moneda</label>
                {verLectura ? <div className="ver-box">{selected.tipo_moneda || '—'}</div> : <select value={selected.tipo_moneda} onChange={e => setSelected({ ...selected, tipo_moneda: e.target.value })} style={inputStyle}>
                  {refOptions('tipo_moneda', MONEDA_DEFAULT).map(o => <option key={o} value={o}>{o}</option>)}
                </select>}
              </div>
              <div>
                <label style={labelStyle}>Presupuesto / Línea Base</label>
                <MoneyInput value={selected.presupuesto_base || 0} onChange={n => setSelected({ ...selected, presupuesto_base: n })} placeholder="0" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Fecha Inicio (Plan)</label>
                {verLectura ? <div className="ver-box">{selected.fecha_inicio_plan || '—'}</div> : <input type="date" value={selected.fecha_inicio_plan} onChange={e => setSelected({ ...selected, fecha_inicio_plan: e.target.value })} style={inputStyle} />}
              </div>
              <div>
                <label style={labelStyle}>Fecha Fin (Plan)</label>
                {verLectura ? <div className="ver-box">{selected.fecha_fin_plan || '—'}</div> : <input type="date" value={selected.fecha_fin_plan} onChange={e => setSelected({ ...selected, fecha_fin_plan: e.target.value })} style={inputStyle} />}
              </div>
              <div>
                <label style={labelStyle}>Fecha Inicio Real</label>
                {verLectura ? <div className="ver-box">{selected.fecha_inicio_real || '—'}</div> : <input type="date" value={selected.fecha_inicio_real} onChange={e => setSelected({ ...selected, fecha_inicio_real: e.target.value })} style={inputStyle} />}
              </div>

              <div>
                <label style={labelStyle}>Frecuencia de Corte</label>
                {verLectura ? <div className="ver-box">{selected.frecuencia_corte || '—'}</div> : <select value={selected.frecuencia_corte} onChange={e => setSelected({ ...selected, frecuencia_corte: e.target.value })} style={inputStyle}>
                  {FRECUENCIA.map(o => <option key={o} value={o}>{o}</option>)}
                </select>}
              </div>
              <div>
                <label style={labelStyle}>Vincular Proyecto actual (opcional)</label>
                {verLectura ? <div className="ver-box">{proyectosActuales.find(pr => pr.id === selected.proyecto_id)?.codigo_proyecto || '— ninguno —'}</div> : <select value={selected.proyecto_id || ''} onChange={e => setSelected({ ...selected, proyecto_id: e.target.value })} style={inputStyle}>
                  <option value="">— ninguno —</option>
                  {proyectosActuales.map(pr => <option key={pr.id} value={pr.id}>{pr.codigo} · {pr.codigo_proyecto || pr.cliente_nombre}</option>)}
                </select>}
              </div>
              <div>
                <label style={labelStyle}>Situación</label>
                {verLectura ? <div className="ver-box">{selected.situacion || '—'}</div> : <select value={selected.situacion} onChange={e => setSelected({ ...selected, situacion: e.target.value })} style={inputStyle}>
                  {refOptions('situacion_proyecto', SITUACION_DEFAULT).map(o => <option key={o} value={o}>{o}</option>)}
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
            {!verLectura && <button type="submit" style={{ ...btnStyle, background: '#ea580c', color: '#ffffff' }}>Guardar</button>}
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
                updateItem(selected.id, updated); setSelected(updated)
              }}
            />
            <DocumentosPanel modulo="control-proyectos" registroId={selected.id} />
          </>
        )}
      </div>
    )
  }

  // ── VISTA PRINCIPAL ──
  return (
    <div>
      <OrangeHeader />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por código, proyecto, cliente o responsable..." style={{ ...inputStyle, maxWidth: 380 }} />
        {usuarioGlobal && (
          <select value={filtroPais} onChange={e => setFiltroPais(e.target.value)} style={{ ...inputStyle, maxWidth: 220 }}>
            <option value="">🌎 Todos los países</option>
            {PAISES_ACTIVOS.map(p => <option key={p.codigo} value={p.codigo}>{p.bandera} {p.nombre}</option>)}
          </select>
        )}
        {permisos.crear && (
          <button onClick={() => { setSelected(emptyControlProyecto(nextConsecutivo('CTP-', items.map(p => p.codigo)).codigo, `${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`.trim(), usuarioGlobal ? (PAISES_ACTIVOS[0]?.codigo || 'Colombia') : paisUsuario)); setVerLectura(false); setIsForm(true) }} style={{ ...btnStyle, background: '#ea580c', color: '#ffffff' }}>+ Nuevo Control</button>
        )}
      </div>

      <div style={{ borderRadius: 12, border: '1px solid #ea580c', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Nro', 'Proyecto', 'Cliente', 'Responsable', 'País', 'Presupuesto Base', 'Situación', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '12px 14px', background: '#ea580c', color: '#fff', fontSize: 12, textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={p.id} style={{ background: i % 2 === 0 ? '#fff7ed' : '#fff' }}>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #fed7aa', color: '#000', fontSize: 13, fontFamily: 'monospace' }}>{p.codigo}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #fed7aa', color: '#000', fontSize: 13, fontWeight: 600 }}>{p.nombre_proyecto || '—'}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #fed7aa', color: '#000', fontSize: 13 }}>{p.cliente_nombre || '—'}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #fed7aa', color: '#000', fontSize: 13 }}>{p.responsable || '—'}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #fed7aa', color: '#000', fontSize: 13, whiteSpace: 'nowrap' }}>{etiquetaPais(p.pais)}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #fed7aa', color: '#000', fontSize: 13, textAlign: 'right' }}>{fmtMoney(p.presupuesto_base || 0)}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #fed7aa' }}><span style={situColor(p.situacion)}>{p.situacion}</span></td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #fed7aa' }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <button onClick={() => { setSelected(p); setVerLectura(true); setIsForm(true) }} style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#ea580c', color: '#ffffff', border: '1px solid #f97316' }}>Ver</button>
                    {permisos.editar && <button onClick={() => { setSelected(p); setVerLectura(false); setIsForm(true) }} style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#2563eb', color: '#ffffff', border: '1px solid #3b82f6' }}>Editar</button>}
                    {permisos.eliminar && <button onClick={() => { if (confirm(`¿Eliminar el control ${p.codigo}?`)) { deleteItem(p.id); logAudit({ ...auditParams(), accion: 'ELIMINAR', registro_codigo: p.codigo, registro_nombre: p.nombre_proyecto }) } }} style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#dc2626', color: '#ffffff', border: '1px solid #ef4444' }}>Eliminar</button>}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#9a3412', fontSize: 14 }}>No hay proyectos en control todavía. Crea el primero con “+ Nuevo Control”.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
