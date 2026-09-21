'use client'
import { useState, useEffect } from 'react'
import ModuleHeader from '@/shared/components/module-header'
import { useSeguimientoOfertaStore, SeguimientoOferta, DocumentoExigido } from '@/features/seguimiento-oferta/store/seguimiento-oferta-store'
import { useClientesStore } from '@/features/clientes/store/clientes-store'
import { useCurrentUserStore } from '@/features/usuarios-gestion/store/current-user-store'
import { useReferenceStore } from '@/features/referencias/store/reference-store'
import { usePermisos } from '@/shared/hooks/use-permisos'
import SeguimientoPanel from '@/shared/components/seguimiento-panel'
import { Seguimiento } from '@/shared/types/seguimiento'
import { fmtMoney, monedaSimbolo } from '@/shared/lib/format-number'
import { fDate, todayColombia } from '@/shared/lib/format-date'
import { nextConsecutivo } from '@/shared/lib/consecutivo'
import { esGlobal, PAISES_ACTIVOS, etiquetaPais } from '@/shared/lib/paises'
import { useIdioma } from '@/shared/i18n/use-t'

const today = todayColombia()

const emptyOferta = (codigo: string, pais: string): SeguimientoOferta => ({
  id: '', nro_oferta: codigo, oportunidad_id: '', oportunidad_codigo: '',
  fecha_registro: today, cliente_id: '', cliente_nombre: '', contacto_id: '', contacto_nombre: '',
  proyecto: '', ciudad: '', pais, tipo_moneda: 'Pesos Colombianos',
  adjudicacion: '', mgc: 0, ejecucion_anyo_pct: 0, parcial_euros_anyo: 0,
  fecha_inicio_consultas: '', fecha_final_consultas: '',
  fecha_presentar_oferta: '', fecha_real_presentacion_oferta: '',
  monto_real_oferta: 0, fecha_esperada_veredicto: '', veredicto: 'Pendiente', empresa_ganadora: '',
  documentos_exigidos: [], observaciones: '', situacion: 'En Preparación', seguimientos: [],
})

export default function SeguimientoOfertaPage() {
  const idioma = useIdioma()
  const L = (es: string, en: string) => (idioma === 'en' ? en : es)
  const permisos = usePermisos('seguimiento-oferta')
  const currentUser = useCurrentUserStore(s => s.user)
  const { ofertas, addOferta, updateOferta, deleteOferta } = useSeguimientoOfertaStore()
  const loadOfertas = useSeguimientoOfertaStore(s => s.loadOfertas)
  const clientes = useClientesStore(s => s.clientes)
  const loadClientes = useClientesStore(s => s.loadClientes)
  const refData = useReferenceStore(s => s.data)

  const paisUsuario = currentUser?.pais || ''
  const usuarioGlobal = esGlobal(paisUsuario)
  const paisNuevo = usuarioGlobal ? (PAISES_ACTIVOS[0]?.codigo || 'Colombia') : paisUsuario

  useEffect(() => { loadOfertas(); loadClientes() }, [loadOfertas, loadClientes])

  const [selected, setSelected] = useState<SeguimientoOferta | null>(null)
  const [isForm, setIsForm] = useState(false)
  const [verLectura, setVerLectura] = useState(false)
  const [viewDetail, setViewDetail] = useState<SeguimientoOferta | null>(null)
  const [search, setSearch] = useState('')
  const [filtroPais, setFiltroPais] = useState('')
  const [nuevoDoc, setNuevoDoc] = useState('')

  const refOpt = (t: string) => (refData[t as keyof typeof refData] as { descripcion: string; situacion: boolean }[] || []).filter(r => r.situacion).map(r => r.descripcion)

  const filtered = ofertas.filter(o =>
    (!usuarioGlobal || !filtroPais || o.pais === filtroPais) &&
    (!search || (o.nro_oferta || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.cliente_nombre || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.proyecto || '').toLowerCase().includes(search.toLowerCase()))
  )

  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, background: '#fff', border: '1px solid #1e3a8a', color: '#1e3a8a', fontWeight: 600, fontSize: 13, outline: 'none' }
  const btnStyle: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }
  const th: React.CSSProperties = { padding: '10px 12px', background: '#0f1b3d', color: '#fff', fontSize: 12, textAlign: 'left' }
  const td: React.CSSProperties = { padding: '9px 12px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }
  const lab: React.CSSProperties = { color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }
  const franja: React.CSSProperties = { color: '#fff', fontSize: 12, fontWeight: 700, background: '#1e3a8a', padding: '6px 10px', borderRadius: 6, margin: '18px 0 14px', letterSpacing: 0.5, textAlign: 'center' }

  const nuevo = () => { setSelected(emptyOferta(nextConsecutivo('OF-', ofertas.map(o => o.nro_oferta)).codigo, paisNuevo)); setVerLectura(false); setIsForm(true) }

  const onCliente = (id: string) => {
    const c = clientes.find(x => x.id === id)
    setSelected(s => s ? { ...s, cliente_id: id, cliente_nombre: c?.razon_social || '', ciudad: c?.ciudad || s.ciudad, pais: usuarioGlobal ? (c?.pais || s.pais) : s.pais } : s)
  }

  const guardar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    const autor = `${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`.trim() || (currentUser?.usuario || 'desconocido')
    if (selected.id) updateOferta(selected.id, selected)
    else addOferta({ ...selected, id: crypto.randomUUID(), creado_por: autor, creado_por_usuario: currentUser?.usuario || '', creado_por_rol: currentUser?.rol || '', creado_en: today })
    setIsForm(false); setSelected(null)
  }

  // ── Vista detalle ──
  if (viewDetail) {
    const o = viewDetail
    const campos: [string, string][] = [
      [L('Nro Oferta', 'Bid No.'), o.nro_oferta], [L('Fecha Registro', 'Registration Date'), o.fecha_registro ? fDate(o.fecha_registro) : '-'],
      [L('Cliente', 'Client'), o.cliente_nombre], [L('Proyecto', 'Project'), o.proyecto], [L('País', 'Country'), etiquetaPais(o.pais)],
      [L('Oportunidad', 'Opportunity'), o.oportunidad_codigo || '-'],
      [L('Fecha Inicio Consultas', 'Q&A Start Date'), o.fecha_inicio_consultas ? fDate(o.fecha_inicio_consultas) : '-'],
      [L('Fecha Final Consultas', 'Q&A End Date'), o.fecha_final_consultas ? fDate(o.fecha_final_consultas) : '-'],
      [L('Fecha Presentar Oferta', 'Bid Submission Date'), o.fecha_presentar_oferta ? fDate(o.fecha_presentar_oferta) : '-'],
      [L('Fecha Real Presentación', 'Actual Submission Date'), o.fecha_real_presentacion_oferta ? fDate(o.fecha_real_presentacion_oferta) : '-'],
      [L('Monto Real Oferta', 'Actual Bid Amount'), `${monedaSimbolo(o.tipo_moneda)}${fmtMoney(o.monto_real_oferta || 0)}`],
      [L('Fecha Esperada Veredicto', 'Expected Verdict Date'), o.fecha_esperada_veredicto ? fDate(o.fecha_esperada_veredicto) : '-'],
      [L('Veredicto', 'Verdict'), o.veredicto || '-'], [L('Empresa Ganadora', 'Winning Company'), o.empresa_ganadora || '-'],
      [L('Situación', 'Status'), o.situacion || '-'],
    ]
    return (
      <div>
        <button onClick={() => setViewDetail(null)} style={{ ...btnStyle, background: '#000', color: '#fff', marginBottom: 16 }}>← {L('Volver', 'Back')}</button>
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #1e3a8a' }}>
          <h2 style={{ color: '#013978', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{o.nro_oferta} · {o.proyecto || o.cliente_nombre}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {campos.map(c => (<div key={c[0]}><p style={{ color: '#013978', fontSize: 12, fontWeight: 800, marginBottom: 2 }}>{c[0]}</p><p style={{ color: '#013978', fontSize: 14 }}>{c[1] || '—'}</p></div>))}
          </div>
          {(o.documentos_exigidos || []).length > 0 && (
            <>
              <h3 style={franja}>{L('DOCUMENTOS EXIGIDOS EN OFERTA', 'DOCUMENTS REQUIRED IN BID')} ({(o.documentos_exigidos || []).length})</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={th}>#</th><th style={th}>{L('Documento', 'Document')}</th><th style={th}>{L('Fecha Procesado', 'Processed Date')}</th><th style={th}>{L('Listo', 'Ready')}</th></tr></thead>
                <tbody>{(o.documentos_exigidos || []).map((d, i) => (
                  <tr key={d.id}><td style={td}>{i + 1}</td><td style={td}>{d.documento}</td><td style={td}>{d.fecha_procesado ? fDate(d.fecha_procesado) : '—'}</td><td style={td}>{d.listo ? '✓' : '—'}</td></tr>
                ))}</tbody>
              </table>
            </>
          )}
        </div>
        {/* Bitácora de Seguimiento propia del módulo Seguimiento Oferta */}
        <div style={{ background: '#0b1d4a', borderRadius: 16, padding: 20, border: '1px solid #1e3a8a', marginTop: 16 }}>
          <SeguimientoPanel
            seguimientos={o.seguimientos || []}
            usuario={`${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`.trim() || (currentUser?.usuario || '')}
            situacionActual={o.situacion}
            situacionOpciones={refOpt('situacion_lista').length ? refOpt('situacion_lista') : ['En Preparación', 'Presentada', 'En Evaluación', 'Ganada', 'Perdida', 'Desierta']}
            readOnly={!permisos.editar}
            onAdd={(seg: Seguimiento) => {
              const updated = { ...o, situacion: seg.situacion, seguimientos: [...(o.seguimientos || []), seg] }
              updateOferta(o.id, updated); setViewDetail(updated)
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div>
      <ModuleHeader title={L('Seguimiento Oferta', 'Bid Tracking')} subtitle={L('Control y seguimiento de ofertas / licitaciones', 'Control and tracking of bids / tenders')} />

      {!isForm && (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
            {permisos.crear && <button onClick={nuevo} style={{ ...btnStyle, background: '#1e3a8a', color: '#fff' }}>+ {L('Nueva Oferta', 'New Bid')}</button>}
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={L('Buscar oferta, cliente o proyecto…', 'Search bid, client or project…')} style={{ ...inputStyle, maxWidth: 380 }} />
            {usuarioGlobal && (
              <select value={filtroPais} onChange={e => setFiltroPais(e.target.value)} style={{ ...inputStyle, maxWidth: 200 }}>
                <option value="">🌎 {L('Todos los países', 'All countries')}</option>
                {PAISES_ACTIVOS.map(p => <option key={p.codigo} value={p.codigo}>{p.bandera} {p.nombre}</option>)}
              </select>
            )}
          </div>
          <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{[L('Nro Oferta', 'Bid No.'), L('Fecha', 'Date'), L('Cliente', 'Client'), L('Proyecto', 'Project'), L('Monto', 'Amount'), L('Veredicto', 'Verdict'), L('Situación', 'Status'), L('Acciones', 'Actions')].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td style={td} colSpan={8}>{L('No hay ofertas registradas.', 'No bids registered.')}</td></tr>
                ) : filtered.map(o => (
                  <tr key={o.id}>
                    <td style={{ ...td, fontWeight: 700 }}>{o.nro_oferta}</td>
                    <td style={td}>{o.fecha_registro ? fDate(o.fecha_registro) : '—'}</td>
                    <td style={td}>{o.cliente_nombre}</td>
                    <td style={td}>{o.proyecto}</td>
                    <td style={td}>{monedaSimbolo(o.tipo_moneda)}{fmtMoney(o.monto_real_oferta || 0)}</td>
                    <td style={td}>{o.veredicto || '—'}</td>
                    <td style={td}>{o.situacion || '—'}</td>
                    <td style={td}>
                      <button onClick={() => setViewDetail(o)} style={{ ...btnStyle, padding: '4px 10px', fontSize: 12, background: '#e2e8f0', color: '#013978' }}>{L('Ver', 'View')}</button>
                      {permisos.editar && <button onClick={() => { setSelected(o); setVerLectura(false); setIsForm(true) }} style={{ ...btnStyle, padding: '4px 10px', fontSize: 12, background: '#2563eb', color: '#fff', marginLeft: 6 }}>{L('Editar', 'Edit')}</button>}
                      {permisos.eliminar && <button onClick={() => { if (confirm(L('¿Eliminar esta oferta?', 'Delete this bid?'))) deleteOferta(o.id) }} style={{ ...btnStyle, padding: '4px 10px', fontSize: 12, background: '#dc2626', color: '#fff', marginLeft: 6 }}>{L('Eliminar', 'Delete')}</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {isForm && selected && (
        <form onSubmit={guardar} style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #1e3a8a' }}>
          <h3 style={franja}>{L('DATOS DE LA OFERTA', 'BID DETAILS')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div><label style={lab}>{L('Nro Oferta', 'Bid No.')}</label><input value={selected.nro_oferta} readOnly style={{ ...inputStyle, opacity: 0.6 }} /></div>
            <div><label style={lab}>{L('Fecha Registro', 'Registration Date')}</label><input type="date" value={selected.fecha_registro} onChange={e => setSelected({ ...selected, fecha_registro: e.target.value })} style={inputStyle} /></div>
            <div>
              <label style={lab}>{L('Cliente *', 'Client *')}</label>
              <select required value={selected.cliente_id} onChange={e => onCliente(e.target.value)} style={inputStyle}>
                <option value="">{L('Seleccione…', 'Select…')}</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}><label style={lab}>{L('Proyecto *', 'Project *')}</label><input required value={selected.proyecto} onChange={e => setSelected({ ...selected, proyecto: e.target.value })} style={inputStyle} /></div>
            <div>
              <label style={lab}>{L('País', 'Country')}</label>
              {usuarioGlobal ? (
                <select value={selected.pais || paisNuevo} onChange={e => setSelected({ ...selected, pais: e.target.value })} style={inputStyle}>
                  {PAISES_ACTIVOS.map(p => <option key={p.codigo} value={p.codigo}>{p.bandera} {p.nombre}</option>)}
                </select>
              ) : <div className="ver-box">{etiquetaPais(selected.pais || paisUsuario)}</div>}
            </div>
            <div>
              <label style={lab}>{L('Tipo de Moneda', 'Currency Type')}</label>
              <select value={selected.tipo_moneda} onChange={e => setSelected({ ...selected, tipo_moneda: e.target.value })} style={inputStyle}>
                {refOpt('tipo_moneda').map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div><label style={lab}>{L('Oportunidad (código)', 'Opportunity (code)')}</label><input value={selected.oportunidad_codigo || ''} onChange={e => setSelected({ ...selected, oportunidad_codigo: e.target.value })} placeholder={L('Opcional', 'Optional')} style={inputStyle} /></div>
          </div>

          <h3 style={franja}>{L('CONTROL OFERTA', 'BID CONTROL')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div><label style={lab}>{L('Fecha Inicio Consultas', 'Q&A Start Date')}</label><input type="date" value={selected.fecha_inicio_consultas} onChange={e => setSelected({ ...selected, fecha_inicio_consultas: e.target.value })} style={inputStyle} /></div>
            <div><label style={lab}>{L('Fecha Final Consultas', 'Q&A End Date')}</label><input type="date" value={selected.fecha_final_consultas} onChange={e => setSelected({ ...selected, fecha_final_consultas: e.target.value })} style={inputStyle} /></div>
            <div><label style={lab}>{L('Fecha Presentar Oferta', 'Bid Submission Date')}</label><input type="date" value={selected.fecha_presentar_oferta} onChange={e => setSelected({ ...selected, fecha_presentar_oferta: e.target.value })} style={inputStyle} /></div>
            <div><label style={lab}>{L('Fecha Real Presentación', 'Actual Submission Date')}</label><input type="date" value={selected.fecha_real_presentacion_oferta} onChange={e => setSelected({ ...selected, fecha_real_presentacion_oferta: e.target.value })} style={inputStyle} /></div>
            <div><label style={lab}>{L('Monto Real Oferta', 'Actual Bid Amount')}</label><input type="number" step="1" min="0" value={selected.monto_real_oferta || ''} onChange={e => setSelected({ ...selected, monto_real_oferta: Math.round(parseFloat(e.target.value)) || 0 })} style={inputStyle} /></div>
            <div><label style={lab}>{L('Fecha Esperada Veredicto', 'Expected Verdict Date')}</label><input type="date" value={selected.fecha_esperada_veredicto} onChange={e => setSelected({ ...selected, fecha_esperada_veredicto: e.target.value })} style={inputStyle} /></div>
            <div>
              <label style={lab}>{L('Veredicto', 'Verdict')}</label>
              <select value={selected.veredicto} onChange={e => setSelected({ ...selected, veredicto: e.target.value })} style={inputStyle}>
                {refOpt('veredicto_oferta').map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div><label style={lab}>{L('Empresa Ganadora', 'Winning Company')}</label><input value={selected.empresa_ganadora} onChange={e => setSelected({ ...selected, empresa_ganadora: e.target.value })} style={inputStyle} /></div>
            <div>
              <label style={lab}>{L('Situación', 'Status')}</label>
              <select value={selected.situacion} onChange={e => setSelected({ ...selected, situacion: e.target.value })} style={inputStyle}>
                {refOpt('situacion_oferta').map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={lab}>{L('Observaciones', 'Notes')}</label>
            <textarea value={selected.observaciones} onChange={e => setSelected({ ...selected, observaciones: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          {/* Documentos Exigidos */}
          <h3 style={franja}>{L('DOCUMENTOS EXIGIDOS EN OFERTA', 'DOCUMENTS REQUIRED IN BID')} ({(selected.documentos_exigidos || []).length}/20)</h3>
          <div style={{ marginBottom: 10, textAlign: 'right' }}>
            <button type="button" onClick={() => {
              const estandar = ['Carta de presentación', 'Certificado de existencia y representación legal', 'RUT', 'Estados financieros', 'Experiencia / portafolio', 'Pólizas / garantías', 'Propuesta técnica', 'Propuesta económica']
              const ex = new Set((selected.documentos_exigidos || []).map(d => (d.documento || '').toLowerCase()))
              const espacio = 20 - (selected.documentos_exigidos || []).length
              const add = estandar.filter(t => !ex.has(t.toLowerCase())).slice(0, Math.max(0, espacio)).map(t => ({ id: crypto.randomUUID(), documento: t, fecha_procesado: '', listo: false, creado_en: new Date().toISOString() }))
              if (!add.length) { alert(L('El checklist estándar ya está cargado.', 'The standard checklist is already loaded.')); return }
              setSelected({ ...selected, documentos_exigidos: [...(selected.documentos_exigidos || []), ...add] })
            }} style={{ ...btnStyle, background: '#0d9488', color: '#fff', fontSize: 12 }}>📋 {L('Cargar checklist estándar', 'Load standard checklist')}</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #1e3a8a', borderRadius: 8, overflow: 'hidden' }}>
            <thead><tr><th style={th}>#</th><th style={th}>{L('Documento', 'Document')}</th><th style={th}>{L('Fecha Procesado', 'Processed Date')}</th><th style={th}>{L('Listo', 'Ready')}</th><th style={th}></th></tr></thead>
            <tbody>
              {(selected.documentos_exigidos || []).map((doc, i) => (
                <tr key={doc.id}>
                  <td style={td}>{i + 1}</td>
                  <td style={td}>{doc.documento}</td>
                  <td style={td}><input type="date" value={doc.fecha_procesado} onChange={e => setSelected({ ...selected, documentos_exigidos: (selected.documentos_exigidos || []).map(d => d.id === doc.id ? { ...d, fecha_procesado: e.target.value } : d) })} style={{ ...inputStyle, padding: '5px 8px' }} /></td>
                  <td style={{ ...td, textAlign: 'center' }}><input type="checkbox" checked={doc.listo} onChange={e => setSelected({ ...selected, documentos_exigidos: (selected.documentos_exigidos || []).map(d => d.id === doc.id ? { ...d, listo: e.target.checked } : d) })} style={{ width: 18, height: 18 }} /></td>
                  <td style={{ ...td, textAlign: 'center' }}><button type="button" onClick={() => setSelected({ ...selected, documentos_exigidos: (selected.documentos_exigidos || []).filter(d => d.id !== doc.id) })} style={{ ...btnStyle, padding: '2px 8px', fontSize: 11, background: '#fee2e2', color: '#b91c1c' }}>✕</button></td>
                </tr>
              ))}
              {(selected.documentos_exigidos || []).length < 20 && (
                <tr>
                  <td style={td}>{(selected.documentos_exigidos || []).length + 1}</td>
                  <td style={td} colSpan={3}><input value={nuevoDoc} onChange={e => setNuevoDoc(e.target.value)} placeholder={L('Escriba el documento y pulse Agregar…', 'Type the document and press Add…')} style={{ ...inputStyle, padding: '5px 8px' }} /></td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <button type="button" disabled={!nuevoDoc.trim()} onClick={() => {
                      const txt = nuevoDoc.trim(); if (!txt) return
                      setSelected({ ...selected, documentos_exigidos: [...(selected.documentos_exigidos || []), { id: crypto.randomUUID(), documento: txt, fecha_procesado: '', listo: false, creado_en: new Date().toISOString() }] })
                      setNuevoDoc('')
                    }} style={{ ...btnStyle, padding: '4px 10px', fontSize: 11, background: nuevoDoc.trim() ? '#15803d' : '#cbd5e1', color: '#fff' }}>+ {L('Agregar', 'Add')}</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="submit" style={{ ...btnStyle, background: '#1e3a8a', color: '#fff' }}>{L('Guardar', 'Save')}</button>
            <button type="button" onClick={() => { setIsForm(false); setSelected(null) }} style={{ ...btnStyle, background: '#64748b', color: '#fff' }}>{L('Cancelar', 'Cancel')}</button>
          </div>
        </form>
      )}
    </div>
  )
}
