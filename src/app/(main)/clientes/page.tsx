'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ModuleHeader from '@/shared/components/module-header'
import { useClientesStore, Cliente, generarCodigoAcceso } from '@/features/clientes/store/clientes-store'
import { useContactosStore } from '@/features/contactos/store/contactos-store'
import { useCotizacionesStore } from '@/features/cotizaciones/store/cotizaciones-store'
import { useOportunidadesStore } from '@/features/oportunidades/store/oportunidades-store'
import { usePQRSStore } from '@/features/pqrs/store/pqrs-store'
import { fmtMoney } from '@/shared/lib/format-number'
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
import { logAudit, computarDiff } from '@/shared/lib/audit'
import { buildWhatsAppLink, isValidPhone } from '@/shared/lib/whatsapp'

const today = todayColombia()

const emptyCliente = (codigo: string): Cliente => ({
  id: '', codigo, tipo_identificacion: 'NIT',
  nro_documento: '', razon_social: '', nombre_comercial: '', actividad: '',
  direccion: '', ciudad: '', pais: 'Colombia', codigo_postal: '', telefono: '', email: '', sitio_web: '',
  condicion_pago: 'Contado', tipo_moneda: 'Pesos Colombianos', observaciones: '',
  situacion: 'Activo', fecha_registro: today, seguimientos: [], codigo_acceso: generarCodigoAcceso(),
})

export default function ClientesPage() {
  const t = useT()
  const ts = useTStatus()
  const idioma = useIdioma()
  const permisos = usePermisos('clientes')
  const currentUser = useCurrentUserStore(s => s.user)
  const router = useRouter()
  const { clientes, addCliente, updateCliente, deleteCliente } = useClientesStore()
  const contactos = useContactosStore(s => s.contactos)
  const cotizaciones = useCotizacionesStore(s => s.cotizaciones)
  const oportunidades = useOportunidadesStore(s => s.oportunidades)
  const pqrs = usePQRSStore(s => s.pqrs)
  const refData = useReferenceStore(s => s.data)

  const [selected, setSelected] = useState<Cliente | null>(null)
  const [isForm, setIsForm] = useState(false)
  const [viewDetail, setViewDetail] = useState<Cliente | null>(null)
  const [tab, setTab] = useState<'registros' | 'reportes'>('registros')
  const [detailTab, setDetailTab] = useState<'info' | 'contactos' | 'cotizaciones' | 'oportunidades' | 'tickets'>('info')
  const [search, setSearch] = useState('')
  const { pendingSearch, pendingAction, clearPending } = useAsistenteStore()
  const searchParams = useSearchParams()
  useEffect(() => {
    if (pendingSearch) setSearch(pendingSearch)
    if (pendingAction === 'nuevo') { setSelected(emptyCliente(nextConsecutivo('CLI-', clientes.map(c => c.codigo)).codigo)); setIsForm(true) }
    if (pendingSearch || pendingAction) clearPending()
  }, [])

  useEffect(() => {
    const viewId = searchParams.get('view')
    const editId = searchParams.get('edit')
    const tabParam = searchParams.get('tab')
    if (viewId) {
      const cli = clientes.find(c => c.id === viewId)
      if (cli) {
        setViewDetail(cli)
        if (tabParam) setDetailTab(tabParam as 'info' | 'contactos' | 'cotizaciones' | 'oportunidades' | 'tickets')
      }
    } else if (editId) {
      const cli = clientes.find(c => c.id === editId)
      if (cli) {
        setSelected(cli); setIsForm(true)
        if (tabParam) setDetailTab(tabParam as 'info' | 'contactos' | 'cotizaciones' | 'oportunidades' | 'tickets')
      }
    }
  }, [searchParams, clientes])

  const filtered = clientes.filter(c =>
    !search || c.razon_social.toLowerCase().includes(search.toLowerCase()) ||
    c.codigo.toLowerCase().includes(search.toLowerCase()) ||
    c.nro_documento.includes(search)
  )

  const auditParams = () => ({
    usuario: currentUser?.usuario || 'desconocido',
    usuario_nombre: `${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`.trim(),
    rol: currentUser?.rol || '',
    modulo: 'clientes',
  })

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    if (selected.id) {
      const anterior = clientes.find(c => c.id === selected.id)
      updateCliente(selected.id, selected)
      logAudit({ ...auditParams(), accion: 'MODIFICAR', registro_codigo: selected.codigo, registro_nombre: selected.razon_social, detalle: computarDiff(anterior as unknown as Record<string, unknown>, selected as unknown as Record<string, unknown>) })
    } else {
      const id = crypto.randomUUID()
      addCliente({ ...selected, id, fecha_registro: today })
      logAudit({ ...auditParams(), accion: 'CREAR', registro_codigo: selected.codigo, registro_nombre: selected.razon_social, detalle: `Cliente creado` })
    }
    setIsForm(false); setSelected(null)
  }

  const statusStyle = (s: string): React.CSSProperties => {
    const map: Record<string, React.CSSProperties> = {
      'activo': { background: '#0c2563', color: '#ffffff', border: '1px solid #60a5fa' },
      'inactivo': { background: '#b45309', color: '#ffffff', border: '1px solid #f59e0b' },
      'prospecto': { background: '#ca8a04', color: '#ffffff', border: '1px solid #facc15' },
      'prospectando': { background: '#ca8a04', color: '#ffffff', border: '1px solid #facc15' },
    }
    return map[(s || '').trim().toLowerCase()] || {}
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, background: '#ffffff', border: '1px solid #1e3a8a', color: '#1e3a8a', fontWeight: 600, fontSize: 13, outline: 'none' }
  const btnStyle: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }
  const tabBtnStyle = (active: boolean): React.CSSProperties => ({ ...btnStyle, background: active ? '#1e3a8a' : 'rgba(255,255,255,0.15)', color: active ? '#ffffff' : '#0f172a', border: active ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.2)' })

  // View detail
  if (viewDetail) {
    const fields = [
      { label: t('lbl.codigo'), value: viewDetail.codigo },
      { label: t('lbl.tipoIdentificacion'), value: viewDetail.tipo_identificacion },
      { label: t('lbl.nroDocumento'), value: viewDetail.nro_documento },
      { label: t('lbl.razonSocial'), value: viewDetail.razon_social },
      { label: t('lbl.nombreComercial'), value: viewDetail.nombre_comercial },
      { label: t('lbl.actividad'), value: viewDetail.actividad },
      { label: t('lbl.telefono'), value: viewDetail.telefono },
      { label: t('lbl.email'), value: viewDetail.email },
      { label: t('lbl.sitioWeb'), value: viewDetail.sitio_web },
      { label: t('lbl.condicionPago'), value: viewDetail.condicion_pago },
      { label: t('lbl.moneda'), value: viewDetail.tipo_moneda },
      { label: t('lbl.situacion'), value: viewDetail.situacion },
      { label: t('lbl.fechaRegistro'), value: fDate(viewDetail.fecha_registro) },
      { label: t('lbl.observaciones'), value: viewDetail.observaciones },
    ]
    const cId = viewDetail.id
    const misContactos = contactos.filter(c => c.cliente_id === cId)
    const misCotizaciones = cotizaciones.filter(c => c.cliente_id === cId)
    const misOportunidades = oportunidades.filter(o => o.cliente_id === cId)
    const misTickets = pqrs.filter(p => p.cliente_id === cId)
    const calcTotalCot = (det: Array<{ subtotal: number }>, pct: number) => {
      const sub = det.reduce((s, d) => s + d.subtotal, 0); return sub + sub * (pct / 100)
    }
    const prioColor: Record<string, string> = { 'Urgente': '#fca5a5', 'Alta': '#fcd34d', 'Media': '#93c5fd', 'Baja': '#86efac' }
    const th: React.CSSProperties = { padding: '12px 14px', background: '#1e3a8a', color: '#fff', fontSize: 12, textAlign: 'left' }
    const td: React.CSSProperties = { padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }
    const tdMono: React.CSSProperties = { ...td, color: '#013978', fontFamily: 'monospace' }

    return (
      <div>
        <button onClick={() => { setViewDetail(null); setDetailTab('info') }} style={{ ...btnStyle, background: '#000000', color: '#ffffff', border: '1px solid #333333', marginBottom: 16 }}>{t('btn.volver')}</button>
        <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, border: '1px solid #1e3a8a' }}>
          <h2 style={{ color: '#013978', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{viewDetail.razon_social}</h2>

          {/* Sub-tabs de la vista detalle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            <button onClick={() => setDetailTab('info')} style={tabBtnStyle(detailTab === 'info')}>🏢 Información</button>
            <button onClick={() => setDetailTab('contactos')} style={tabBtnStyle(detailTab === 'contactos')}>👤 Ver Contactos ({misContactos.length})</button>
            <button onClick={() => setDetailTab('cotizaciones')} style={tabBtnStyle(detailTab === 'cotizaciones')}>📄 Ver Cotizaciones ({misCotizaciones.length})</button>
            <button onClick={() => setDetailTab('oportunidades')} style={tabBtnStyle(detailTab === 'oportunidades')}>🎯 Ver Oportunidades ({misOportunidades.length})</button>
            <button onClick={() => setDetailTab('tickets')} style={tabBtnStyle(detailTab === 'tickets')}>🎫 Ver Tickets ({misTickets.length})</button>
          </div>

          {detailTab === 'contactos' && (
            <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{[t('lbl.nombre'), t('lbl.cargo'), t('lbl.email'), t('lbl.celular'), t('lbl.situacion'), t('campo.acciones')].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {misContactos.map((c, i) => (
                    <tr key={c.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                      <td style={{ ...td, color: '#fff', fontWeight: 600 }}>{c.nombre} {c.apellido}</td>
                      <td style={td}>{c.cargo}</td>
                      <td style={td}>{c.email}</td>
                      <td style={td}>{c.celular || c.telefono || '—'}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: c.situacion === 'Activo' ? 'rgba(34,197,94,0.2)' : 'rgba(156,163,175,0.2)', color: c.situacion === 'Activo' ? '#86efac' : '#d1d5db' }}>{ts(c.situacion)}</span></td>
                      <td style={td}><button onClick={() => router.push(`/contactos?open=${c.id}&back=${encodeURIComponent(`/clientes?view=${viewDetail.id}&tab=contactos`)}`)} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#ea580c', color: '#fff', border: '1px solid #f97316' }}>Abrir</button></td>
                    </tr>
                  ))}
                  {misContactos.length === 0 && <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#013978' }}>Este cliente no tiene contactos registrados</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {detailTab === 'cotizaciones' && (
            <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{[t('lbl.codigo'), t('lbl.fechaEmision'), t('lbl.fechaVencimiento'), t('lbl.total'), t('lbl.situacion'), t('campo.acciones')].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {misCotizaciones.map((c, i) => (
                    <tr key={c.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                      <td style={tdMono}>{c.codigo}</td>
                      <td style={td}>{fDate(c.fecha_emision)}</td>
                      <td style={td}>{fDate(c.fecha_vencimiento)}</td>
                      <td style={{ ...td, color: '#013978', fontWeight: 700 }}>${fmtMoney(calcTotalCot(c.detalles || [], c.pct_impuesto || 0))}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(59,130,246,0.2)', color: '#93c5fd' }}>{ts(c.situacion)}</span></td>
                      <td style={td}><button onClick={() => router.push(`/cotizaciones?open=${c.id}&back=${encodeURIComponent(`/clientes?view=${viewDetail.id}&tab=cotizaciones`)}`)} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#ea580c', color: '#fff', border: '1px solid #f97316' }}>Abrir</button></td>
                    </tr>
                  ))}
                  {misCotizaciones.length === 0 && <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#013978' }}>Este cliente no tiene cotizaciones</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {detailTab === 'oportunidades' && (
            <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{[t('lbl.nombre'), idioma === 'en' ? 'Stage' : 'Etapa', t('lbl.montoEstimado'), t('lbl.situacion'), t('campo.acciones')].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {misOportunidades.map((o, i) => (
                    <tr key={o.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                      <td style={{ ...td, color: '#fff', fontWeight: 600 }}>{o.proyecto}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(168,85,247,0.2)', color: '#d8b4fe' }}>{o.veredicto}</span></td>
                      <td style={{ ...td, color: '#013978', fontWeight: 700 }}>${fmtMoney(o.monto_estimado || 0)}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(34,197,94,0.2)', color: '#86efac' }}>{ts(o.situacion)}</span></td>
                      <td style={td}><button onClick={() => router.push(`/oportunidades?open=${o.id}&back=${encodeURIComponent(`/clientes?view=${viewDetail.id}&tab=oportunidades`)}`)} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#ea580c', color: '#fff', border: '1px solid #f97316' }}>Abrir</button></td>
                    </tr>
                  ))}
                  {misOportunidades.length === 0 && <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#013978' }}>Este cliente no tiene oportunidades</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {detailTab === 'tickets' && (
            <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{[t('lbl.codigo'), t('lbl.tipo'), t('lbl.prioridad'), t('lbl.asunto'), t('lbl.situacion'), t('campo.acciones')].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {misTickets.map((p, i) => (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                      <td style={tdMono}>{p.codigo}</td>
                      <td style={td}>{p.tipo}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: prioColor[p.prioridad] || '#fff' }}>{p.prioridad}</span></td>
                      <td style={td}>{p.asunto}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: p.situacion === 'Cerrada' ? 'rgba(156,163,175,0.2)' : 'rgba(239,68,68,0.2)', color: p.situacion === 'Cerrada' ? '#d1d5db' : '#fca5a5' }}>{ts(p.situacion)}</span></td>
                      <td style={td}><button onClick={() => router.push(`/pqrs?open=${p.id}&back=${encodeURIComponent(`/clientes?view=${viewDetail.id}&tab=tickets`)}`)} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#ea580c', color: '#fff', border: '1px solid #f97316' }}>Abrir</button></td>
                    </tr>
                  ))}
                  {misTickets.length === 0 && <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#013978' }}>Este cliente no tiene tickets</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {detailTab === 'info' && (
          <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {fields.map(f => (
              <div key={f.label}>
                <p style={{ color: '#013978', fontSize: 16, fontWeight: 900, marginBottom: 4 }}>{f.label}</p>
                <p style={{ color: '#013978', fontSize: 14 }}>{f.value || '—'}</p>
              </div>
            ))}
          </div>

          {/* Ubicación */}
          <div style={{ marginTop: 16, padding: 16, background: '#f1f5f9', borderRadius: 12, border: '1px solid #1e3a8a' }}>
            <h3 style={{ color: '#013978', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{t('lbl.ubicacion')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
              {[
                { label: t('lbl.direccion'), value: viewDetail.direccion },
                { label: t('lbl.ciudad'), value: viewDetail.ciudad },
                { label: t('lbl.pais'), value: viewDetail.pais },
                { label: t('lbl.codigoPostal'), value: viewDetail.codigo_postal },
              ].map(f => (
                <div key={f.label}>
                  <p style={{ color: '#013978', fontSize: 16, fontWeight: 900, marginBottom: 4 }}>{f.label}</p>
                  <p style={{ color: '#013978', fontSize: 14 }}>{f.value || '—'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Código de acceso PQRS */}
          {viewDetail.codigo_acceso && (
            <div style={{ marginTop: 16, padding: 16, background: 'rgba(234,88,12,0.1)', borderRadius: 12, border: '1px solid rgba(234,88,12,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#f97316', fontSize: 11, fontWeight: 600, marginBottom: 2 }}>Código de Acceso para PQRS Público</p>
                <p style={{ color: '#013978', fontSize: 20, fontWeight: 800, fontFamily: 'monospace', letterSpacing: 2 }}>{viewDetail.codigo_acceso}</p>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(viewDetail.codigo_acceso); alert('Código copiado al portapapeles') }}
                style={{ ...btnStyle, background: '#ea580c', color: '#ffffff', border: '1px solid #f97316', fontSize: 12 }}>Copiar</button>
            </div>
          )}

          {permisos.editar && (
            <button onClick={() => { setSelected(viewDetail); setIsForm(true); setViewDetail(null) }} style={{ ...btnStyle, background: '#2563eb', color: '#ffffff', border: '1px solid #3b82f6', marginTop: 16 }}>{t('btn.editar')}</button>
          )}
          <SeguimientoPanel
            seguimientos={viewDetail.seguimientos || []}
            usuario={`${currentUser?.nombre} ${currentUser?.apellido}`}
            situacionActual={viewDetail.situacion}
            situacionOpciones={refData.situacion_cliente.filter(r => r.situacion).map(r => r.descripcion)}
            onAdd={(seg: Seguimiento) => {
              const updated = { ...viewDetail, situacion: seg.situacion, seguimientos: [...(viewDetail.seguimientos || []), seg] }
              updateCliente(viewDetail.id, updated)
              setViewDetail(updated)
            }}
          />
          <DocumentosPanel modulo="clientes" registroId={viewDetail.id} />
          </>
          )}
        </div>
      </div>
    )
  }

  // Form
  if (isForm && selected) {
    const refOptions = (table: string) => (refData[table as keyof typeof refData] || []).filter(r => r.situacion).map(r => r.descripcion)
    const cId = selected.id
    const misContactos = cId ? contactos.filter(c => c.cliente_id === cId) : []
    const misCotizaciones = cId ? cotizaciones.filter(c => c.cliente_id === cId) : []
    const misOportunidades = cId ? oportunidades.filter(o => o.cliente_id === cId) : []
    const misTickets = cId ? pqrs.filter(p => p.cliente_id === cId) : []
    const calcTotalCot = (det: Array<{ subtotal: number }>, pct: number) => {
      const sub = det.reduce((s, d) => s + d.subtotal, 0); return sub + sub * (pct / 100)
    }
    const prioColor: Record<string, string> = { 'Urgente': '#fca5a5', 'Alta': '#fcd34d', 'Media': '#93c5fd', 'Baja': '#86efac' }
    const th: React.CSSProperties = { padding: '12px 14px', background: '#1e3a8a', color: '#fff', fontSize: 12, textAlign: 'left' }
    const td: React.CSSProperties = { padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }
    const tdMono: React.CSSProperties = { ...td, color: '#013978', fontFamily: 'monospace' }

    return (
      <div>
        <button onClick={() => { setIsForm(false); setSelected(null); setDetailTab('info') }} style={{ ...btnStyle, background: '#000000', color: '#ffffff', border: '1px solid #333333', marginBottom: 16 }}>{t('btn.volver')}</button>
        <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, border: '1px solid #1e3a8a' }}>
          <h2 style={{ color: '#013978', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{selected.id ? t('fmt.editarCliente') : t('fmt.nuevoCliente')} {selected.razon_social ? `— ${selected.razon_social}` : ''}</h2>

          {/* Sub-tabs en modo edición (solo si ya existe el cliente) */}
          {cId && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setDetailTab('info')} style={tabBtnStyle(detailTab === 'info')}>🏢 Información</button>
              <button type="button" onClick={() => setDetailTab('contactos')} style={tabBtnStyle(detailTab === 'contactos')}>👤 Contactos ({misContactos.length})</button>
              <button type="button" onClick={() => setDetailTab('cotizaciones')} style={tabBtnStyle(detailTab === 'cotizaciones')}>📄 Cotizaciones ({misCotizaciones.length})</button>
              <button type="button" onClick={() => setDetailTab('oportunidades')} style={tabBtnStyle(detailTab === 'oportunidades')}>🎯 Oportunidades ({misOportunidades.length})</button>
              <button type="button" onClick={() => setDetailTab('tickets')} style={tabBtnStyle(detailTab === 'tickets')}>🎫 Tickets ({misTickets.length})</button>
            </div>
          )}

          {cId && detailTab === 'contactos' && (
            <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{[t('lbl.nombre'), t('lbl.cargo'), t('lbl.email'), t('lbl.celular'), t('lbl.situacion'), t('campo.acciones')].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {misContactos.map((c, i) => (
                    <tr key={c.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                      <td style={{ ...td, color: '#fff', fontWeight: 600 }}>{c.nombre} {c.apellido}</td>
                      <td style={td}>{c.cargo}</td>
                      <td style={td}>{c.email}</td>
                      <td style={td}>{c.celular || c.telefono || '—'}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: c.situacion === 'Activo' ? 'rgba(34,197,94,0.2)' : 'rgba(156,163,175,0.2)', color: c.situacion === 'Activo' ? '#86efac' : '#d1d5db' }}>{ts(c.situacion)}</span></td>
                      <td style={td}><button type="button" onClick={() => router.push(`/contactos?open=${c.id}&back=${encodeURIComponent(`/clientes?edit=${cId}&tab=contactos`)}`)} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#ea580c', color: '#fff', border: '1px solid #f97316' }}>Abrir</button></td>
                    </tr>
                  ))}
                  {misContactos.length === 0 && <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#013978' }}>Este cliente no tiene contactos registrados</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {cId && detailTab === 'cotizaciones' && (
            <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{[t('lbl.codigo'), t('lbl.fechaEmision'), t('lbl.fechaVencimiento'), t('lbl.total'), t('lbl.situacion'), t('campo.acciones')].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {misCotizaciones.map((c, i) => (
                    <tr key={c.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                      <td style={tdMono}>{c.codigo}</td>
                      <td style={td}>{fDate(c.fecha_emision)}</td>
                      <td style={td}>{fDate(c.fecha_vencimiento)}</td>
                      <td style={{ ...td, color: '#013978', fontWeight: 700 }}>${fmtMoney(calcTotalCot(c.detalles || [], c.pct_impuesto || 0))}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(59,130,246,0.2)', color: '#93c5fd' }}>{ts(c.situacion)}</span></td>
                      <td style={td}><button type="button" onClick={() => router.push(`/cotizaciones?open=${c.id}&back=${encodeURIComponent(`/clientes?edit=${cId}&tab=cotizaciones`)}`)} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#ea580c', color: '#fff', border: '1px solid #f97316' }}>Abrir</button></td>
                    </tr>
                  ))}
                  {misCotizaciones.length === 0 && <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#013978' }}>Este cliente no tiene cotizaciones</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {cId && detailTab === 'oportunidades' && (
            <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{[t('lbl.nombre'), idioma === 'en' ? 'Stage' : 'Etapa', t('lbl.montoEstimado'), t('lbl.situacion'), t('campo.acciones')].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {misOportunidades.map((o, i) => (
                    <tr key={o.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                      <td style={{ ...td, color: '#fff', fontWeight: 600 }}>{o.proyecto}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(168,85,247,0.2)', color: '#d8b4fe' }}>{o.veredicto}</span></td>
                      <td style={{ ...td, color: '#013978', fontWeight: 700 }}>${fmtMoney(o.monto_estimado || 0)}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(34,197,94,0.2)', color: '#86efac' }}>{ts(o.situacion)}</span></td>
                      <td style={td}><button type="button" onClick={() => router.push(`/oportunidades?open=${o.id}&back=${encodeURIComponent(`/clientes?edit=${cId}&tab=oportunidades`)}`)} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#ea580c', color: '#fff', border: '1px solid #f97316' }}>Abrir</button></td>
                    </tr>
                  ))}
                  {misOportunidades.length === 0 && <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#013978' }}>Este cliente no tiene oportunidades</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {cId && detailTab === 'tickets' && (
            <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{[t('lbl.codigo'), t('lbl.tipo'), t('lbl.prioridad'), t('lbl.asunto'), t('lbl.situacion'), t('campo.acciones')].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {misTickets.map((p, i) => (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                      <td style={tdMono}>{p.codigo}</td>
                      <td style={td}>{p.tipo}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: prioColor[p.prioridad] || '#fff' }}>{p.prioridad}</span></td>
                      <td style={td}>{p.asunto}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: p.situacion === 'Cerrada' ? 'rgba(156,163,175,0.2)' : 'rgba(239,68,68,0.2)', color: p.situacion === 'Cerrada' ? '#d1d5db' : '#fca5a5' }}>{ts(p.situacion)}</span></td>
                      <td style={td}><button type="button" onClick={() => router.push(`/pqrs?open=${p.id}&back=${encodeURIComponent(`/clientes?edit=${cId}&tab=tickets`)}`)} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#ea580c', color: '#fff', border: '1px solid #f97316' }}>Abrir</button></td>
                    </tr>
                  ))}
                  {misTickets.length === 0 && <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#013978' }}>Este cliente no tiene tickets</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {(detailTab === 'info' || !cId) && (
        <form onSubmit={handleSave}>
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
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.tipoIdentificacion')}</label>
              <select value={selected.tipo_identificacion} onChange={e => setSelected({ ...selected, tipo_identificacion: e.target.value })} style={inputStyle}>
                {refOptions('tipo_identificacion').map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.nroDocumento')} *</label>
              <input value={selected.nro_documento} onChange={e => setSelected({ ...selected, nro_documento: e.target.value })} required style={inputStyle} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.razonSocial')} *</label>
              <input value={selected.razon_social} onChange={e => setSelected({ ...selected, razon_social: e.target.value.toUpperCase() })} required style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.nombreComercial')}</label>
              <input value={selected.nombre_comercial} onChange={e => setSelected({ ...selected, nombre_comercial: e.target.value.toUpperCase() })} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.actividad')}</label>
              <select value={selected.actividad} onChange={e => setSelected({ ...selected, actividad: e.target.value })} style={inputStyle}>
                <option value="">{t("campo.seleccionar")}</option>
                {refOptions('actividad_cliente').map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.telefono')}</label>
              <input value={selected.telefono} onChange={e => setSelected({ ...selected, telefono: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.email')}</label>
              <input type="email" value={selected.email} onChange={e => setSelected({ ...selected, email: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.sitioWeb')}</label>
              <input value={selected.sitio_web} onChange={e => setSelected({ ...selected, sitio_web: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.condicionPago')}</label>
              <select value={selected.condicion_pago} onChange={e => setSelected({ ...selected, condicion_pago: e.target.value })} style={inputStyle}>
                {refOptions('condiciones_pago').map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.moneda')}</label>
              <select value={selected.tipo_moneda} onChange={e => setSelected({ ...selected, tipo_moneda: e.target.value })} style={inputStyle}>
                {refOptions('tipo_moneda').map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.situacion')}</label>
              <select value={selected.situacion} onChange={e => setSelected({ ...selected, situacion: e.target.value })} style={inputStyle}>
                {refOptions('situacion_cliente').map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* Ubicación */}
          <div style={{ marginTop: 20, padding: 16, background: '#f1f5f9', borderRadius: 12, border: '1px solid #1e3a8a' }}>
            <h3 style={{ color: '#013978', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{t('lbl.ubicacion')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: 'span 3' }}>
                <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.direccion')}</label>
                <input value={selected.direccion} onChange={e => setSelected({ ...selected, direccion: e.target.value })} style={inputStyle} />
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
                <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.codigoPostal')}</label>
                <input value={selected.codigo_postal || ''} onChange={e => setSelected({ ...selected, codigo_postal: e.target.value })} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Código de acceso PQRS */}
          <div style={{ marginTop: 16, padding: 16, background: 'rgba(234,88,12,0.08)', borderRadius: 12, border: '1px solid rgba(234,88,12,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: '#f97316', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{idioma === 'en' ? 'Public PQRS Access Code' : 'Código de Acceso PQRS Público'}</label>
                <input value={selected.codigo_acceso || ''} readOnly style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 16, fontWeight: 700, letterSpacing: 2, opacity: 0.8 }} />
              </div>
              <button type="button" onClick={() => setSelected({ ...selected, codigo_acceso: generarCodigoAcceso() })}
                style={{ ...btnStyle, background: '#ea580c', color: '#ffffff', border: '1px solid #f97316', fontSize: 12, marginTop: 18 }}>Regenerar</button>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 6 }}>Este código permite a la empresa radicar PQRS desde el formulario público</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
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
          )}
          {selected.id && <DocumentosPanel modulo="clientes" registroId={selected.id} />}
        </div>
      </div>
    )
  }

  // Report data
  const reportColumns = [
    { header: 'Código', key: 'codigo', width: 12 },
    { header: 'Razón Social', key: 'razon_social', width: 25 },
    { header: 'NIT/Doc', key: 'nro_documento', width: 14 },
    { header: 'Ciudad', key: 'ciudad', width: 12 },
    { header: 'Teléfono', key: 'telefono', width: 12 },
    { header: 'Email', key: 'email', width: 18 },
    { header: 'Actividad', key: 'actividad', width: 14 },
    { header: 'Situación', key: 'situacion', width: 10 },
  ]
  const reportRows = filtered.map(c => ({
    codigo: c.codigo, razon_social: c.razon_social, nro_documento: c.nro_documento,
    ciudad: c.ciudad, telefono: c.telefono, email: c.email, actividad: c.actividad, situacion: c.situacion,
  }))
  const reportFilters = [
    { label: 'Situación', key: 'situacion', options: [...new Set(clientes.map(c => c.situacion).filter(Boolean))] },
    { label: 'Ciudad', key: 'ciudad', options: [...new Set(clientes.map(c => c.ciudad).filter(Boolean))] },
    { label: 'Actividad', key: 'actividad', options: [...new Set(clientes.map(c => c.actividad).filter(Boolean))] },
  ]

  return (
    <div>
      <ModuleHeader title={t('page.clientes.title')} subtitle={t('page.clientes.subtitle')} />

      {permisos.editar && tab === 'registros' && (
        <div style={{ marginBottom: 20 }}>
          <button onClick={() => { setSelected(emptyCliente(nextConsecutivo('CLI-', clientes.map(c => c.codigo)).codigo)); setIsForm(true) }} style={{ ...btnStyle, background: '#1e3a8a', color: '#ffffff' }}>{t('page.clientes.btnNuevo')}</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setTab('registros')} style={tabBtnStyle(tab === 'registros')}>📋 {t('tab.registros')}</button>
        <button onClick={() => setTab('reportes')} style={tabBtnStyle(tab === 'reportes')}>📊 {t('tab.reportes')}</button>
      </div>

      {tab === 'registros' && (
        <>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('ph.buscarCliente')}
            style={{ ...inputStyle, maxWidth: 400, marginBottom: 16 }} />

          <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {[t('lbl.codigo'), t('lbl.razonSocial'), t('lbl.tipoIdentificacion'), t('lbl.nroDocumento'), t('lbl.direccion'), t('lbl.ciudad'), t('lbl.pais'), t('lbl.telefono'), t('lbl.situacion'), idioma === 'en' ? 'Actions' : 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', background: '#1e3a8a', color: '#fff', fontSize: 12, textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13, fontFamily: 'monospace' }}>{c.codigo}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{c.razon_social}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{c.tipo_identificacion}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{c.nro_documento}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{c.direccion}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{c.ciudad}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{c.pais}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{c.telefono}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, ...statusStyle(c.situacion) }}>{ts(c.situacion)}</span>
                    </td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => setViewDetail(c)} style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#ea580c', color: '#ffffff', border: '1px solid #f97316' }}>Ver</button>
                        {isValidPhone(c.telefono) && (
                          <a href={buildWhatsAppLink(c.telefono, idioma === 'en' ? `Hi ${c.razon_social}, this is a quick message from us.` : `Hola ${c.razon_social}, te escribimos desde nuestra empresa.`)} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#25d366', color: '#ffffff', border: '1px solid #128c7e', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>WA</a>
                        )}
                        {permisos.editar && <button onClick={() => { setSelected(c); setIsForm(true) }} style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#15803d', color: '#ffffff', border: '1px solid #16a34a' }}>Edit</button>}
                        {permisos.eliminar && <button onClick={() => {
                          if (!confirm(`¿Eliminar cliente "${c.razon_social}"?`)) return
                          deleteCliente(c.id)
                          logAudit({ ...auditParams(), accion: 'ELIMINAR', registro_codigo: c.codigo, registro_nombre: c.razon_social, detalle: 'Cliente eliminado' })
                        }} style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#dc2626', color: '#ffffff', border: '1px solid #ef4444' }}>Elim</button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={10} style={{ padding: 32, textAlign: 'center', color: '#013978', fontSize: 14 }}>No hay empresas registradas</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'reportes' && (
        <ReportPanel title="Reporte de Clientes" columns={reportColumns} rows={reportRows} filters={reportFilters} />
      )}
    </div>
  )
}
