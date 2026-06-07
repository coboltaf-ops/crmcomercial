'use client'
import { logAudit, computarDiff } from '@/shared/lib/audit'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import ModuleHeader from '@/shared/components/module-header'
import EnviarCorreoModal from '@/shared/components/enviar-correo-modal'
import { useOportunidadesStore, Oportunidad, DocumentoExigido } from '@/features/oportunidades/store/oportunidades-store'
import { useClientesStore } from '@/features/clientes/store/clientes-store'
import { useContactosStore } from '@/features/contactos/store/contactos-store'
import { buildWhatsAppLink, isValidPhone } from '@/shared/lib/whatsapp'
import { useReferenceStore } from '@/features/referencias/store/reference-store'
import { useCurrentUserStore } from '@/features/usuarios-gestion/store/current-user-store'
import { usePermisos } from '@/shared/hooks/use-permisos'
import { fmtMoney, monedaSimbolo } from '@/shared/lib/format-number'
import { fDate, todayColombia } from '@/shared/lib/format-date'
import { nextConsecutivo } from '@/shared/lib/consecutivo'
import ReportPanel from '@/shared/components/report-panel'
import SeguimientoPanel from '@/shared/components/seguimiento-panel'
import DocumentosPanel from '@/shared/components/documentos-panel'
import { Seguimiento } from '@/shared/types/seguimiento'
import { useT, useIdioma, useTStatus } from '@/shared/i18n/use-t'

const today = todayColombia()

const emptyOportunidad = (codigo: string, responsable: string): Oportunidad => ({
  id: '', codigo,
  proyecto: '', cliente_id: '', cliente_nombre: '',
  contacto_id: '', contacto_nombre: '',
  ciudad: '', pais: '', fecha_presupuesto: today, monto_estimado: 0, estimado_cop: 0,
  tipo_moneda: 'Pesos Colombianos', situacion: 'Abierta',
  probable_pct: 0, adjudicacion: '', mgc: 0,
  ejecucion_anyo_pct: 0, parcial_euros_anyo: 0,
  fecha_inicio_consultas: '', fecha_final_consultas: '',
  fecha_presentar_oferta: '', fecha_real_presentacion_oferta: '',
  monto_real_oferta: 0, fecha_esperada_veredicto: '',
  veredicto: 'Pendiente', empresa_ganadora: '',
  responsable, observaciones: '',
  fecha_registro: today, codigo_interno: '', seguimientos: [],
  documentos_exigidos: [],
})

export default function OportunidadesPage() {
  const t = useT()
  const ts = useTStatus()
  const idioma = useIdioma()
  const permisos = usePermisos('oportunidades')
  const currentUser = useCurrentUserStore(s => s.user)
  const { oportunidades, addOportunidad, updateOportunidad, deleteOportunidad } = useOportunidadesStore()
  const clientes = useClientesStore(s => s.clientes).filter(c => {
    const sit = (c.situacion || '').trim().toLowerCase()
    return sit === 'activo' || sit === 'prospectando' || sit === 'prospecto'
  })
  const allClientes = useClientesStore(s => s.clientes)
  const allContactos = useContactosStore(s => s.contactos)
  const refData = useReferenceStore(s => s.data)

  const [selected, setSelected] = useState<Oportunidad | null>(null)
  const [isForm, setIsForm] = useState(false)
  const [viewDetail, setViewDetail] = useState<Oportunidad | null>(null)
  const [correoModal, setCorreoModal] = useState<{ to: string; ref: string } | null>(null)
  const [tab, setTab] = useState<'registros' | 'reportes'>('registros')
  const [search, setSearch] = useState('')
  const [nuevoDocTexto, setNuevoDocTexto] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const openId = searchParams.get('open')
    if (openId) {
      const op = oportunidades.find(o => o.id === openId)
      if (op) setViewDetail(op)
    }
  }, [searchParams, oportunidades])

  const auditParams = () => ({
    usuario: currentUser?.usuario || 'desconocido',
    usuario_nombre: `${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`.trim(),
    rol: currentUser?.rol || '',
    modulo: 'oportunidades',
  })

  const filtered = oportunidades.filter(o =>
    !search || o.proyecto.toLowerCase().includes(search.toLowerCase()) ||
    o.codigo.toLowerCase().includes(search.toLowerCase()) ||
    o.cliente_nombre.toLowerCase().includes(search.toLowerCase())
  )

  // Cálculos derivados
  const calcDerivados = (o: Pick<Oportunidad, 'monto_estimado' | 'probable_pct' | 'ejecucion_anyo_pct' | 'mgc' | 'parcial_euros_anyo'>) => {
    const parcial_probable = (o.monto_estimado || 0) * (o.probable_pct || 0) / 100
    const parcial_anyo = parcial_probable * (o.ejecucion_anyo_pct || 0) / 100
    const mg_parcial_anyo = parcial_anyo * (o.mgc || 0) / 100
    const mg_parcial_euros_anyo = (o.parcial_euros_anyo || 0) * (o.mgc || 0) / 100
    return { parcial_probable, parcial_anyo, mg_parcial_anyo, mg_parcial_euros_anyo }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    const cli = allClientes.find(c => c.id === selected.cliente_id)
    const toSave = { ...selected, cliente_nombre: cli?.razon_social || selected.cliente_nombre }
    if (toSave.id) {
      const _anterior = oportunidades.find(x => x.id === toSave.id)
      updateOportunidad(toSave.id, toSave)
      logAudit({ ...auditParams(), accion: 'MODIFICAR', registro_codigo: toSave.codigo, registro_nombre: toSave.proyecto, detalle: computarDiff(_anterior as unknown as Record<string, unknown>, toSave as unknown as Record<string, unknown>) })
    } else {
      addOportunidad({ ...toSave, id: crypto.randomUUID(), fecha_registro: today, creado_por: `${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`.trim() || (currentUser?.usuario || 'desconocido'), creado_en: today })
      logAudit({ ...auditParams(), accion: 'CREAR', registro_codigo: toSave.codigo, registro_nombre: toSave.proyecto })
    }
    setIsForm(false); setSelected(null)
  }

  const statusStyle = (s: string): React.CSSProperties => {
    const map: Record<string, React.CSSProperties> = {
      'Abierta': { background: 'transparent', color: '#10b981', border: '1px solid #10b981' },
      'En Negociación': { background: 'transparent', color: '#f59e0b', border: '1px solid #f59e0b' },
      'Ganada': { background: 'transparent', color: '#059669', border: '1px solid #059669' },
      'Perdida': { background: 'transparent', color: '#dc2626', border: '1px solid #dc2626' },
    }
    return map[s] || {}
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, background: '#ffffff', border: '1px solid #1e3a8a', color: '#1e3a8a', fontWeight: 600, fontSize: 13, outline: 'none' }
  const inputReadonly: React.CSSProperties = { ...inputStyle, opacity: 0.7, background: '#ffffff' }
  const btnStyle: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }
  const tabBtnStyle = (active: boolean): React.CSSProperties => ({ ...btnStyle, background: active ? '#1e3a8a' : 'rgba(255,255,255,0.15)', color: active ? '#ffffff' : '#0f172a', border: active ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.2)' })
  const refOptions = (table: string) => (refData[table as keyof typeof refData] || []).filter(r => r.situacion).map(r => r.descripcion)
  const sectionTitle = (color = '#1d4ed8'): React.CSSProperties => ({ color: '#ffffff', fontSize: 12, fontWeight: 700, background: color, padding: '6px 10px', borderRadius: 6, marginBottom: 14, letterSpacing: 0.5, textAlign: 'center' as const })

  // ── VIEW DETAIL ──
  if (viewDetail) {
    const der = calcDerivados(viewDetail)
    return (
      <div>
        <button onClick={() => { const back = searchParams.get('back'); if (back) { router.push(back); return } setViewDetail(null) }} style={{ ...btnStyle, background: '#000000', color: '#ffffff', border: '1px solid #333333', marginBottom: 16 }}>{t('btn.volver')}</button>
        <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, border: '1px solid #1e3a8a' }}>
          <h2 style={{ color: '#013978', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{viewDetail.codigo} — {viewDetail.proyecto}</h2>

          <h3 className="seccion-franja" style={sectionTitle('#1e3a8a')}>{t('lbl.datosPrincipales')}</h3>
          {(() => {
            const cli = allClientes.find(x => x.id === viewDetail.cliente_id)
              || allClientes.find(x => (x.razon_social || '').trim().toUpperCase() === (viewDetail.cliente_nombre || '').trim().toUpperCase())
            const sit = (cli?.situacion || '').trim().toLowerCase()
            const isProspectando = sit.includes('prosp')
            const clienteNode = (
              <span>
                {viewDetail.cliente_nombre}
                {isProspectando && <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 12, background: '#facc15', color: '#1f2937', fontSize: 11, fontWeight: 700, border: '1px solid #eab308' }}>Prospectando</span>}
              </span>
            )
            const fields: { l: string; v: React.ReactNode }[] = [
              { l: t('lbl.nroOportunidad'), v: viewDetail.codigo },
              { l: t('lbl.fechaRegistro'), v: fDate(viewDetail.fecha_registro) },
              { l: t('lbl.codigo'), v: viewDetail.codigo_interno || '-' },
              { l: t('lbl.cliente'), v: clienteNode },
              { l: t('lbl.ciudad'), v: viewDetail.ciudad || '-' },
              { l: t('lbl.pais'), v: viewDetail.pais || '-' },
              { l: 'Estimado COP', v: `$${fmtMoney(viewDetail.estimado_cop || 0)}` },
              { l: 'Estimado USA', v: `$${fmtMoney(viewDetail.monto_estimado || 0)}` },
              { l: t('lbl.situacion'), v: viewDetail.situacion },
              { l: t('lbl.responsable'), v: viewDetail.responsable },
              { l: 'Creado por', v: viewDetail.creado_por ? `${viewDetail.creado_por}${viewDetail.creado_en ? ` · ${viewDetail.creado_en}` : ''}` : '—' },
            ]
            return (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
                {fields.map(f => (
                  <div key={f.l}>
                    <p style={{ color: '#013978', fontSize: 16, fontWeight: 900, marginBottom: 4 }}>{f.l}</p>
                    <p style={{ color: '#013978', fontSize: 14 }}>{f.v || '—'}</p>
                  </div>
                ))}
              </div>
            )
          })()}

          <h3 className="seccion-franja" style={sectionTitle()}>{idioma === 'en' ? 'PROBABILITY AND AWARD' : 'PROBABILIDAD Y ADJUDICACIÓN'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
            {[
              { l: t('lbl.probabilidad'), v: `${viewDetail.probable_pct || 0}%` },
              { l: idioma === 'en' ? 'Probable Partial' : 'Parcial Probable', v: `${monedaSimbolo(viewDetail.tipo_moneda)}${fmtMoney(der.parcial_probable)}` },
              { l: t('lbl.adjudicacion'), v: viewDetail.adjudicacion || '-' },
              { l: t('lbl.mgc'), v: `${(viewDetail.mgc || 0).toFixed(2)}%` },
              { l: t('lbl.ejecucionAnyo'), v: `${viewDetail.ejecucion_anyo_pct || 0}%` },
              { l: idioma === 'en' ? 'Year Partial' : 'Parcial Año', v: `${monedaSimbolo(viewDetail.tipo_moneda)}${fmtMoney(der.parcial_anyo)}` },
              { l: t('lbl.parcialEuros'), v: `€${fmtMoney(viewDetail.parcial_euros_anyo || 0)}` },
              { l: idioma === 'en' ? 'MG Year Partial' : 'MG Parcial Año', v: `${monedaSimbolo(viewDetail.tipo_moneda)}${fmtMoney(der.mg_parcial_anyo)}` },
              { l: idioma === 'en' ? 'MG EUR Partial' : 'MG Parcial EUR', v: `€${fmtMoney(der.mg_parcial_euros_anyo)}` },
            ].map(f => (
              <div key={f.l}>
                <p style={{ color: '#013978', fontSize: 16, fontWeight: 900, marginBottom: 4 }}>{f.l}</p>
                <p style={{ color: '#013978', fontSize: 14 }}>{f.v || '—'}</p>
              </div>
            ))}
          </div>

          <h3 className="seccion-franja" style={sectionTitle()}>{t('lbl.controlOferta')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
            {[
              { l: t('lbl.fechaInicioConsultas'), v: viewDetail.fecha_inicio_consultas ? fDate(viewDetail.fecha_inicio_consultas) : '-' },
              { l: t('lbl.fechaFinalConsultas'), v: viewDetail.fecha_final_consultas ? fDate(viewDetail.fecha_final_consultas) : '-' },
              { l: t('lbl.fechaPresentarOferta'), v: viewDetail.fecha_presentar_oferta ? fDate(viewDetail.fecha_presentar_oferta) : '-' },
              { l: t('lbl.fechaRealPresentacion'), v: viewDetail.fecha_real_presentacion_oferta ? fDate(viewDetail.fecha_real_presentacion_oferta) : '-' },
              { l: t('lbl.montoRealOferta'), v: `${monedaSimbolo(viewDetail.tipo_moneda)}${fmtMoney(viewDetail.monto_real_oferta || 0)}` },
              { l: t('lbl.fechaEsperadaVeredicto'), v: viewDetail.fecha_esperada_veredicto ? fDate(viewDetail.fecha_esperada_veredicto) : '-' },
              { l: t('lbl.veredicto'), v: viewDetail.veredicto || '-' },
              { l: t('lbl.empresaGanadora'), v: viewDetail.empresa_ganadora || '-' },
            ].map(f => (
              <div key={f.l}>
                <p style={{ color: '#013978', fontSize: 16, fontWeight: 900, marginBottom: 4 }}>{f.l}</p>
                <p style={{ color: '#013978', fontSize: 14 }}>{f.v || '—'}</p>
              </div>
            ))}
          </div>

          {viewDetail.observaciones && (
            <div style={{ marginTop: 4, padding: 14, background: '#ffffff', borderRadius: 10, border: '1px solid #1e3a8a' }}>
              <p style={{ color: '#013978', fontSize: 11, marginBottom: 4 }}>Observaciones</p>
              <p style={{ color: '#013978', fontSize: 13 }}>{viewDetail.observaciones}</p>
            </div>
          )}

          {(viewDetail.documentos_exigidos || []).length > 0 && (
            <div style={{ marginTop: 16, borderRadius: 10, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
              <div className="seccion-franja" style={{ background: '#1e3a8a', padding: '8px 12px', color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>
                DOCUMENTOS EXIGIDOS EN OFERTA ({(viewDetail.documentos_exigidos || []).length})
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '6px 10px', background: '#0f1b3d', color: '#fff', fontSize: 11, textAlign: 'center', width: 40 }}>#</th>
                    <th style={{ padding: '6px 10px', background: '#0f1b3d', color: '#fff', fontSize: 11, textAlign: 'left' }}>Documento</th>
                    <th style={{ padding: '6px 10px', background: '#0f1b3d', color: '#fff', fontSize: 11, textAlign: 'left', width: 130 }}>Fecha Procesado</th>
                    <th style={{ padding: '6px 10px', background: '#0f1b3d', color: '#fff', fontSize: 11, textAlign: 'center', width: 70 }}>Listo</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewDetail.documentos_exigidos || []).map((d, i) => (
                    <tr key={d.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                      <td style={{ padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#013978', fontSize: 12, textAlign: 'center', fontFamily: 'monospace' }}>{i + 1}</td>
                      <td style={{ padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#013978', fontSize: 13 }}>{d.documento}</td>
                      <td style={{ padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#013978', fontSize: 12 }}>{d.fecha_procesado ? fDate(d.fecha_procesado) : '—'}</td>
                      <td style={{ padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', color: d.listo ? '#86efac' : 'rgba(255,255,255,0.4)', fontSize: 14 }}>{d.listo ? '✓' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {permisos.editar && (
            <button onClick={() => { setSelected(viewDetail); setIsForm(true); setViewDetail(null) }} style={{ ...btnStyle, background: '#2563eb', color: '#ffffff', border: '1px solid #3b82f6', marginTop: 16 }}>{t('btn.editar')}</button>
          )}

          <SeguimientoPanel
            seguimientos={viewDetail.seguimientos || []}
            usuario={`${currentUser?.nombre} ${currentUser?.apellido}`}
            situacionActual={viewDetail.situacion}
            situacionOpciones={refOptions('situacion_oportunidad')}
            onAdd={(seg: Seguimiento) => {
              const updated = { ...viewDetail, situacion: seg.situacion, seguimientos: [...(viewDetail.seguimientos || []), seg] }
              updateOportunidad(viewDetail.id, updated)
              setViewDetail(updated)
              logAudit({ ...auditParams(), accion: 'SEGUIMIENTO', registro_codigo: viewDetail.codigo, registro_nombre: viewDetail.proyecto, detalle: `Situación: ${seg.situacion} · ${seg.detalle}` })
            }}
          />
          <DocumentosPanel modulo="oportunidades" registroId={viewDetail.id} />
        </div>
      </div>
    )
  }

  // ── FORM ──
  if (isForm && selected) {
    const der = calcDerivados(selected)
    return (
      <div>
        <button onClick={() => { setIsForm(false); setSelected(null) }} style={{ ...btnStyle, background: '#000000', color: '#ffffff', border: '1px solid #333333', marginBottom: 16 }}>{t('btn.volver')}</button>
        <form onSubmit={handleSave} style={{ background: '#ffffff', borderRadius: 16, padding: 24, border: '1px solid #1e3a8a' }}>
          <h2 style={{ color: '#013978', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{selected.id ? t('fmt.editarOportunidad') : t('fmt.nuevaOportunidad')}</h2>

          {/* DATOS PRINCIPALES */}
          <h3 className="seccion-franja" style={sectionTitle('#1e3a8a')}>{t('lbl.datosPrincipales')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.nroOportunidad')} *</label>
              <input value={selected.codigo} readOnly style={{ ...inputStyle, opacity: 0.5 }} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.fechaRegistro')}</label>
              <input value={fDate(selected.fecha_registro || today)} readOnly style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.codigo')}</label>
              <input value={selected.codigo_interno} onChange={e => setSelected({ ...selected, codigo_interno: e.target.value.toUpperCase() })} style={inputStyle} />
            </div>
            <div style={{ gridColumn: 'span 4' }}>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.cliente')} *</label>
              <select value={selected.cliente_id} onChange={e => {
                const cli = allClientes.find(c => c.id === e.target.value)
                setSelected({ ...selected, cliente_id: e.target.value, cliente_nombre: cli?.razon_social || '' })
              }} required style={inputStyle}>
                <option value="">Seleccionar cliente...</option>
                {(() => {
                  const visibles = [...clientes]
                  if (selected.cliente_id && !visibles.find(c => c.id === selected.cliente_id)) {
                    const orig = allClientes.find(c => c.id === selected.cliente_id)
                    if (orig) visibles.unshift(orig)
                  }
                  return visibles.map(c => {
                    const sit = (c.situacion || '').trim().toLowerCase()
                    const isProsp = sit === 'prospectando' || sit === 'prospecto'
                    const isInact = sit !== 'activo' && !isProsp
                    const suf = isProsp ? ' ⚠️ PROSPECTANDO' : isInact ? ' (Inactivo)' : ''
                    const optStyle: React.CSSProperties = isProsp
                      ? { background: '#facc15', color: '#1f2937', fontWeight: 800 }
                      : {}
                    return <option key={c.id} value={c.id} style={optStyle}>{c.razon_social}{suf}</option>
                  })
                })()}
              </select>
            </div>
            <div style={{ gridColumn: 'span 4' }}>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.proyecto')} *</label>
              <textarea value={selected.proyecto} onChange={e => setSelected({ ...selected, proyecto: e.target.value.toUpperCase() })} required rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.ciudad')}</label>
              <select value={selected.ciudad} onChange={e => setSelected({ ...selected, ciudad: e.target.value })} style={inputStyle}>
                <option value="">{t("campo.seleccionar")}</option>
                {refOptions('ciudad').map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.pais')}</label>
              <select value={selected.pais} onChange={e => setSelected({ ...selected, pais: e.target.value })} style={inputStyle}>
                <option value="">{t("campo.seleccionar")}</option>
                {refOptions('pais').map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Estimado COP *</label>
              <input type="number" step="0.01" min="0" value={selected.estimado_cop || ''} onChange={e => setSelected({ ...selected, estimado_cop: parseFloat(e.target.value) || 0 })} required style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Estimado USA *</label>
              <input type="number" step="0.01" min="0" value={selected.monto_estimado || ''} onChange={e => setSelected({ ...selected, monto_estimado: parseFloat(e.target.value) || 0 })} required style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.situacion')} *</label>
              <select value={selected.situacion} onChange={e => setSelected({ ...selected, situacion: e.target.value })} required style={inputStyle}>
                {refOptions('situacion_oportunidad').map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.responsable')}</label>
              <input value={selected.responsable} onChange={e => setSelected({ ...selected, responsable: e.target.value })} style={inputStyle} />
            </div>
          </div>

          {/* PROBABILIDAD Y ADJUDICACIÓN */}
          <h3 className="seccion-franja" style={sectionTitle()}>{idioma === 'en' ? 'PROBABILITY AND AWARD' : 'PROBABILIDAD Y ADJUDICACIÓN'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.probabilidad')} *</label>
              <input type="number" step="0.01" min="0" max="100" value={selected.probable_pct} onChange={e => setSelected({ ...selected, probable_pct: parseFloat(e.target.value) || 0 })} required style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.parcialDolarProbable')}</label>
              <input value={fmtMoney(der.parcial_probable)} readOnly style={inputReadonly} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.adjudicacionMMAAAA')} *</label>
              <input value={selected.adjudicacion} onChange={e => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
                let mm = digits.slice(0, 2)
                const yyyy = digits.slice(2, 6)
                if (mm.length === 2) {
                  const n = parseInt(mm, 10)
                  if (n < 1) mm = '01'
                  else if (n > 12) mm = '12'
                }
                const formatted = yyyy ? `${mm}/${yyyy}` : mm
                setSelected({ ...selected, adjudicacion: formatted })
              }} placeholder="MM/AAAA" maxLength={7} inputMode="numeric" style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.mgc')} *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="999.99"
                value={selected.mgc}
                onChange={e => setSelected({ ...selected, mgc: parseFloat(e.target.value) || 0 })}
                onBlur={e => {
                  const n = parseFloat(e.target.value) || 0
                  const capped = Math.min(Math.max(n, 0), 999.99)
                  setSelected({ ...selected, mgc: parseFloat(capped.toFixed(2)) })
                }}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.ejecucionAnyo')} *</label>
              <input type="number" step="1" min="0" max="100" value={selected.ejecucion_anyo_pct} onChange={e => setSelected({ ...selected, ejecucion_anyo_pct: parseFloat(e.target.value) || 0 })} required style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{idioma === 'en' ? 'Year Partial $' : 'Parcial Año $'}</label>
              <input value={fmtMoney(der.parcial_anyo)} readOnly style={inputReadonly} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{idioma === 'en' ? 'Year Partial €' : 'Parcial Año €'} *</label>
              <input type="number" step="0.01" min="0" value={selected.parcial_euros_anyo} onChange={e => setSelected({ ...selected, parcial_euros_anyo: parseFloat(e.target.value) || 0 })} required style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{idioma === 'en' ? 'MG Year Partial $' : 'MG Parcial Año $'}</label>
              <input value={fmtMoney(der.mg_parcial_anyo)} readOnly style={inputReadonly} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{idioma === 'en' ? 'MG Partial €' : 'MG Parcial €'}</label>
              <input value={fmtMoney(der.mg_parcial_euros_anyo)} readOnly style={inputReadonly} />
            </div>
          </div>

          {/* CONTROL DE OFERTA */}
          <h3 className="seccion-franja" style={sectionTitle()}>{t('lbl.controlOferta')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.fechaInicioConsultas')}</label>
              <input type="date" value={selected.fecha_inicio_consultas} onChange={e => setSelected({ ...selected, fecha_inicio_consultas: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.fechaFinalConsultas')}</label>
              <input type="date" value={selected.fecha_final_consultas} onChange={e => setSelected({ ...selected, fecha_final_consultas: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.fechaPresentarOferta')}</label>
              <input type="date" value={selected.fecha_presentar_oferta} onChange={e => setSelected({ ...selected, fecha_presentar_oferta: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.fechaRealPresentacion')}</label>
              <input type="date" value={selected.fecha_real_presentacion_oferta} onChange={e => setSelected({ ...selected, fecha_real_presentacion_oferta: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.montoRealOferta')}</label>
              <input type="number" step="0.01" min="0" value={selected.monto_real_oferta} onChange={e => setSelected({ ...selected, monto_real_oferta: parseFloat(e.target.value) || 0 })} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.fechaEsperadaVeredicto')}</label>
              <input type="date" value={selected.fecha_esperada_veredicto} onChange={e => setSelected({ ...selected, fecha_esperada_veredicto: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.veredicto')}</label>
              <select value={selected.veredicto} onChange={e => setSelected({ ...selected, veredicto: e.target.value })} style={inputStyle}>
                {refOptions('veredicto_oferta').map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.empresaGanadora')}</label>
              <input value={selected.empresa_ganadora} onChange={e => setSelected({ ...selected, empresa_ganadora: e.target.value })} style={inputStyle} />
            </div>
          </div>

          {/* Sección Documentos Exigidos en Oferta */}
          <h3 className="seccion-franja" style={{ color: '#ffffff', fontSize: 12, fontWeight: 700, background: '#1e3a8a', padding: '6px 10px', borderRadius: 6, marginBottom: 14, letterSpacing: 0.5, textAlign: 'center' }}>
            DOCUMENTOS EXIGIDOS EN OFERTA ({(selected.documentos_exigidos || []).length}/20)
          </h3>
          <div style={{ borderRadius: 10, border: '1px solid #1e3a8a', overflow: 'hidden', marginBottom: 14 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px 10px', background: '#0f1b3d', color: '#fff', fontSize: 11, textAlign: 'center', width: 40 }}>#</th>
                  <th style={{ padding: '8px 10px', background: '#0f1b3d', color: '#fff', fontSize: 11, textAlign: 'left' }}>Documento</th>
                  <th style={{ padding: '8px 10px', background: '#0f1b3d', color: '#fff', fontSize: 11, textAlign: 'left', width: 160 }}>Fecha Procesado</th>
                  <th style={{ padding: '8px 10px', background: '#0f1b3d', color: '#fff', fontSize: 11, textAlign: 'center', width: 70 }}>Listo</th>
                  <th style={{ padding: '8px 10px', background: '#0f1b3d', color: '#fff', fontSize: 11, textAlign: 'center', width: 100 }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {(selected.documentos_exigidos || []).map((doc, i) => (
                  <tr key={doc.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#013978', fontSize: 12, textAlign: 'center', fontFamily: 'monospace' }}>{i + 1}</td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <input value={doc.documento} readOnly title="Documento bloqueado tras crearse" style={{ ...inputStyle, opacity: 0.7, cursor: 'not-allowed', padding: '6px 10px' }} />
                    </td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <input type="date" value={doc.fecha_procesado} onChange={e => {
                        const nuevos = (selected.documentos_exigidos || []).map(d => d.id === doc.id ? { ...d, fecha_procesado: e.target.value } : d)
                        setSelected({ ...selected, documentos_exigidos: nuevos })
                      }} style={{ ...inputStyle, padding: '6px 10px' }} />
                    </td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                      <input type="checkbox" checked={doc.listo} onChange={e => {
                        const nuevos = (selected.documentos_exigidos || []).map(d => d.id === doc.id ? { ...d, listo: e.target.checked } : d)
                        setSelected({ ...selected, documentos_exigidos: nuevos })
                      }} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                    </td>
                    <td style={{ padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                      🔒 bloqueado
                    </td>
                  </tr>
                ))}
                {(selected.documentos_exigidos || []).length < 20 && (
                  <tr style={{ background: 'rgba(34,197,94,0.05)' }}>
                    <td style={{ padding: '6px 10px', borderTop: '1px solid rgba(34,197,94,0.2)', color: '#013978', fontSize: 12, textAlign: 'center', fontFamily: 'monospace' }}>{(selected.documentos_exigidos || []).length + 1}</td>
                    <td style={{ padding: '6px 10px', borderTop: '1px solid rgba(34,197,94,0.2)' }}>
                      <input
                        value={nuevoDocTexto}
                        onChange={e => setNuevoDocTexto(e.target.value)}
                        placeholder="Escriba el documento exigido y pulse Agregar..."
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            const txt = nuevoDocTexto.trim()
                            if (!txt) return
                            const nuevo: DocumentoExigido = {
                              id: crypto.randomUUID(),
                              documento: txt,
                              fecha_procesado: '',
                              listo: false,
                              creado_en: new Date().toISOString(),
                              creado_por: `${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`.trim() || (currentUser?.usuario || 'desconocido'),
                            }
                            setSelected({ ...selected, documentos_exigidos: [...(selected.documentos_exigidos || []), nuevo] })
                            setNuevoDocTexto('')
                          }
                        }}
                        style={{ ...inputStyle, padding: '6px 10px' }}
                      />
                    </td>
                    <td style={{ padding: '6px 10px', borderTop: '1px solid rgba(34,197,94,0.2)', color: 'rgba(255,255,255,0.4)', fontSize: 11, textAlign: 'center' }}>—</td>
                    <td style={{ padding: '6px 10px', borderTop: '1px solid rgba(34,197,94,0.2)', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>—</td>
                    <td style={{ padding: '6px 10px', borderTop: '1px solid rgba(34,197,94,0.2)', textAlign: 'center' }}>
                      <button
                        type="button"
                        disabled={!nuevoDocTexto.trim()}
                        onClick={() => {
                          const txt = nuevoDocTexto.trim()
                          if (!txt) return
                          const nuevo: DocumentoExigido = {
                            id: crypto.randomUUID(),
                            documento: txt,
                            fecha_procesado: '',
                            listo: false,
                            creado_en: new Date().toISOString(),
                            creado_por: `${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`.trim() || (currentUser?.usuario || 'desconocido'),
                          }
                          setSelected({ ...selected, documentos_exigidos: [...(selected.documentos_exigidos || []), nuevo] })
                          setNuevoDocTexto('')
                        }}
                        style={{ ...btnStyle, padding: '4px 10px', fontSize: 11, background: nuevoDocTexto.trim() ? '#15803d' : 'rgba(255,255,255,0.1)', color: '#fff', cursor: nuevoDocTexto.trim() ? 'pointer' : 'not-allowed', opacity: nuevoDocTexto.trim() ? 1 : 0.5 }}
                      >
                        + Agregar
                      </button>
                    </td>
                  </tr>
                )}
                {(selected.documentos_exigidos || []).length === 20 && (
                  <tr>
                    <td colSpan={5} style={{ padding: 12, textAlign: 'center', color: '#013978', fontSize: 12 }}>
                      Máximo 20 documentos alcanzado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.observaciones')}</label>
            <textarea value={selected.observaciones} onChange={e => setSelected({ ...selected, observaciones: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="submit" style={{ ...btnStyle, background: '#0f1b3d', color: '#ffffff' }}>{selected.id ? 'Actualizar' : 'Crear'} Oportunidad</button>
            <button type="button" onClick={() => { setIsForm(false); setSelected(null) }} style={{ ...btnStyle, background: '#64748b', color: '#ffffff' }}>{t('btn.cancelar')}</button>
          </div>
        </form>
        {selected.id && <DocumentosPanel modulo="oportunidades" registroId={selected.id} />}
      </div>
    )
  }

  // ── REPORT DATA ──
  const reportColumns = [
    { header: 'Código', key: 'codigo', width: 12 },
    { header: 'Proyecto', key: 'proyecto', width: 28 },
    { header: 'Cliente', key: 'cliente_nombre', width: 22 },
    { header: 'Ciudad', key: 'ciudad', width: 12 },
    { header: 'Monto Est.', key: 'monto', width: 14 },
    { header: 'Probable %', key: 'prob', width: 10 },
    { header: 'Adjudicación', key: 'adj', width: 12 },
    { header: 'Veredicto', key: 'veredicto', width: 12 },
    { header: 'Situación', key: 'situacion', width: 12 },
  ]
  const reportRows = filtered.map(o => ({
    codigo: o.codigo, proyecto: o.proyecto, cliente_nombre: o.cliente_nombre,
    ciudad: o.ciudad || '-', monto: `${monedaSimbolo(o.tipo_moneda)}${fmtMoney(o.monto_estimado || 0)}`,
    prob: `${o.probable_pct || 0}%`, adj: o.adjudicacion || '-', veredicto: o.veredicto || '-', situacion: o.situacion,
  }))

  // ── MAIN VIEW ──
  return (
    <div>
      <ModuleHeader title={t('page.oportunidades.title')} subtitle={t('page.oportunidades.subtitle')} />

      {permisos.editar && tab === 'registros' && (
        <div style={{ marginBottom: 20 }}>
          <button onClick={() => { setSelected(emptyOportunidad(nextConsecutivo('OPP-', oportunidades.map(o => o.codigo)).codigo, `${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`.trim())); setIsForm(true) }} style={{ ...btnStyle, background: '#0f1b3d', color: '#ffffff' }}>{t('page.oportunidades.btnNuevo')}</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setTab('registros')} style={tabBtnStyle(tab === 'registros')}>📋 {t('tab.registros')}</button>
        <button onClick={() => setTab('reportes')} style={tabBtnStyle(tab === 'reportes')}>📊 {t('tab.reportes')}</button>
      </div>

      {tab === 'registros' && (
        <>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('ph.buscarOportunidad')}
            style={{ ...inputStyle, maxWidth: 500, marginBottom: 16 }} />
          <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                {[t('lbl.codigo'), t('lbl.proyecto'), t('lbl.cliente'), t('lbl.ciudad'), t('lbl.pais'), 'Estimado USA', idioma === 'en' ? 'Prob %' : 'Prob %', t('lbl.adjudicacion'), t('lbl.veredicto'), t('lbl.situacion'), idioma === 'en' ? 'Actions' : 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', background: '#1e3a5f', color: '#fff', fontSize: 12, textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.map((o, i) => (
                  <tr key={o.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13, fontFamily: 'monospace' }}>{o.codigo}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13, maxWidth: 280 }}>{o.proyecto}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>
                      {o.cliente_nombre}
                      {(() => {
                        const cli = allClientes.find(x => x.id === o.cliente_id)
                          || allClientes.find(x => (x.razon_social || '').trim().toUpperCase() === (o.cliente_nombre || '').trim().toUpperCase())
                        const sit = (cli?.situacion || '').trim().toLowerCase()
                        if (sit.includes('prosp')) {
                          return <span style={{ marginLeft: 6, padding: '2px 8px', borderRadius: 12, background: '#facc15', color: '#1f2937', fontSize: 10, fontWeight: 700, border: '1px solid #eab308' }}>Prospectando</span>
                        }
                        return null
                      })()}
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{o.ciudad || '-'}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{o.pais || '-'}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13, fontWeight: 600, textAlign: 'right' }}>{monedaSimbolo(o.tipo_moneda)}{fmtMoney(o.monto_estimado || 0)}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13, textAlign: 'center' }}>{o.probable_pct || 0}%</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{o.adjudicacion || '-'}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 12 }}>{o.veredicto || '-'}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, ...statusStyle(o.situacion) }}>{ts(o.situacion)}</span>
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setViewDetail(o)} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#ea580c', color: '#fff', border: '1px solid #f97316' }}>{idioma === 'en' ? 'View' : 'Ver'}</button>
                        <button onClick={() => { const con = allContactos.find(c => c.id === o.contacto_id); setCorreoModal({ to: con?.email || '', ref: o.codigo }) }} title="Enviar correo" style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#0ea5e9', color: '#fff', border: '1px solid #38bdf8' }}>✉</button>
                        {(() => {
                          const con = allContactos.find(x => x.id === o.contacto_id)
                          const cli = allClientes.find(x => x.id === o.cliente_id)
                          const phone = con?.celular || con?.telefono || cli?.telefono || ''
                          const nombre = con ? `${con.nombre}` : (cli?.razon_social || o.cliente_nombre || '')
                          if (!isValidPhone(phone)) return null
                          const msg = idioma === 'en'
                            ? `Hi ${nombre}, regarding the opportunity ${o.codigo} - ${o.proyecto}.`
                            : `Hola ${nombre}, te escribimos sobre la oportunidad ${o.codigo} - ${o.proyecto}.`
                          return (
                            <a href={buildWhatsAppLink(phone, msg)} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#25d366', color: '#ffffff', border: '1px solid #128c7e', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>WhatsApp</a>
                          )
                        })()}
                        {permisos.editar && <button onClick={() => { setSelected(o); setIsForm(true) }} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#2563eb', color: '#fff', border: '1px solid #3b82f6' }}>{t('btn.editar')}</button>}
                        {permisos.eliminar && <button onClick={() => {
                          if (!confirm(`¿Eliminar oportunidad "${o.codigo}"?`)) return
                          deleteOportunidad(o.id)
                          logAudit({ ...auditParams(), accion: 'ELIMINAR', registro_codigo: o.codigo, registro_nombre: o.proyecto })
                        }} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#dc2626', color: '#fff', border: '1px solid #ef4444' }}>{t('btn.eliminar')}</button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={10} style={{ padding: 32, textAlign: 'center', color: '#013978', fontSize: 14 }}>No hay oportunidades registradas</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'reportes' && (
        <>
          <div style={{ marginBottom: 16, padding: '16px 20px', background: 'linear-gradient(90deg, rgba(34,197,94,0.18), rgba(34,197,94,0.08))', border: '2px solid #22c55e', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ color: '#013978', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{idioma === 'en' ? 'TOTAL ESTIMATED AMOUNT' : 'TOTAL MONTO ESTIMADO'}</div>
              <div style={{ color: '#013978', fontSize: 28, fontWeight: 800, marginTop: 4 }}>${fmtMoney(oportunidades.reduce((s, o) => s + (o.monto_estimado || 0), 0))}</div>
            </div>
            <div style={{ color: '#013978', fontSize: 13 }}>{oportunidades.length} {idioma === 'en' ? 'opportunities' : 'oportunidades'}</div>
          </div>
          <ReportPanel title="Reporte de Oportunidades" columns={reportColumns} rows={reportRows}
            summableKeys={['monto']}
            filters={[
              { label: 'Situación', key: 'situacion', options: [...new Set(oportunidades.map(o => o.situacion).filter(v => !!v))] as string[] },
              { label: 'Veredicto', key: 'veredicto', options: [...new Set(oportunidades.map(o => o.veredicto).filter(v => !!v))] as string[] },
              { label: 'Cliente', key: 'cliente_nombre', options: [...new Set(oportunidades.map(o => o.cliente_nombre).filter(v => !!v))] as string[] },
            ]} />
        </>
      )}

      {correoModal && (
        <EnviarCorreoModal destinatario={correoModal.to} modulo="oportunidades" referencia={correoModal.ref} onClose={() => setCorreoModal(null)} />
      )}
    </div>
  )
}
