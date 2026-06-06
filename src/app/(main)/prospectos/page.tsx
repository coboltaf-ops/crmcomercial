'use client'
import { logAudit, computarDiff } from '@/shared/lib/audit'
import { useState, useEffect } from 'react'
import { useProspectosStore, Prospecto } from '@/features/prospectos/store/prospectos-store'
import { useClientesStore, generarCodigoAcceso } from '@/features/clientes/store/clientes-store'
import { useReferenceStore } from '@/features/referencias/store/reference-store'
import { useCurrentUserStore } from '@/features/usuarios-gestion/store/current-user-store'
import { usePermisos } from '@/shared/hooks/use-permisos'
import { fDate, todayColombia } from '@/shared/lib/format-date'
import { nextConsecutivo } from '@/shared/lib/consecutivo'
import ReportPanel from '@/shared/components/report-panel'
import SeguimientoPanel from '@/shared/components/seguimiento-panel'
import DocumentosPanel from '@/shared/components/documentos-panel'
import { useAsistenteStore } from '@/shared/stores/asistente-store'
import { Seguimiento } from '@/shared/types/seguimiento'
import { useEmpresaStore } from '@/features/empresa/store/empresa-store'
import { useT, useIdioma, useTStatus } from '@/shared/i18n/use-t'
import { buildWhatsAppLink, isValidPhone } from '@/shared/lib/whatsapp'

const today = todayColombia()

interface ProspectoExterno {
  id: string; nombre: string; apellido: string; empresa: string; correo: string
  nro_movil: string; descripcion_requerimiento: string; fecha_registro: string
  hora_registro: string; importado: boolean
}

const emptyProspecto = (codigo: string): Prospecto => ({
  id: '', codigo, nombre: '', apellido: '', empresa: '', correo: '', nro_movil: '',
  origen_prospecto: '', detalle_requerimiento: '', actividad: '', ciudad: '', pais: 'Colombia',
  situacion: 'Nuevo', fecha_registro: today, seguimientos: [],
})

export default function ProspectosPage() {
  const t = useT()
  const ts = useTStatus()
  const idioma = useIdioma()
  const permisos = usePermisos('prospectos')
  const currentUser = useCurrentUserStore(s => s.user)
  const empresa = useEmpresaStore(s => s.empresas[0])
  const { prospectos, addProspecto, updateProspecto, deleteProspecto } = useProspectosStore()
  const { clientes, addCliente } = useClientesStore()
  const refData = useReferenceStore(s => s.data)

  const [selected, setSelected] = useState<Prospecto | null>(null)
  const [isForm, setIsForm] = useState(false)
  const [viewDetail, setViewDetail] = useState<Prospecto | null>(null)
  const [tab, setTab] = useState<'registros' | 'reportes'>('registros')
  const [search, setSearch] = useState('')
  const { pendingSearch, pendingAction, clearPending } = useAsistenteStore()

  // ── Prospectos externos ──
  const [externas, setExternas] = useState<ProspectoExterno[]>([])
  const [showExternas, setShowExternas] = useState(false)

  const loadExternas = async () => {
    try {
      const res = await fetch('/api/prospectos-externo')
      const data = await res.json()
      const lista: ProspectoExterno[] = data.prospectos || []
      setExternas(lista)
      if (lista.length > 0) setShowExternas(true)
    } catch (err) {
      console.error('[prospectos] Error cargando externos:', err)
    }
  }

  useEffect(() => {
    if (pendingSearch) setSearch(pendingSearch)
    if (pendingAction === 'nuevo') { setSelected(emptyProspecto(nextConsecutivo('PRS-', prospectos.map(p => p.codigo)).codigo)); setIsForm(true) }
    if (pendingSearch || pendingAction) clearPending()
    loadExternas()
    const intervalId = setInterval(loadExternas, 15000)
    return () => clearInterval(intervalId)
  }, [])

  const importarProspecto = async (ext: ProspectoExterno) => {
    const codigo = nextConsecutivo('PRS-', prospectos.map(p => p.codigo)).codigo
    addProspecto({
      id: crypto.randomUUID(), codigo, nombre: ext.nombre, apellido: ext.apellido,
      empresa: ext.empresa, correo: ext.correo, nro_movil: ext.nro_movil,
      origen_prospecto: 'Formulario Web', detalle_requerimiento: ext.descripcion_requerimiento,
      actividad: '', ciudad: '', pais: 'Colombia', situacion: 'Sin Contactar',
      fecha_registro: ext.fecha_registro || today, seguimientos: [{
        id: crypto.randomUUID(), fecha: today, detalle: `Prospecto importado desde formulario web. Registrado el ${ext.fecha_registro} a las ${ext.hora_registro}.`,
        persona_actividad: `${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`.trim(), situacion: 'Sin Contactar', usuario: currentUser?.nombre || 'Sistema',
      }],
    })
    try { await fetch('/api/prospectos-externo', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [ext.id] }) }) } catch { /* silent */ }
    setExternas(prev => prev.filter(e => e.id !== ext.id))
  }

  const importarTodas = async () => {
    for (const ext of externas) {
      const codigo = nextConsecutivo('PRS-', [...prospectos.map(p => p.codigo)]).codigo
      addProspecto({
        id: crypto.randomUUID(), codigo, nombre: ext.nombre, apellido: ext.apellido,
        empresa: ext.empresa, correo: ext.correo, nro_movil: ext.nro_movil,
        origen_prospecto: 'Formulario Web', detalle_requerimiento: ext.descripcion_requerimiento,
        actividad: '', ciudad: '', pais: 'Colombia', situacion: 'Sin Contactar',
        fecha_registro: ext.fecha_registro || today, seguimientos: [{
          id: crypto.randomUUID(), fecha: today, detalle: `Prospecto importado desde formulario web. Registrado el ${ext.fecha_registro} a las ${ext.hora_registro}.`,
          persona_actividad: `${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`.trim(), situacion: 'Sin Contactar', usuario: currentUser?.nombre || 'Sistema',
        }],
      })
    }
    try { await fetch('/api/prospectos-externo', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: externas.map(e => e.id) }) }) } catch { /* silent */ }
    setExternas([])
    setShowExternas(false)
  }

  const refOptions = (table: string) => (refData[table as keyof typeof refData] || []).filter(r => r.situacion).map(r => r.descripcion)

  const filtered = prospectos.filter(p => {
    const s = search.toLowerCase()
    return !s || p.nombre.toLowerCase().includes(s) || p.apellido.toLowerCase().includes(s) ||
      p.empresa.toLowerCase().includes(s) || p.codigo.toLowerCase().includes(s)
  })

  const auditParams = () => ({
    usuario: currentUser?.usuario || 'desconocido',
    usuario_nombre: `${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`.trim(),
    rol: currentUser?.rol || '',
    modulo: 'prospectos',
  })

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    if (selected.id) {
      const _anterior = prospectos.find(x => x.id === selected.id); updateProspecto(selected.id, selected); logAudit({ ...auditParams(), accion: "MODIFICAR", registro_codigo: selected.codigo, registro_nombre: `${selected.nombre} ${selected.apellido}`, detalle: computarDiff(_anterior as unknown as Record<string, unknown>, selected as unknown as Record<string, unknown>) })
    } else {
      addProspecto({ ...selected, id: crypto.randomUUID(), fecha_registro: today }); logAudit({ ...auditParams(), accion: "CREAR", registro_codigo: selected.codigo, registro_nombre: `${selected.nombre} ${selected.apellido}` })
      const correo = (selected.correo || '').trim()
      if (correo) {
        fetch('/api/send-prospecto-bienvenida', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: correo,
            nombre: selected.nombre,
            apellido: selected.apellido,
            codigo: selected.codigo,
            empresa_nombre: empresa?.nombre || '',
            empresa_prospecto: selected.empresa || '',
            detalle_requerimiento: selected.detalle_requerimiento || '',
            logo_url: empresa?.logo_url || '',
          }),
        }).catch(() => { /* no bloquear */ })
      }
    }
    setIsForm(false); setSelected(null)
  }

  const statusStyle = (s: string): React.CSSProperties => {
    const map: Record<string, React.CSSProperties> = {
      'Nuevo': { background: '#0c2563', color: '#ffffff', border: '1px solid #60a5fa' },
      'Contactado': { background: '#1e40af', color: '#ffffff', border: '1px solid #3b82f6' },
      'Calificado': { background: '#15803d', color: '#ffffff', border: '1px solid #22c55e' },
      'En Negociación': { background: '#b45309', color: '#ffffff', border: '1px solid #f59e0b' },
      'Convertido': { background: '#065f46', color: '#ffffff', border: '1px solid #10b981' },
      'Descartado': { background: '#991b1b', color: '#ffffff', border: '1px solid #ef4444' },
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
      { label: t('lbl.nombre'), value: viewDetail.nombre },
      { label: t('lbl.apellido'), value: viewDetail.apellido },
      { label: t('lbl.empresa'), value: viewDetail.empresa },
      { label: t('lbl.correo'), value: viewDetail.correo },
      { label: t('lbl.nroMovil'), value: viewDetail.nro_movil },
      { label: t('lbl.origenProspecto'), value: viewDetail.origen_prospecto },
      { label: t('lbl.actividad'), value: viewDetail.actividad },
      { label: t('lbl.ciudad'), value: viewDetail.ciudad },
      { label: t('lbl.pais'), value: viewDetail.pais },
      { label: t('lbl.situacion'), value: viewDetail.situacion },
      { label: t('lbl.fechaRegistro'), value: fDate(viewDetail.fecha_registro) },
      { label: t('lbl.detalleRequerimiento'), value: viewDetail.detalle_requerimiento },
    ]
    return (
      <div>
        <button onClick={() => setViewDetail(null)} style={{ ...btnStyle, background: '#000000', color: '#ffffff', border: '1px solid #333333', marginBottom: 16 }}>{t('btn.volver')}</button>
        <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, border: '1px solid #1e3a8a' }}>
          <h2 style={{ color: '#013978', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{viewDetail.nombre} {viewDetail.apellido}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {fields.map(f => (
              <div key={f.label} style={f.label === 'Detalle Requerimiento' ? { gridColumn: 'span 3' } : undefined}>
                <p style={{ color: '#013978', fontSize: 16, fontWeight: 900, marginBottom: 4 }}>{f.label}</p>
                <p style={{ color: '#013978', fontSize: 14 }}>{f.value || '—'}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            {permisos.editar && (
              <button onClick={() => { setSelected(viewDetail); setIsForm(true); setViewDetail(null) }} style={{ ...btnStyle, background: '#15803d', color: '#ffffff', border: '1px solid #16a34a' }}>{t('btn.editar')}</button>
            )}
            {permisos.editar && viewDetail.situacion !== 'Convertido' && (
              <button onClick={() => {
                // Validar que la empresa no exista ya
                const yaExiste = clientes.find(c =>
                  c.razon_social.toLowerCase().trim() === viewDetail.empresa.toLowerCase().trim()
                )
                if (yaExiste) {
                  if (!confirm(idioma === 'en' ? `Company "${yaExiste.razon_social}" already exists as client (${yaExiste.codigo}). Mark this prospect as "Converted" anyway?` : `La empresa "${yaExiste.razon_social}" ya existe como cliente (${yaExiste.codigo}). ¿Marcar este prospecto como "Convertido" de todos modos?`)) return
                  updateProspecto(viewDetail.id, { situacion: 'Convertido' })
                  setViewDetail({ ...viewDetail, situacion: 'Convertido' })
                  return
                }
                if (!confirm(idioma === 'en' ? `Convert "${viewDetail.empresa}" to Client?\n\nA new client will be created with the prospect's data and marked as Converted.` : `¿Convertir a "${viewDetail.empresa}" en Cliente?\n\nSe creará un nuevo cliente con los datos del prospecto y se marcará como Convertido.`)) return

                const nuevoCodigo = nextConsecutivo('CLI-', clientes.map(c => c.codigo)).codigo
                addCliente({
                  id: crypto.randomUUID(),
                  codigo: nuevoCodigo,
                  tipo_identificacion: 'NIT',
                  nro_documento: '',
                  razon_social: viewDetail.empresa || `${viewDetail.nombre} ${viewDetail.apellido}`.trim(),
                  nombre_comercial: viewDetail.empresa || '',
                  actividad: viewDetail.actividad || '',
                  direccion: '',
                  ciudad: viewDetail.ciudad || '',
                  pais: viewDetail.pais || 'Colombia',
                  codigo_postal: '',
                  telefono: viewDetail.nro_movil || '',
                  email: viewDetail.correo || '',
                  sitio_web: '',
                  condicion_pago: 'Contado',
                  tipo_moneda: 'Pesos Colombianos',
                  observaciones: `Convertido desde prospecto ${viewDetail.codigo}. Requerimiento original: ${viewDetail.detalle_requerimiento || '—'}`,
                  situacion: 'Activo',
                  fecha_registro: today,
                  seguimientos: [{
                    id: crypto.randomUUID(),
                    fecha: today,
                    detalle: `Cliente creado desde conversión del prospecto ${viewDetail.codigo} - ${viewDetail.nombre} ${viewDetail.apellido}`,
                    persona_actividad: `${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`.trim(),
                    situacion: 'Activo',
                    usuario: currentUser?.nombre || 'Sistema',
                  }],
                  codigo_acceso: generarCodigoAcceso(),
                })
                updateProspecto(viewDetail.id, { situacion: 'Convertido' })
                setViewDetail({ ...viewDetail, situacion: 'Convertido' })
                alert(idioma === 'en' ? `Client "${viewDetail.empresa}" created successfully (${nuevoCodigo}). You can now see it in the Clients module.` : `Cliente "${viewDetail.empresa}" creado con éxito (${nuevoCodigo}). Ya puedes verlo en el módulo Clientes.`)
              }} style={{ ...btnStyle, background: '#1e3a8a', color: '#ffffff', border: '1px solid #3b82f6' }}>🔄 Convertir a Cliente</button>
            )}
          </div>
          <SeguimientoPanel
            seguimientos={viewDetail.seguimientos || []}
            usuario={`${currentUser?.nombre} ${currentUser?.apellido}`}
            situacionActual={viewDetail.situacion}
            situacionOpciones={refOptions('situacion_prospecto')}
            onAdd={(seg: Seguimiento) => {
              const updated = { ...viewDetail, situacion: seg.situacion, seguimientos: [...(viewDetail.seguimientos || []), seg] }
              updateProspecto(viewDetail.id, updated)
              setViewDetail(updated)
            }}
          />
          <DocumentosPanel modulo="prospectos" registroId={viewDetail.id} />
        </div>
      </div>
    )
  }

  // Form
  if (isForm && selected) {
    return (
      <div>
        <button onClick={() => { setIsForm(false); setSelected(null) }} style={{ ...btnStyle, background: '#000000', color: '#ffffff', border: '1px solid #333333', marginBottom: 16 }}>{t('btn.volver')}</button>
        <form onSubmit={handleSave} style={{ background: '#ffffff', borderRadius: 16, padding: 24, border: '1px solid #1e3a8a' }}>
          <h2 style={{ color: '#013978', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{selected.id ? t('fmt.editarProspecto') : t('fmt.nuevoProspecto')}</h2>
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
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.nombre')} *</label>
              <input value={selected.nombre} onChange={e => setSelected({ ...selected, nombre: e.target.value.toUpperCase() })} required style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.apellido')} *</label>
              <input value={selected.apellido} onChange={e => setSelected({ ...selected, apellido: e.target.value.toUpperCase() })} required style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.empresa')}</label>
              <input value={selected.empresa} onChange={e => setSelected({ ...selected, empresa: e.target.value.toUpperCase() })} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.correo')} *</label>
              <input type="email" value={selected.correo} onChange={e => setSelected({ ...selected, correo: e.target.value })} required style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.nroMovil')}</label>
              <input value={selected.nro_movil} onChange={e => setSelected({ ...selected, nro_movil: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.origenProspecto')} *</label>
              <select value={selected.origen_prospecto} onChange={e => setSelected({ ...selected, origen_prospecto: e.target.value })} required style={inputStyle}>
                <option value="">{t("campo.seleccionar")}</option>
                {refOptions('origen_prospecto').map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.actividad')}</label>
              <select value={selected.actividad} onChange={e => setSelected({ ...selected, actividad: e.target.value })} style={inputStyle}>
                <option value="">{t("campo.seleccionar")}</option>
                {refOptions('actividad_cliente').map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.situacion')}</label>
              <select value={selected.situacion} onChange={e => setSelected({ ...selected, situacion: e.target.value })} style={inputStyle}>
                {refOptions('situacion_prospecto').map(o => <option key={o} value={o}>{o}</option>)}
              </select>
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
            <div style={{ gridColumn: 'span 3' }}>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.detalleRequerimiento')}</label>
              <textarea value={selected.detalle_requerimiento} onChange={e => setSelected({ ...selected, detalle_requerimiento: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="submit" style={{ ...btnStyle, background: '#1e3a8a', color: '#ffffff' }}>{t('btn.guardar')}</button>
            <button type="button" onClick={() => { setIsForm(false); setSelected(null) }} style={{ ...btnStyle, background: '#64748b', color: '#ffffff' }}>{t('btn.cancelar')}</button>
          </div>
        </form>
        {selected.id && <DocumentosPanel modulo="prospectos" registroId={selected.id} />}
      </div>
    )
  }

  // Report data
  const reportColumns = [
    { header: 'Código', key: 'codigo', width: 10 },
    { header: 'Nombre', key: 'nombre_completo', width: 18 },
    { header: 'Empresa', key: 'empresa', width: 16 },
    { header: 'Correo', key: 'correo', width: 18 },
    { header: 'Móvil', key: 'nro_movil', width: 10 },
    { header: 'Origen', key: 'origen_prospecto', width: 10 },
    { header: 'Ciudad', key: 'ciudad', width: 10 },
    { header: 'Situación', key: 'situacion', width: 10 },
  ]
  const reportRows = filtered.map(p => ({
    codigo: p.codigo, nombre_completo: `${p.nombre} ${p.apellido}`, empresa: p.empresa,
    correo: p.correo, nro_movil: p.nro_movil, origen_prospecto: p.origen_prospecto,
    ciudad: p.ciudad, situacion: p.situacion,
  }))
  const reportFilters = [
    { label: 'Situación', key: 'situacion', options: [...new Set(prospectos.map(p => p.situacion).filter(Boolean))] },
    { label: 'Origen', key: 'origen_prospecto', options: [...new Set(prospectos.map(p => p.origen_prospecto).filter(Boolean))] },
    { label: 'Ciudad', key: 'ciudad', options: [...new Set(prospectos.map(p => p.ciudad).filter(Boolean))] },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#013978', marginBottom: 4 }}>{t('page.prospectos.title')}</h1>
          <p style={{ color: '#013978', fontSize: 14 }}>{t('page.prospectos.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {tab === 'registros' && externas.length > 0 && (
            <button onClick={() => setShowExternas(!showExternas)}
              style={{ ...btnStyle, background: '#ea580c', color: '#ffffff', border: '1px solid #f97316', position: 'relative' }}>
              Prospectos Web
              <span style={{ position: 'absolute', top: -8, right: -8, background: '#dc2626', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{externas.length}</span>
            </button>
          )}
          {permisos.editar && tab === 'registros' && (
            <button onClick={() => { setSelected(emptyProspecto(nextConsecutivo('PRS-', prospectos.map(p => p.codigo)).codigo)); setIsForm(true) }} style={{ ...btnStyle, background: '#1e3a8a', color: '#ffffff' }}>{t('page.prospectos.btnNuevo')}</button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setTab('registros')} style={tabBtnStyle(tab === 'registros')}>📋 {t('tab.registros')}</button>
        <button onClick={() => setTab('reportes')} style={tabBtnStyle(tab === 'reportes')}>📊 {t('tab.reportes')}</button>
      </div>

      {tab === 'registros' && (
        <>
          {/* Panel prospectos externos */}
          {showExternas && externas.length > 0 && (
            <div style={{ background: 'rgba(234,88,12,0.1)', border: '1px solid rgba(234,88,12,0.3)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ color: '#f97316', fontSize: 15, fontWeight: 700, margin: 0 }}>Prospectos desde Formulario Web ({externas.length})</h3>
                <button onClick={importarTodas} style={{ ...btnStyle, background: '#15803d', color: '#ffffff', border: '1px solid #16a34a', fontSize: 12 }}>Importar Todas</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {externas.map(ext => (
                  <div key={ext.id} style={{ background: '#f1f5f9', borderRadius: 10, padding: '12px 16px', border: '1px solid #1e3a8a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#013978', fontSize: 14, fontWeight: 600, margin: 0 }}>{ext.nombre} {ext.apellido}</p>
                      <p style={{ color: '#013978', fontSize: 12, margin: '2px 0' }}>{ext.empresa || 'Sin empresa'} | {ext.correo} | {ext.nro_movil || 'Sin móvil'}</p>
                      <p style={{ color: '#013978', fontSize: 11, margin: 0 }}>{ext.descripcion_requerimiento?.substring(0, 120)}{(ext.descripcion_requerimiento?.length || 0) > 120 ? '...' : ''}</p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '4px 0 0' }}>{ext.fecha_registro} {ext.hora_registro}</p>
                    </div>
                    <button onClick={() => importarProspecto(ext)} style={{ ...btnStyle, background: '#1e3a8a', color: '#ffffff', border: '1px solid #3b82f6', fontSize: 11, marginLeft: 12 }}>Importar al CRM</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('ph.buscarProspecto')} style={{ ...inputStyle, maxWidth: 400 }} />
          </div>

          <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {[t('lbl.codigo'), t('lbl.nombre'), t('lbl.empresa'), t('lbl.correo'), t('lbl.movil'), idioma === 'en' ? 'Source' : 'Origen', t('lbl.situacion'), idioma === 'en' ? 'Actions' : 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', background: '#1e3a8a', color: '#fff', fontSize: 12, textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13, fontFamily: 'monospace' }}>{p.codigo}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{p.nombre} {p.apellido}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{p.empresa}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{p.correo}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{p.nro_movil}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{p.origen_prospecto}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, ...statusStyle(p.situacion) }}>{ts(p.situacion)}</span>
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setViewDetail(p)} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#ea580c', color: '#ffffff', border: '1px solid #f97316' }}>{idioma === 'en' ? 'View' : 'Ver'}</button>
                        {isValidPhone(p.nro_movil) && (
                          <a href={buildWhatsAppLink(p.nro_movil, idioma === 'en' ? `Hi ${p.nombre}, thank you for contacting us. We received your inquiry and will get back to you soon.` : `Hola ${p.nombre}, muchas gracias por contactarnos. Recibimos tu solicitud y pronto te contactaremos.`)} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#25d366', color: '#ffffff', border: '1px solid #128c7e', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>WhatsApp</a>
                        )}
                        {permisos.editar && <button onClick={() => { setSelected(p); setIsForm(true) }} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#15803d', color: '#ffffff', border: '1px solid #16a34a' }}>{t('btn.editar')}</button>}
                        {permisos.eliminar && <button onClick={() => { if (confirm(idioma === 'en' ? `Delete prospect "${p.nombre} ${p.apellido}"?` : `¿Eliminar prospecto "${p.nombre} ${p.apellido}"?`)) deleteProspecto(p.id); logAudit({ ...auditParams(), accion: "ELIMINAR", registro_codigo: p.codigo, registro_nombre: `${p.nombre} ${p.apellido}` }) }} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#dc2626', color: '#ffffff', border: '1px solid #ef4444' }}>{t('btn.eliminar')}</button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#013978', fontSize: 14 }}>No hay prospectos registrados</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'reportes' && (
        <ReportPanel title="Reporte de Prospectos" columns={reportColumns} rows={reportRows} filters={reportFilters} />
      )}
    </div>
  )
}
