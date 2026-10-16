'use client'
import { useState, useEffect } from 'react'
import ModuleHeader from '@/shared/components/module-header'
import { useSeguimientoOfertaStore, SeguimientoOferta, DocumentoExigido, RequerimientoInicial } from '@/features/seguimiento-oferta/store/seguimiento-oferta-store'
import { useTareasStore, Tarea, esTareaFinalizada, mensajeWhatsAppTarea } from '@/features/tareas/store/tareas-store'
import { useUsuariosStore } from '@/features/usuarios-gestion/store/usuarios-store'
import { useClientesStore } from '@/features/clientes/store/clientes-store'
import { useCurrentUserStore } from '@/features/usuarios-gestion/store/current-user-store'
import { useReferenceStore } from '@/features/referencias/store/reference-store'
import { usePermisos } from '@/shared/hooks/use-permisos'
import SeguimientoPanel from '@/shared/components/seguimiento-panel'
import { Seguimiento } from '@/shared/types/seguimiento'
import { fmtMoney, monedaSimbolo, setMonedaLocale } from '@/shared/lib/format-number'
import { fDate, todayColombia } from '@/shared/lib/format-date'
import { nextConsecutivo } from '@/shared/lib/consecutivo'
import { esGlobal, PAISES_ACTIVOS, etiquetaPais } from '@/shared/lib/paises'
import { buildWhatsAppLink, isValidPhone } from '@/shared/lib/whatsapp'
import { useIdioma } from '@/shared/i18n/use-t'

const today = todayColombia()
function todayCO_tarea() { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }) }
const MAX_REQ = 25

const emptyOferta = (codigo: string, pais: string): SeguimientoOferta => ({
  id: '', nro_oferta: codigo, oportunidad_id: '', oportunidad_codigo: '',
  fecha_registro: today, cliente_id: '', cliente_nombre: '', contacto_id: '', contacto_nombre: '',
  proyecto: '', ciudad: '', pais, tipo_moneda: 'Soles',
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
  const addTareaGlobal = useTareasStore(s => s.addTarea)
  const updateTareaGlobal = useTareasStore(s => s.updateTarea)
  const tareasList = useTareasStore(s => s.tareas)
  const loadTareas = useTareasStore(s => s.loadTareas)
  const usuariosSistema = useUsuariosStore(s => s.usuarios)
  const loadUsuarios = useUsuariosStore(s => s.loadUsuarios)
  const clientes = useClientesStore(s => s.clientes)
  const loadClientes = useClientesStore(s => s.loadClientes)
  const refData = useReferenceStore(s => s.data)

  const paisUsuario = currentUser?.pais || ''
  setMonedaLocale(paisUsuario) // formato de numero sigue al pais (igual que el simbolo)
  const usuarioGlobal = esGlobal(paisUsuario)
  const paisNuevo = usuarioGlobal ? (PAISES_ACTIVOS[0]?.codigo || 'Colombia') : paisUsuario

  useEffect(() => { loadOfertas(); loadClientes(); loadTareas(); loadUsuarios() }, [loadOfertas, loadClientes, loadTareas, loadUsuarios])

  const [selected, setSelected] = useState<SeguimientoOferta | null>(null)
  const [isForm, setIsForm] = useState(false)
  const [verLectura, setVerLectura] = useState(false)
  const [viewDetail, setViewDetail] = useState<SeguimientoOferta | null>(null)
  const [search, setSearch] = useState('')
  const [filtroPais, setFiltroPais] = useState('')
  const [nuevoDoc, setNuevoDoc] = useState('')
  // Requerimientos + Tareas
  const [nuevoReqTexto, setNuevoReqTexto] = useState('')
  const [nuevoReqFecha, setNuevoReqFecha] = useState('')
  const [tareaModal, setTareaModal] = useState<Tarea | null>(null)
  const [tareaReqId, setTareaReqId] = useState<string | null>(null)

  const usuariosActivos = (usuariosSistema || []).filter(u => (u.situacion || '').toLowerCase() === 'activo')

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

  // ══════════ REQUERIMIENTOS DE DOCUMENTOS (con Tareas) ══════════
  const autorNombre = () => `${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`.trim() || (currentUser?.usuario || 'desconocido')

  // Autoguarda el renglón: estado local + persiste de inmediato (si la oferta ya existe)
  const persistRequerimientos = (nuevos: RequerimientoInicial[]) => {
    if (!selected) return
    const upd = { ...selected, requerimientos_iniciales: nuevos }
    setSelected(upd)
    if (upd.id) updateOferta(upd.id, { requerimientos_iniciales: nuevos })
  }
  const setReqLocal = (nuevos: RequerimientoInicial[]) => { if (selected) setSelected({ ...selected, requerimientos_iniciales: nuevos }) }
  const guardarReqAhora = () => { if (selected?.id) updateOferta(selected.id, { requerimientos_iniciales: selected.requerimientos_iniciales || [] }) }

  const agregarRequerimiento = () => {
    if (!selected) return
    const txt = nuevoReqTexto.trim()
    if (!txt || (selected.requerimientos_iniciales || []).length >= MAX_REQ) return
    const nuevo: RequerimientoInicial = { id: crypto.randomUUID(), requerimiento: txt, fecha: nuevoReqFecha || '', listo: false, creado_en: today, creado_por: autorNombre() }
    persistRequerimientos([...(selected.requerimientos_iniciales || []), nuevo])
    setNuevoReqTexto(''); setNuevoReqFecha('')
  }
  const eliminarRequerimiento = (id: string) => {
    if (!selected) return
    persistRequerimientos((selected.requerimientos_iniciales || []).filter(r => r.id !== id))
  }

  // Marca "Listo" el renglón; si tiene Tarea enlazada aún no finalizada, TAMBIÉN la finaliza
  const marcarListoReq = (req: RequerimientoInicial, checked: boolean) => {
    if (!selected) return
    const t = checked ? tareaDeReq(req) : undefined
    if (t && !esTareaFinalizada(t.situacion)) {
      const autor = autorNombre()
      const fin = todayCO_tarea()
      const tFinal: Tarea = { ...t, situacion: 'Finalizada', fecha_real_fin: t.fecha_real_fin || fin, seguimientos: [...(t.seguimientos || []), { id: crypto.randomUUID(), fecha: fin, detalle: 'Tarea finalizada (desde el requerimiento).', persona_actividad: autor, situacion: 'Finalizada', usuario: autor }] }
      updateTareaGlobal(t.id, tFinal)
      persistRequerimientos((selected.requerimientos_iniciales || []).map(r => r.id === req.id ? { ...r, listo: true, fecha: tFinal.fecha_real_fin } : r))
    } else {
      persistRequerimientos((selected.requerimientos_iniciales || []).map(r => r.id === req.id ? { ...r, listo: checked } : r))
    }
  }

  const tareaDeReq = (req: RequerimientoInicial) => req.tarea_codigo ? tareasList.find(t => t.codigo === req.tarea_codigo) : undefined
  const reqBloqueado = (req: RequerimientoInicial) => esTareaFinalizada(tareaDeReq(req)?.situacion)

  const abrirTareaDesdeReq = (req: RequerimientoInicial) => {
    if (!selected) return
    const codigo = nextConsecutivo('TAR-', tareasList.map(t => t.codigo)).codigo
    setTareaReqId(req.id)
    setTareaModal({
      id: '', codigo, fecha_asignacion: todayCO_tarea(), hora_asignacion: '',
      persona_asigna: autorNombre(), persona_ejecuta: '',
      fecha_requerida_fin: req.fecha || '', fecha_real_fin: '',
      descripcion: `[Req. Oferta ${selected.nro_oferta}] ${req.requerimiento}`,
      origen_tarea: 'Seguimiento Oferta', origen_codigo: selected.nro_oferta,
      cliente_nombre: selected.cliente_nombre || '', proyecto: selected.proyecto || '',
      situacion: 'En Proceso', pais: selected.pais || paisUsuario,
      fecha_registro: todayCO_tarea(), seguimientos: [],
    })
  }
  const abrirTareaExistente = (req: RequerimientoInicial) => {
    const t = tareaDeReq(req)
    if (!t) { alert(L('No se encontró la tarea enlazada a este renglón.', 'The task linked to this row was not found.')); return }
    setTareaReqId(req.id); setTareaModal({ ...t })
  }

  const guardarTareaModal = () => {
    if (!tareaModal || !selected) return
    if (!tareaModal.persona_ejecuta || !tareaModal.fecha_requerida_fin || !tareaModal.descripcion.trim()) {
      alert(L('Complete: Persona que ejecuta, Fecha requerida y Descripción.', 'Please complete: Assignee, Required date and Description.')); return
    }
    const autor = autorNombre()
    const esNueva = !tareaModal.id
    const antesTarea = tareasList.find(t => t.id === tareaModal.id)
    const finalizada = esTareaFinalizada(tareaModal.situacion)
    const seFinaliza = finalizada && !esTareaFinalizada(antesTarea?.situacion)
    let conFin = tareaModal
    if (finalizada && !conFin.fecha_real_fin) conFin = { ...conFin, fecha_real_fin: todayCO_tarea() }
    if (seFinaliza) conFin = { ...conFin, seguimientos: [...(conFin.seguimientos || []), { id: crypto.randomUUID(), fecha: todayCO_tarea(), detalle: 'Tarea finalizada.', persona_actividad: autor, situacion: 'Finalizada', usuario: autor }] }
    const tareaFinal: Tarea = esNueva
      ? { ...conFin, id: crypto.randomUUID(), fecha_registro: todayCO_tarea(), creado_por: autor, creado_por_usuario: currentUser?.usuario || '', creado_en: todayCO_tarea() }
      : { ...conFin }

    if (esNueva) addTareaGlobal(tareaFinal)
    else updateTareaGlobal(tareaFinal.id, tareaFinal)

    const nuevos = (selected.requerimientos_iniciales || []).map(r => {
      const enlazado = r.id === tareaReqId || (!!tareaFinal.codigo && r.tarea_codigo === tareaFinal.codigo)
      if (!enlazado) return r
      const base = { ...r, tarea_codigo: tareaFinal.codigo }
      return finalizada ? { ...base, fecha: tareaFinal.fecha_real_fin || today, listo: true } : base
    })
    persistRequerimientos(nuevos)

    setTareaModal(null); setTareaReqId(null)
    // Al CREAR: abrir WhatsApp directamente (correo de tareas desactivado por ahora).
    if (esNueva) {
      const tel = usuariosSistema.find(u => `${u.nombre} ${u.apellido}`.trim() === tareaFinal.persona_ejecuta)?.celular || ''
      if (isValidPhone(tel)) window.open(buildWhatsAppLink(tel, mensajeWhatsAppTarea(tareaFinal)), '_blank')
      else alert(L(`✅ Tarea ${tareaFinal.codigo} creada y asignada a ${tareaFinal.persona_ejecuta}.\n⚠️ El usuario no tiene celular cargado para notificar por WhatsApp.`, `✅ Task ${tareaFinal.codigo} created and assigned to ${tareaFinal.persona_ejecuta}.\n⚠️ The user has no mobile number on file to notify via WhatsApp.`))
    } else {
      alert(L(`✅ Tarea ${tareaFinal.codigo} actualizada${finalizada ? ' y renglón finalizado (fecha + ✓).' : '.'}`, `✅ Task ${tareaFinal.codigo} updated${finalizada ? ' and row completed (date + ✓).' : '.'}`))
    }
  }

  // ── Vista detalle ──
  if (viewDetail) {
    const o = viewDetail
    const campos: [string, string][] = [
      [L('Nro Oferta', 'Offer No.'), o.nro_oferta], [L('Fecha Registro', 'Registration Date'), o.fecha_registro ? fDate(o.fecha_registro) : '-'],
      [L('Cliente', 'Client'), o.cliente_nombre], [L('Proyecto', 'Project'), o.proyecto], [L('País', 'Country'), etiquetaPais(o.pais)],
      [L('Oportunidad', 'Opportunity'), o.oportunidad_codigo || '-'],
      [L('Fecha Inicio Consultas', 'Inquiry Start Date'), o.fecha_inicio_consultas ? fDate(o.fecha_inicio_consultas) : '-'],
      [L('Fecha Final Consultas', 'Inquiry End Date'), o.fecha_final_consultas ? fDate(o.fecha_final_consultas) : '-'],
      [L('Fecha Presentar Oferta', 'Offer Submission Date'), o.fecha_presentar_oferta ? fDate(o.fecha_presentar_oferta) : '-'],
      [L('Fecha Real Presentación', 'Actual Submission Date'), o.fecha_real_presentacion_oferta ? fDate(o.fecha_real_presentacion_oferta) : '-'],
      [L('Monto Real Oferta', 'Actual Offer Amount'), `${monedaSimbolo(o.tipo_moneda)}${fmtMoney(o.monto_real_oferta || 0)}`],
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
              <h3 style={franja}>{L('DOCUMENTOS EXIGIDOS EN OFERTA', 'DOCUMENTS REQUIRED IN OFFER')} ({(o.documentos_exigidos || []).length})</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={th}>#</th><th style={th}>{L('Documento', 'Document')}</th><th style={th}>{L('Fecha Procesado', 'Processed Date')}</th><th style={th}>{L('Listo', 'Done')}</th></tr></thead>
                <tbody>{(o.documentos_exigidos || []).map((d, i) => (
                  <tr key={d.id}><td style={td}>{i + 1}</td><td style={td}>{d.documento}</td><td style={td}>{d.fecha_procesado ? fDate(d.fecha_procesado) : '—'}</td><td style={td}>{d.listo ? '✓' : '—'}</td></tr>
                ))}</tbody>
              </table>
            </>
          )}
          {(o.requerimientos_iniciales || []).length > 0 && (
            <>
              <h3 style={{ ...franja, background: '#15803d' }}>{L('REQUERIMIENTOS DE DOCUMENTOS', 'DOCUMENT REQUIREMENTS')} ({(o.requerimientos_iniciales || []).length})</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={th}>#</th><th style={th}>{L('Requerimiento', 'Requirement')}</th><th style={th}>{L('Fecha', 'Date')}</th><th style={th}>{L('Listo', 'Done')}</th><th style={th}>{L('Tarea', 'Task')}</th></tr></thead>
                <tbody>{(o.requerimientos_iniciales || []).map((req, i) => {
                  const bloq = reqBloqueado(req)
                  const tc: React.CSSProperties = { ...td, color: '#000000', fontWeight: bloq ? 700 : 400 }
                  return (
                    <tr key={req.id} style={{ background: bloq ? '#bfdbfe' : 'transparent' }}>
                      <td style={tc}>{i + 1}</td><td style={tc}>{req.requerimiento}</td>
                      <td style={tc}>{req.fecha ? fDate(req.fecha) : '—'}</td>
                      <td style={{ ...tc, textAlign: 'center' }}>{req.listo ? '✓' : '—'}</td>
                      <td style={{ ...tc, fontFamily: 'monospace' }}>{req.tarea_codigo || '—'}</td>
                    </tr>
                  )
                })}</tbody>
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
      <ModuleHeader title={L('Seguimiento Oferta', 'Offer Tracking')} subtitle={L('Control y seguimiento de ofertas / licitaciones', 'Control and tracking of offers / tenders')} />

      {!isForm && (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
            {permisos.crear && <button onClick={nuevo} style={{ ...btnStyle, background: '#1e3a8a', color: '#fff' }}>{L('+ Nueva Oferta', '+ New Offer')}</button>}
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={L('Buscar oferta, cliente o proyecto…', 'Search offer, client or project…')} style={{ ...inputStyle, maxWidth: 380 }} />
            {usuarioGlobal && (
              <select value={filtroPais} onChange={e => setFiltroPais(e.target.value)} style={{ ...inputStyle, maxWidth: 200 }}>
                <option value="">🌎 {L('Todos los países', 'All countries')}</option>
                {PAISES_ACTIVOS.map(p => <option key={p.codigo} value={p.codigo}>{p.bandera} {p.nombre}</option>)}
              </select>
            )}
          </div>
          <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{[L('Nro Oferta', 'Offer No.'), L('Fecha', 'Date'), L('Cliente', 'Client'), L('Proyecto', 'Project'), L('Monto', 'Amount'), L('Veredicto', 'Verdict'), L('Situación', 'Status'), L('Acciones', 'Actions')].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td style={td} colSpan={8}>{L('No hay ofertas registradas.', 'No offers recorded.')}</td></tr>
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
                      {permisos.eliminar && <button onClick={() => { if (confirm(L('¿Eliminar esta oferta?', 'Delete this offer?'))) deleteOferta(o.id) }} style={{ ...btnStyle, padding: '4px 10px', fontSize: 12, background: '#dc2626', color: '#fff', marginLeft: 6 }}>{L('Eliminar', 'Delete')}</button>}
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
          <h3 style={franja}>{L('DATOS DE LA OFERTA', 'OFFER DETAILS')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div><label style={lab}>{L('Nro Oferta', 'Offer No.')}</label><input value={selected.nro_oferta} readOnly style={{ ...inputStyle, opacity: 0.6 }} /></div>
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
            <div>
              <label style={lab}>{L('Responsable Técnico', 'Technical Lead')}</label>
              <select value={selected.responsable_tecnico || ''} onChange={e => setSelected({ ...selected, responsable_tecnico: e.target.value })} style={inputStyle}>
                <option value="">{L('Seleccione…', 'Select…')}</option>
                {usuariosActivos.map(u => { const n = `${u.nombre} ${u.apellido}`.trim(); return <option key={u.id} value={n}>{n}{u.cargo ? ` — ${u.cargo}` : ''}</option> })}
              </select>
            </div>
            <div>
              <label style={lab}>{L('Responsable Comercial', 'Commercial Lead')}</label>
              <select value={selected.responsable_comercial || ''} onChange={e => setSelected({ ...selected, responsable_comercial: e.target.value })} style={inputStyle}>
                <option value="">{L('Seleccione…', 'Select…')}</option>
                {usuariosActivos.map(u => { const n = `${u.nombre} ${u.apellido}`.trim(); return <option key={u.id} value={n}>{n}{u.cargo ? ` — ${u.cargo}` : ''}</option> })}
              </select>
            </div>
          </div>

          <h3 style={franja}>{L('CONTROL OFERTA', 'OFFER CONTROL')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div><label style={lab}>{L('Fecha Inicio Consultas', 'Inquiry Start Date')}</label><input type="date" value={selected.fecha_inicio_consultas} onChange={e => setSelected({ ...selected, fecha_inicio_consultas: e.target.value })} style={inputStyle} /></div>
            <div><label style={lab}>{L('Fecha Final Consultas', 'Inquiry End Date')}</label><input type="date" value={selected.fecha_final_consultas} onChange={e => setSelected({ ...selected, fecha_final_consultas: e.target.value })} style={inputStyle} /></div>
            <div><label style={lab}>{L('Fecha Presentar Oferta', 'Offer Submission Date')}</label><input type="date" value={selected.fecha_presentar_oferta} onChange={e => setSelected({ ...selected, fecha_presentar_oferta: e.target.value })} style={inputStyle} /></div>
            <div><label style={lab}>{L('Fecha Real Presentación', 'Actual Submission Date')}</label><input type="date" value={selected.fecha_real_presentacion_oferta} onChange={e => setSelected({ ...selected, fecha_real_presentacion_oferta: e.target.value })} style={inputStyle} /></div>
            <div><label style={lab}>{L('Monto Real Oferta', 'Actual Offer Amount')}</label><input type="number" step="1" min="0" value={selected.monto_real_oferta || ''} onChange={e => setSelected({ ...selected, monto_real_oferta: Math.round(parseFloat(e.target.value)) || 0 })} style={inputStyle} /></div>
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
                {selected.situacion && !refOpt('situacion_oferta').includes(selected.situacion) && <option value={selected.situacion}>{selected.situacion}</option>}
                {refOpt('situacion_oferta').map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={lab}>{L('Observaciones', 'Notes')}</label>
            <textarea value={selected.observaciones} onChange={e => setSelected({ ...selected, observaciones: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          {/* Documentos Exigidos */}
          <h3 style={franja}>{L('DOCUMENTOS EXIGIDOS EN OFERTA', 'DOCUMENTS REQUIRED IN OFFER')} ({(selected.documentos_exigidos || []).length}/20)</h3>
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
            <thead><tr><th style={th}>#</th><th style={th}>{L('Documento', 'Document')}</th><th style={th}>{L('Fecha Procesado', 'Processed Date')}</th><th style={th}>{L('Listo', 'Done')}</th><th style={th}></th></tr></thead>
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
                  <td style={td} colSpan={3}><input value={nuevoDoc} onChange={e => setNuevoDoc(e.target.value)} placeholder={L('Escriba el documento y pulse Agregar…', 'Type the document, then press Add…')} style={{ ...inputStyle, padding: '5px 8px' }} /></td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <button type="button" disabled={!nuevoDoc.trim()} onClick={() => {
                      const txt = nuevoDoc.trim(); if (!txt) return
                      setSelected({ ...selected, documentos_exigidos: [...(selected.documentos_exigidos || []), { id: crypto.randomUUID(), documento: txt, fecha_procesado: '', listo: false, creado_en: new Date().toISOString() }] })
                      setNuevoDoc('')
                    }} style={{ ...btnStyle, padding: '4px 10px', fontSize: 11, background: nuevoDoc.trim() ? '#15803d' : '#cbd5e1', color: '#fff' }}>{L('+ Agregar', '+ Add')}</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* ══════════ REQUERIMIENTOS DE DOCUMENTOS (con Tareas) ══════════ */}
          <h3 style={{ ...franja, background: '#15803d' }}>{L('REQUERIMIENTOS DE DOCUMENTOS', 'DOCUMENT REQUIREMENTS')} ({(selected.requerimientos_iniciales || []).length}/{MAX_REQ})</h3>
          {!selected.id ? (
            <div style={{ padding: 14, background: '#fef9c3', border: '1px solid #eab308', borderRadius: 10, color: '#713f12', fontSize: 13 }}>
              💡 {L('Guarda primero la oferta (botón', 'Save the offer first (')}<b>{L('Guardar', 'Save')}</b>{L(') para habilitar la captura de requerimientos y el botón de Tarea.', ' button) to enable capturing requirements and the Task button.')}
            </div>
          ) : (
            <div style={{ border: '1px solid #1e3a8a', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={th}>#</th><th style={th}>{L('Requerimiento', 'Requirement')}</th><th style={{ ...th, width: 150 }}>{L('Fecha', 'Date')}</th><th style={{ ...th, width: 60, textAlign: 'center' }}>{L('Listo', 'Done')}</th><th style={{ ...th, width: 180, textAlign: 'center' }}>{L('Acción', 'Action')}</th></tr></thead>
                <tbody>
                  {(selected.requerimientos_iniciales || []).map((req, i) => {
                    const bloq = reqBloqueado(req)
                    const tc: React.CSSProperties = { padding: '6px 10px', borderBottom: '1px solid #e2e8f0', color: '#000000', fontSize: 13, fontWeight: bloq ? 700 : 400 }
                    return (
                      <tr key={req.id} style={{ background: bloq ? '#bfdbfe' : (i % 2 === 0 ? 'rgba(21,128,61,0.04)' : 'transparent') }}>
                        <td style={{ ...tc, textAlign: 'center', fontFamily: 'monospace' }}>{i + 1}</td>
                        <td style={tc}>
                          {bloq ? <span>{req.requerimiento || '—'}</span> : <input value={req.requerimiento}
                            onChange={e => setReqLocal((selected.requerimientos_iniciales || []).map(r => r.id === req.id ? { ...r, requerimiento: e.target.value } : r))}
                            onBlur={guardarReqAhora} style={{ ...inputStyle, padding: '6px 10px', color: '#000' }} />}
                        </td>
                        <td style={tc}>
                          {bloq ? <span>{req.fecha ? fDate(req.fecha) : '—'}</span> : <input type="date" value={req.fecha || ''}
                            onChange={e => persistRequerimientos((selected.requerimientos_iniciales || []).map(r => r.id === req.id ? { ...r, fecha: e.target.value } : r))} style={{ ...inputStyle, padding: '6px 10px', color: '#000' }} />}
                        </td>
                        <td style={{ ...tc, textAlign: 'center' }}>
                          {bloq ? <span style={{ fontSize: 16 }}>{req.listo ? '✓' : '—'}</span> : <input type="checkbox" checked={!!req.listo}
                            onChange={e => marcarListoReq(req, e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer' }} />}
                        </td>
                        <td style={{ ...tc, textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
                            {bloq ? (
                              <span title={L('Tarea finalizada: renglón bloqueado', 'Task completed: row locked')} style={{ padding: '3px 8px', borderRadius: 6, background: '#166534', color: '#fff', fontSize: 10, fontWeight: 800, border: '1px solid #14532d', fontFamily: 'monospace' }}>🔒 {req.tarea_codigo} · {L('Finalizada', 'Completed')}</span>
                            ) : req.tarea_codigo ? (
                              <>
                                <button type="button" onClick={() => abrirTareaExistente(req)} title={L('Abrir y actualizar la tarea', 'Open and update the task')} style={{ ...btnStyle, padding: '4px 10px', fontSize: 11, background: '#1d4ed8', color: '#fff', fontWeight: 700 }}>✎ {req.tarea_codigo}</button>
                                <button type="button" title={L('Eliminar renglón', 'Delete row')} onClick={() => { if (confirm(L('¿Eliminar este requerimiento?', 'Delete this requirement?'))) eliminarRequerimiento(req.id) }} style={{ ...btnStyle, padding: '4px 8px', fontSize: 11, background: '#dc2626', color: '#fff' }}>✕</button>
                              </>
                            ) : (
                              <>
                                <button type="button" onClick={() => abrirTareaDesdeReq(req)} style={{ ...btnStyle, padding: '4px 10px', fontSize: 11, background: '#14532d', color: '#fff', fontWeight: 800 }}>→ {L('Tarea', 'Task')}</button>
                                <button type="button" title={L('Eliminar renglón', 'Delete row')} onClick={() => { if (confirm(L('¿Eliminar este requerimiento?', 'Delete this requirement?'))) eliminarRequerimiento(req.id) }} style={{ ...btnStyle, padding: '4px 8px', fontSize: 11, background: '#dc2626', color: '#fff' }}>✕</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {(selected.requerimientos_iniciales || []).length < MAX_REQ && (
                    <tr style={{ background: 'rgba(34,197,94,0.06)' }}>
                      <td style={{ ...td, textAlign: 'center', fontFamily: 'monospace' }}>{(selected.requerimientos_iniciales || []).length + 1}</td>
                      <td style={td}><input value={nuevoReqTexto} onChange={e => setNuevoReqTexto(e.target.value)} placeholder={L('Escriba el requerimiento y pulse Agregar (o Enter)…', 'Type the requirement, then press Add (or Enter)…')} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarRequerimiento() } }} style={{ ...inputStyle, padding: '6px 10px', color: '#000' }} /></td>
                      <td style={td}><input type="date" value={nuevoReqFecha} onChange={e => setNuevoReqFecha(e.target.value)} style={{ ...inputStyle, padding: '6px 10px', color: '#000' }} /></td>
                      <td style={{ ...td, textAlign: 'center', color: '#94a3b8' }}>—</td>
                      <td style={{ ...td, textAlign: 'center' }}><button type="button" disabled={!nuevoReqTexto.trim()} onClick={agregarRequerimiento} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: nuevoReqTexto.trim() ? '#15803d' : 'rgba(148,163,184,0.4)', color: '#fff', cursor: nuevoReqTexto.trim() ? 'pointer' : 'not-allowed' }}>{L('+ Agregar', '+ Add')}</button></td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div style={{ padding: '8px 12px', background: '#f0fdf4', color: '#15803d', fontSize: 11, borderTop: '1px solid #dcfce7' }}>
                💾 {L('Cada renglón se guarda automáticamente. El botón', 'Each row is saved automatically. The')} <b>→ {L('Tarea', 'Task')}</b> {L('(verde) asigna la actividad a una persona (Origen: Seguimiento Oferta); cuando esa Tarea se marca', '(green) button assigns the activity to a person (Source: Offer Tracking); when that Task is marked')} <b>{L('Finalizada', 'Completed')}</b>{L(', este renglón se cierra solo (fecha + ✓) y queda bloqueado.', ', this row closes itself (date + ✓) and becomes locked.')}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="submit" style={{ ...btnStyle, background: '#1e3a8a', color: '#fff' }}>{L('Guardar', 'Save')}</button>
            <button type="button" onClick={() => { setIsForm(false); setSelected(null) }} style={{ ...btnStyle, background: '#64748b', color: '#fff' }}>{L('Cancelar', 'Cancel')}</button>
          </div>
        </form>
      )}

      {/* ══ MODAL: Nueva/Actualizar Tarea desde un requerimiento de oferta ══ */}
      {tareaModal && (
        <div onClick={() => { setTareaModal(null); setTareaReqId(null) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 560, border: '1px solid #1e3a8a', maxHeight: '92vh', overflowY: 'auto' }}>
            <h3 style={{ color: '#013978', fontSize: 17, fontWeight: 700, marginBottom: 4 }}>🗒️ {tareaModal.id ? L('Actualizar Tarea', 'Update Task') : L('Nueva Tarea desde Oferta', 'New Task from Offer')}</h3>
            <p style={{ color: '#64748b', fontSize: 12, marginBottom: 16 }}>{L('Origen', 'Source')}: <b>{L('Seguimiento Oferta', 'Offer Tracking')}</b> · {L('N°', 'No.')} <b style={{ fontFamily: 'monospace' }}>{tareaModal.origen_codigo}</b> · {L('Consecutivo Tarea', 'Task No.')} <b style={{ fontFamily: 'monospace' }}>{tareaModal.codigo}</b></p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div><label style={lab}>{L('Cliente (de la oferta)', 'Client (from the offer)')}</label><input value={tareaModal.cliente_nombre || ''} readOnly style={{ ...inputStyle, opacity: 0.8, background: '#f1f5f9' }} /></div>
              <div><label style={lab}>{L('Situación', 'Status')}</label>
                <select value={tareaModal.situacion} onChange={e => setTareaModal({ ...tareaModal, situacion: e.target.value })} style={inputStyle}>
                  {['Pendiente', 'En Proceso', 'Finalizada', 'Cancelada', 'Anulada'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: 'span 2' }}><label style={lab}>{L('Proyecto (de la oferta)', 'Project (from the offer)')}</label><input value={tareaModal.proyecto || ''} readOnly style={{ ...inputStyle, opacity: 0.8, background: '#f1f5f9' }} /></div>
              <div><label style={lab}>{L('Persona que asigna *', 'Assigned by *')}</label>
                <select value={tareaModal.persona_asigna} onChange={e => setTareaModal({ ...tareaModal, persona_asigna: e.target.value })} style={inputStyle}>
                  <option value="">{L('Seleccionar usuario...', 'Select user...')}</option>
                  {tareaModal.persona_asigna && !usuariosActivos.some(u => `${u.nombre} ${u.apellido}`.trim() === tareaModal.persona_asigna) && <option value={tareaModal.persona_asigna}>{tareaModal.persona_asigna}</option>}
                  {usuariosActivos.map(u => { const n = `${u.nombre} ${u.apellido}`.trim(); return <option key={u.id} value={n}>{n}</option> })}
                </select>
              </div>
              <div><label style={lab}>{L('Persona que ejecuta *', 'Assignee *')}</label>
                <select value={tareaModal.persona_ejecuta} onChange={e => setTareaModal({ ...tareaModal, persona_ejecuta: e.target.value })} style={inputStyle}>
                  <option value="">{L('Seleccionar usuario...', 'Select user...')}</option>
                  {tareaModal.persona_ejecuta && !usuariosActivos.some(u => `${u.nombre} ${u.apellido}`.trim() === tareaModal.persona_ejecuta) && <option value={tareaModal.persona_ejecuta}>{tareaModal.persona_ejecuta}</option>}
                  {usuariosActivos.map(u => { const n = `${u.nombre} ${u.apellido}`.trim(); return <option key={u.id} value={n}>{n}</option> })}
                </select>
              </div>
              <div><label style={lab}>{L('Fecha requerida fin *', 'Required end date *')}</label><input type="date" value={tareaModal.fecha_requerida_fin} onChange={e => setTareaModal({ ...tareaModal, fecha_requerida_fin: e.target.value })} style={inputStyle} /></div>
              <div style={{ gridColumn: 'span 2' }}><label style={lab}>{L('Descripción de la actividad *', 'Activity description *')}</label><textarea value={tareaModal.descripcion} onChange={e => setTareaModal({ ...tareaModal, descripcion: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="button" onClick={guardarTareaModal} style={{ ...btnStyle, background: '#15803d', color: '#fff' }}>{tareaModal.id ? L('Actualizar Tarea y volver', 'Update Task and go back') : L('Guardar Tarea y volver', 'Save Task and go back')}</button>
              <button type="button" onClick={() => { setTareaModal(null); setTareaReqId(null) }} style={{ ...btnStyle, background: '#64748b', color: '#fff' }}>{L('Cancelar', 'Cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
