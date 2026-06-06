'use client'
import { logAudit, computarDiff } from '@/shared/lib/audit'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import ModuleHeader from '@/shared/components/module-header'
import EnviarCorreoModal from '@/shared/components/enviar-correo-modal'
import { useContactosStore, Contacto } from '@/features/contactos/store/contactos-store'
import { useClientesStore } from '@/features/clientes/store/clientes-store'
import { useReferenceStore } from '@/features/referencias/store/reference-store'
import { useCurrentUserStore } from '@/features/usuarios-gestion/store/current-user-store'
import { usePermisos } from '@/shared/hooks/use-permisos'
import { fDate, todayColombia } from '@/shared/lib/format-date'
import { nextConsecutivo } from '@/shared/lib/consecutivo'
import ReportPanel from '@/shared/components/report-panel'
import SeguimientoPanel from '@/shared/components/seguimiento-panel'
import DocumentosPanel from '@/shared/components/documentos-panel'
import { useAsistenteStore } from '@/shared/stores/asistente-store'
import { useT, useIdioma, useTStatus } from '@/shared/i18n/use-t'
import { Seguimiento } from '@/shared/types/seguimiento'
import { buildWhatsAppLink, isValidPhone } from '@/shared/lib/whatsapp'

const today = todayColombia()

const emptyContacto = (codigo: string): Contacto => ({
  id: '', codigo, cliente_id: '', cliente_nombre: '',
  nombre: '', apellido: '', cargo: '', departamento: '', telefono: '', celular: '',
  email: '', fecha_nacimiento: '', nivel_influencia: '', es_principal: false, observaciones: '', situacion: 'Activo', fecha_registro: today, seguimientos: [],
})

export default function ContactosPage() {
  const t = useT()
  const ts = useTStatus()
  const idioma = useIdioma()
  const permisos = usePermisos('contactos')
  const currentUser = useCurrentUserStore(s => s.user)
  const { contactos, addContacto, updateContacto, deleteContacto } = useContactosStore()
  const clientes = useClientesStore(s => s.clientes).filter(c => c.situacion === 'Activo')
  const refData = useReferenceStore(s => s.data)

  const [selected, setSelected] = useState<Contacto | null>(null)
  const [isForm, setIsForm] = useState(false)
  const [viewDetail, setViewDetail] = useState<Contacto | null>(null)
  const [correoModal, setCorreoModal] = useState<{ to: string; ref: string } | null>(null)
  const [tab, setTab] = useState<'registros' | 'reportes'>('registros')
  const [search, setSearch] = useState('')
  const [filterCliente, setFilterCliente] = useState('')
  const { pendingSearch, pendingAction, clearPending } = useAsistenteStore()
  const searchParams = useSearchParams()
  const router = useRouter()
  useEffect(() => {
    if (pendingSearch) setSearch(pendingSearch)
    if (pendingAction === 'nuevo') { setSelected(emptyContacto(nextConsecutivo('CON-', contactos.map(c => c.codigo)).codigo)); setIsForm(true) }
    if (pendingSearch || pendingAction) clearPending()
  }, [])

  useEffect(() => {
    const openId = searchParams.get('open')
    if (openId) {
      const c = contactos.find(x => x.id === openId)
      if (c) setViewDetail(c)
    }
  }, [searchParams, contactos])

  const filtered = contactos.filter(c => {
    const matchSearch = !search || c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      c.apellido.toLowerCase().includes(search.toLowerCase()) || c.codigo.toLowerCase().includes(search.toLowerCase())
    const matchCliente = !filterCliente || c.cliente_id === filterCliente
    return matchSearch && matchCliente
  })

  const auditParams = () => ({
    usuario: currentUser?.usuario || 'desconocido',
    usuario_nombre: `${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`.trim(),
    rol: currentUser?.rol || '',
    modulo: 'contactos',
  })

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    const cli = clientes.find(c => c.id === selected.cliente_id)
    const toSave = { ...selected, cliente_nombre: cli?.razon_social || selected.cliente_nombre }
    if (toSave.id) {
      const _anterior = contactos.find(x => x.id === toSave.id); updateContacto(toSave.id, toSave); logAudit({ ...auditParams(), accion: "MODIFICAR", registro_codigo: toSave.codigo, registro_nombre: `${toSave.nombre} ${toSave.apellido}`, detalle: computarDiff(_anterior as unknown as Record<string, unknown>, toSave as unknown as Record<string, unknown>) })
    } else {
      addContacto({ ...toSave, id: crypto.randomUUID(), fecha_registro: today }); logAudit({ ...auditParams(), accion: "CREAR", registro_codigo: toSave.codigo, registro_nombre: `${toSave.nombre} ${toSave.apellido}` })
    }
    setIsForm(false); setSelected(null)
  }

  const statusStyle = (s: string): React.CSSProperties => {
    const map: Record<string, React.CSSProperties> = {
      'Activo': { background: 'transparent', color: '#10b981', border: '1px solid #10b981' },
      'Inactivo': { background: 'transparent', color: '#f59e0b', border: '1px solid #f59e0b' },
    }
    return map[s] || {}
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, background: '#ffffff', border: '1px solid #1e3a8a', color: '#1e3a8a', fontWeight: 600, fontSize: 13, outline: 'none' }
  const btnStyle: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }
  const tabBtnStyle = (active: boolean): React.CSSProperties => ({ ...btnStyle, background: active ? '#1e3a8a' : 'rgba(255,255,255,0.15)', color: active ? '#ffffff' : '#0f172a', border: active ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.2)' })

  // View detail
  if (viewDetail) {
    const fields = [
      { label: t('lbl.codigo'), value: viewDetail.codigo },
      { label: t('lbl.empresa'), value: viewDetail.cliente_nombre },
      { label: t('lbl.nombre'), value: viewDetail.nombre },
      { label: t('lbl.apellido'), value: viewDetail.apellido },
      { label: t('lbl.cargo'), value: viewDetail.cargo },
      { label: t('lbl.departamento'), value: viewDetail.departamento },
      { label: t('lbl.telefono'), value: viewDetail.telefono },
      { label: t('lbl.celular'), value: viewDetail.celular },
      { label: t('lbl.email'), value: viewDetail.email },
      { label: t('lbl.fechaNacimiento'), value: viewDetail.fecha_nacimiento ? fDate(viewDetail.fecha_nacimiento) : '' },
      { label: t('lbl.nivelInfluencia'), value: viewDetail.nivel_influencia },
      { label: t('lbl.situacion'), value: viewDetail.situacion },
      { label: t('lbl.fechaRegistro'), value: fDate(viewDetail.fecha_registro) },
      { label: t('lbl.observaciones'), value: viewDetail.observaciones },
    ]
    return (
      <div>
        <button onClick={() => { const back = searchParams.get("back"); if (back) { router.push(back); return } setViewDetail(null) }} style={{ ...btnStyle, background: "#000000", color: "#ffffff", border: "1px solid #333333", marginBottom: 16 }}>{t('btn.volver')}</button>
        <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, border: '1px solid #1e3a8a' }}>
          <h2 style={{ color: '#013978', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{viewDetail.nombre} {viewDetail.apellido}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {fields.map(f => (
              <div key={f.label}>
                <p style={{ color: '#013978', fontSize: 16, fontWeight: 900, marginBottom: 4 }}>{f.label}</p>
                <p style={{ color: '#013978', fontSize: 14 }}>{f.value || '—'}</p>
              </div>
            ))}
          </div>
          {permisos.editar && (
            <button onClick={() => { setSelected(viewDetail); setIsForm(true); setViewDetail(null) }} style={{ ...btnStyle, background: '#2563eb', color: '#ffffff', border: '1px solid #3b82f6', marginTop: 16 }}>{t('btn.editar')}</button>
          )}
          <SeguimientoPanel
            seguimientos={viewDetail.seguimientos || []}
            usuario={`${currentUser?.nombre} ${currentUser?.apellido}`}
            situacionActual={viewDetail.situacion}
            situacionOpciones={refData.situacion_contacto.filter(r => r.situacion).map(r => r.descripcion)}
            onAdd={(seg: Seguimiento) => {
              const updated = { ...viewDetail, situacion: seg.situacion, seguimientos: [...(viewDetail.seguimientos || []), seg] }
              updateContacto(viewDetail.id, updated)
              setViewDetail(updated)
            }}
          />
          <DocumentosPanel modulo="contactos" registroId={viewDetail.id} />
        </div>
      </div>
    )
  }

  // Form
  if (isForm && selected) {
    const refOptions = (table: string) => (refData[table as keyof typeof refData] || []).filter(r => r.situacion).map(r => r.descripcion)
    return (
      <div>
        <button onClick={() => { setIsForm(false); setSelected(null) }} style={{ ...btnStyle, background: '#000000', color: '#ffffff', border: '1px solid #333333', marginBottom: 16 }}>{t('btn.volver')}</button>
        <form onSubmit={handleSave} style={{ background: '#ffffff', borderRadius: 16, padding: 24, border: '1px solid #1e3a8a' }}>
          <h2 style={{ color: '#013978', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{selected.id ? t('fmt.editarContacto') : t('fmt.nuevoContacto')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.codigo')}</label>
              <input value={selected.codigo} readOnly style={{ ...inputStyle, opacity: 0.5 }} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.fechaRegistro')}</label>
              <input value={fDate(selected.fecha_registro || today)} readOnly style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.empresa')} *</label>
              <select value={selected.cliente_id} onChange={e => {
                const cli = clientes.find(c => c.id === e.target.value)
                setSelected({ ...selected, cliente_id: e.target.value, cliente_nombre: cli?.razon_social || '' })
              }} required style={inputStyle}>
                <option value="">Seleccionar empresa...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.nombre')} *</label>
              <input value={selected.nombre} onChange={e => setSelected({ ...selected, nombre: e.target.value.toUpperCase() })} required style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.apellido')} *</label>
              <input value={selected.apellido} onChange={e => setSelected({ ...selected, apellido: e.target.value.toUpperCase() })} required style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.cargo')}</label>
              <input value={selected.cargo} onChange={e => setSelected({ ...selected, cargo: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.departamento')}</label>
              <input value={selected.departamento} onChange={e => setSelected({ ...selected, departamento: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.telefono')}</label>
              <input value={selected.telefono} onChange={e => setSelected({ ...selected, telefono: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.celular')}</label>
              <input value={selected.celular} onChange={e => setSelected({ ...selected, celular: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.email')}</label>
              <input type="email" value={selected.email} onChange={e => setSelected({ ...selected, email: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.fechaNacimiento')}</label>
              <input type="date" value={selected.fecha_nacimiento} onChange={e => setSelected({ ...selected, fecha_nacimiento: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.nivelInfluencia')}</label>
              <select value={selected.nivel_influencia} onChange={e => setSelected({ ...selected, nivel_influencia: e.target.value })} style={inputStyle}>
                <option value="">{t("campo.seleccionar")}</option>
                {refOptions('nivel_influencia').map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.situacion')}</label>
              <select value={selected.situacion} onChange={e => setSelected({ ...selected, situacion: e.target.value })} style={inputStyle}>
                {refOptions('situacion_contacto').map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: 'span 3' }}>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.observaciones')}</label>
              <textarea value={selected.observaciones} onChange={e => setSelected({ ...selected, observaciones: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="submit" style={{ ...btnStyle, background: '#1e3a8a', color: '#ffffff' }}>{t('btn.guardar')}</button>
            <button type="button" onClick={() => { setIsForm(false); setSelected(null) }} style={{ ...btnStyle, background: '#64748b', color: '#ffffff' }}>{t('btn.cancelar')}</button>
          </div>
        </form>
        {selected.id && <DocumentosPanel modulo="contactos" registroId={selected.id} />}
      </div>
    )
  }

  // Report data
  const reportColumns = [
    { header: 'Código', key: 'codigo', width: 12 },
    { header: 'Nombre', key: 'nombre_completo', width: 20 },
    { header: 'Empresa', key: 'cliente_nombre', width: 22 },
    { header: 'Cargo', key: 'cargo', width: 14 },
    { header: 'Teléfono', key: 'telefono', width: 12 },
    { header: 'Email', key: 'email', width: 18 },
    { header: 'Principal', key: 'principal', width: 8 },
    { header: 'Situación', key: 'situacion', width: 10 },
  ]
  const reportRows = filtered.map(c => ({
    codigo: c.codigo, nombre_completo: `${c.nombre} ${c.apellido}`, cliente_nombre: c.cliente_nombre,
    cargo: c.cargo, telefono: c.telefono, email: c.email, principal: c.es_principal ? 'Sí' : 'No', situacion: c.situacion,
  }))
  const reportFilters = [
    { label: 'Situación', key: 'situacion', options: [...new Set(contactos.map(c => c.situacion).filter(Boolean))] },
    { label: 'Empresa', key: 'cliente_nombre', options: [...new Set(contactos.map(c => c.cliente_nombre).filter(Boolean))] },
  ]

  return (
    <div>
      <ModuleHeader title={t('page.contactos.title')} subtitle={t('page.contactos.subtitle')} />

      {permisos.editar && tab === 'registros' && (
        <div style={{ marginBottom: 20 }}>
          <button onClick={() => { setSelected(emptyContacto(nextConsecutivo('CON-', contactos.map(c => c.codigo)).codigo)); setIsForm(true) }} style={{ ...btnStyle, background: '#1e3a8a', color: '#ffffff' }}>{t('page.contactos.btnNuevo')}</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setTab('registros')} style={tabBtnStyle(tab === 'registros')}>📋 {t('tab.registros')}</button>
        <button onClick={() => setTab('reportes')} style={tabBtnStyle(tab === 'reportes')}>📊 {t('tab.reportes')}</button>
      </div>

      {tab === 'registros' && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('ph.buscarContacto')} style={{ ...inputStyle, maxWidth: 300 }} />
            <select value={filterCliente} onChange={e => setFilterCliente(e.target.value)} style={{ ...inputStyle, maxWidth: 250 }}>
              <option value="">Todas las empresas</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
            </select>
          </div>

          <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {[t('lbl.codigo'), t('lbl.nombre'), t('lbl.empresa'), t('lbl.cargo'), t('lbl.telefono'), t('lbl.email'), t('lbl.situacion'), idioma === 'en' ? 'Actions' : 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', background: '#1e3a8a', color: '#fff', fontSize: 12, textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13, fontFamily: 'monospace' }}>{c.codigo}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>
                      {c.nombre} {c.apellido}
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{c.cliente_nombre}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{c.cargo}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{c.telefono || c.celular}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{c.email}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, ...statusStyle(c.situacion) }}>{ts(c.situacion)}</span>
                    </td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => setViewDetail(c)} style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#ea580c', color: '#ffffff', border: '1px solid #f97316' }}>Ver</button>
                        <button onClick={() => setCorreoModal({ to: c.email || '', ref: c.codigo })} title="Enviar correo" style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#0ea5e9', color: '#ffffff', border: '1px solid #38bdf8' }}>✉</button>
                        {(isValidPhone(c.celular) || isValidPhone(c.telefono)) && (
                          <a href={buildWhatsAppLink(c.celular || c.telefono, idioma === 'en' ? `Hi ${c.nombre}, this is a quick message from us.` : `Hola ${c.nombre}, te escribimos desde nuestra empresa.`)} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#25d366', color: '#ffffff', border: '1px solid #128c7e', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>WA</a>
                        )}
                        {permisos.editar && <button onClick={() => { setSelected(c); setIsForm(true) }} style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#15803d', color: '#ffffff', border: '1px solid #16a34a' }}>Edit</button>}
                        {permisos.eliminar && <button onClick={() => { if (confirm(idioma === 'en' ? `Delete contact "${c.nombre} ${c.apellido}"?` : `¿Eliminar contacto "${c.nombre} ${c.apellido}"?`)) deleteContacto(c.id); logAudit({ ...auditParams(), accion: "ELIMINAR", registro_codigo: c.codigo, registro_nombre: `${c.nombre} ${c.apellido}` }) }} style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#dc2626', color: '#ffffff', border: '1px solid #ef4444' }}>Elim</button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#013978', fontSize: 14 }}>No hay contactos registrados</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'reportes' && (
        <ReportPanel title="Reporte de Contactos" columns={reportColumns} rows={reportRows} filters={reportFilters} />
      )}

      {correoModal && (
        <EnviarCorreoModal destinatario={correoModal.to} modulo="contactos" referencia={correoModal.ref} onClose={() => setCorreoModal(null)} />
      )}
    </div>
  )
}
