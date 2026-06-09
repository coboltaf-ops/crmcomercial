'use client'
import { logAudit, computarDiff } from '@/shared/lib/audit'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import ModuleHeader from '@/shared/components/module-header'
import { useCotizacionesStore, Cotizacion, DetalleCotizacion } from '@/features/cotizaciones/store/cotizaciones-store'
import { useClientesStore } from '@/features/clientes/store/clientes-store'
import { useContactosStore } from '@/features/contactos/store/contactos-store'
import { useOportunidadesStore } from '@/features/oportunidades/store/oportunidades-store'
import { useProductosStore } from '@/features/productos/store/productos-store'
import { useReferenceStore } from '@/features/referencias/store/reference-store'
import { useCurrentUserStore } from '@/features/usuarios-gestion/store/current-user-store'
import { useEmpresaStore } from '@/features/empresa/store/empresa-store'
import { usePermisos } from '@/shared/hooks/use-permisos'
import { fmtMoney, monedaSimbolo } from '@/shared/lib/format-number'
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

const emptyDetalle = (): DetalleCotizacion => ({
  id: crypto.randomUUID(), producto_id: '', codigo_producto: '', descripcion: '',
  cantidad: 1, precio_unitario: 0, unidad_medida: 'Unidad', descuento_pct: 0, subtotal: 0,
})

const emptyCotizacion = (codigo: string, nro: number, responsable: string): Cotizacion => ({
  id: '', codigo, nro, fecha_emision: today,
  fecha_vencimiento: '', cliente_id: '', cliente_nombre: '', contacto_id: '', contacto_nombre: '',
  oportunidad_id: '', oportunidad_nombre: '', tipo_moneda: 'Pesos Colombianos',
  condicion_pago: 'Contado', pct_impuesto: 18, observaciones: '', detalles: [emptyDetalle()],
  situacion: 'En Construcción', responsable, vendedor: '', fecha_registro: today, seguimientos: [],
})

const calcTotals = (detalles: DetalleCotizacion[], pct: number) => {
  const subtotal = detalles.reduce((s, d) => s + d.subtotal, 0)
  const impuesto = subtotal * (pct / 100)
  return { subtotal, impuesto, total: subtotal + impuesto }
}

export default function CotizacionesPage() {
  const t = useT()
  const ts = useTStatus()
  const idioma = useIdioma()
  const permisos = usePermisos('cotizaciones')
  const currentUser = useCurrentUserStore(s => s.user)
  const { cotizaciones, addCotizacion, updateCotizacion, deleteCotizacion } = useCotizacionesStore()
  const allClientes = useClientesStore(s => s.clientes)
  const clientes = allClientes.filter(c => c.situacion === 'Activo')
  const allContactos = useContactosStore(s => s.contactos).filter(c => c.situacion === 'Activo')
  const oportunidades = useOportunidadesStore(s => s.oportunidades)
  const productos = useProductosStore(s => s.productos).filter(p => p.situacion === 'Activo')
  const refData = useReferenceStore(s => s.data)
  const vendedores = useReferenceStore(s => s.vendedores).filter(v => v.situacion)
  const empresas = useEmpresaStore(s => s.empresas)
  const empresa = empresas[0]

  const [selected, setSelected] = useState<Cotizacion | null>(null)
  const [isForm, setIsForm] = useState(false)
  const [viewDetail, setViewDetail] = useState<Cotizacion | null>(null)
  const [verLectura, setVerLectura] = useState(false)
  const [tab, setTab] = useState<'registros' | 'reportes'>('registros')
  const [search, setSearch] = useState('')
  const [searchProd, setSearchProd] = useState('')
  const [showProductos, setShowProductos] = useState(false)
  const { pendingSearch, pendingAction, clearPending } = useAsistenteStore()
  const searchParams = useSearchParams()
  const router = useRouter()
  useEffect(() => {
    if (pendingSearch) setSearch(pendingSearch)
    if (pendingAction === 'nuevo') { const nc = nextConsecutivo('COT-', cotizaciones.map(c => c.codigo)); setSelected(emptyCotizacion(nc.codigo, nc.nro, `${currentUser?.nombre} ${currentUser?.apellido}`)); setIsForm(true) }
    if (pendingSearch || pendingAction) clearPending()
  }, [])

  useEffect(() => {
    const openId = searchParams.get('open')
    if (openId) {
      const c = cotizaciones.find(x => x.id === openId)
      if (c) setViewDetail(c)
    }
  }, [searchParams, cotizaciones])
  const [emailModal, setEmailModal] = useState<Cotizacion | null>(null)
  const [emailTo, setEmailTo] = useState('')
  const [emailAsunto, setEmailAsunto] = useState('')
  const [emailMsg, setEmailMsg] = useState('')
  const [sending, setSending] = useState(false)

  const filtered = cotizaciones.filter(c =>
    !search || c.codigo.toLowerCase().includes(search.toLowerCase()) ||
    c.cliente_nombre.toLowerCase().includes(search.toLowerCase())
  )

  const recalcDetalle = (d: DetalleCotizacion): DetalleCotizacion => {
    const bruto = d.cantidad * d.precio_unitario
    const desc = bruto * (d.descuento_pct / 100)
    return { ...d, subtotal: bruto - desc }
  }

  const updateDetalle = (idx: number, field: string, value: string | number) => {
    if (!selected) return
    const detalles = [...selected.detalles]
    detalles[idx] = recalcDetalle({ ...detalles[idx], [field]: value })
    setSelected({ ...selected, detalles })
  }

  const removeDetalle = (idx: number) => {
    if (!selected) return
    const detalles = selected.detalles.filter((_, i) => i !== idx)
    setSelected({ ...selected, detalles: detalles.length ? detalles : [emptyDetalle()] })
  }

  const auditParams = () => ({
    usuario: currentUser?.usuario || 'desconocido',
    usuario_nombre: `${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`.trim(),
    rol: currentUser?.rol || '',
    modulo: 'cotizaciones',
  })

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    const cli = clientes.find(c => c.id === selected.cliente_id)
    const con = allContactos.find(c => c.id === selected.contacto_id)
    const opo = oportunidades.find(o => o.id === selected.oportunidad_id)
    const toSave = {
      ...selected,
      cliente_nombre: cli?.razon_social || selected.cliente_nombre,
      contacto_nombre: con ? `${con.nombre} ${con.apellido}` : selected.contacto_nombre,
      oportunidad_nombre: opo?.proyecto || selected.oportunidad_nombre,
    }
    if (toSave.id) { const _anterior = cotizaciones.find(x => x.id === toSave.id); updateCotizacion(toSave.id, toSave); logAudit({ ...auditParams(), accion: "MODIFICAR", registro_codigo: toSave.codigo, registro_nombre: toSave.cliente_nombre, detalle: computarDiff(_anterior as unknown as Record<string, unknown>, toSave as unknown as Record<string, unknown>) }) }
    else { addCotizacion({ ...toSave, id: crypto.randomUUID(), fecha_registro: today, creado_por: `${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`.trim() || (currentUser?.usuario || 'desconocido'), creado_en: today }); logAudit({ ...auditParams(), accion: "CREAR", registro_codigo: toSave.codigo, registro_nombre: toSave.cliente_nombre }) }
    setIsForm(false); setSelected(null)
  }

  const handleSendEmail = async () => {
    if (!emailModal || !emailTo) return
    setSending(true)
    try {
      const cli = clientes.find(c => c.id === emailModal.cliente_id)
      const clienteData = cli ? {
        razon_social: cli.razon_social,
        tipo_identificacion: cli.tipo_identificacion,
        nro_documento: cli.nro_documento,
        direccion: cli.direccion,
        ciudad: cli.ciudad,
        pais: cli.pais,
      } : null
      const empresaData = empresa ? {
        nombre: empresa.nombre,
        nro_documento: empresa.nro_documento,
        direccion: empresa.direccion,
        ciudad: empresa.ciudad,
        logo_url: empresa.logo_url,
      } : null
      const res = await fetch('/api/send-cotizacion-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: emailTo, asunto: emailAsunto || `Cotización ${emailModal.codigo}`, mensaje: emailMsg, cotizacion: emailModal, cliente: clienteData, empresa: empresaData }),
      })
      const data = await res.json()
      if (data.success) {
        updateCotizacion(emailModal.id, { situacion: 'Enviada' })
        alert('Cotización enviada correctamente')
        setEmailModal(null)
      } else {
        alert(data.error || 'Error al enviar')
      }
    } catch { alert('Error de conexión') }
    finally { setSending(false) }
  }

  const generatePDF = (cot: Cotizacion) => {
    const { subtotal, impuesto, total } = calcTotals(cot.detalles, cot.pct_impuesto)
    const cli = clientes.find(c => c.id === cot.cliente_id)
    const sym = monedaSimbolo(cot.tipo_moneda)
    const rows = cot.detalles.map((d, i) => `
      <tr style="background:${i % 2 === 0 ? '#f9fafb' : '#fff'}">
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:12px">${d.codigo_producto}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${d.descripcion}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${d.cantidad}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${d.unidad_medida}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">${sym}${fmtMoney(d.precio_unitario)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${d.descuento_pct}%</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600">${sym}${fmtMoney(d.subtotal)}</td>
      </tr>`).join('')
    const emp = empresa
    const html = `<!DOCTYPE html><html><head><title>Cotización ${cot.codigo}</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial;font-size:13px;padding:32px}</style></head><body>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1e1b4b;padding-bottom:20px;margin-bottom:24px;gap:20px">
        <div style="display:flex;align-items:flex-start;gap:16px;flex:1">
          ${emp?.logo_url ? `<img src="${emp.logo_url}" alt="Logo" style="width:80px;height:80px;object-fit:contain;border-radius:10px"/>` : ''}
          <div>
            ${emp ? `<h2 style="font-size:18px;color:#1e1b4b;font-weight:800">${emp.nombre}</h2>
            <p style="color:#6b7280;font-size:12px">${emp.direccion || ''}${emp.ciudad ? ', ' + emp.ciudad : ''}</p>
            <p style="color:#6b7280;font-size:12px">NIT: ${emp.nro_documento || ''}</p>` : ''}
            <h1 style="font-size:22px;color:#8b0000;margin-top:12px;font-weight:900">COTIZACIÓN</h1>
            <p style="font-family:monospace;font-size:18px;font-weight:900;color:#8b0000">${cot.codigo}</p>
          </div>
        </div>
        <div style="text-align:right"><p style="font-size:16px;font-weight:600;color:#1e3a8a">Fecha: ${fDate(cot.fecha_emision)}</p><p style="font-size:16px;font-weight:600;color:#1e3a8a">Vence: ${fDate(cot.fecha_vencimiento)}</p></div>
      </div>
      <div style="background:#f9fafb;padding:16px;border-radius:8px;margin-bottom:24px;border:1px solid #e5e7eb">
        <p style="color:#1e3a8a;font-size:11px;font-weight:700;margin-bottom:8px;font-weight:700">DATOS DEL CLIENTE</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div><p style="color:#1e3a8a;font-size:11px;font-weight:700">EMPRESA</p><p style="font-weight:700">${cot.cliente_nombre}</p></div>
          <div><p style="color:#1e3a8a;font-size:11px;font-weight:700">TIPO ID / NRO DOCUMENTO</p><p style="font-weight:700">${cli?.tipo_identificacion || '—'} ${cli?.nro_documento || '—'}</p></div>
          <div><p style="color:#1e3a8a;font-size:11px;font-weight:700">DIRECCIÓN</p><p>${cli?.direccion || '—'}</p></div>
          <div><p style="color:#1e3a8a;font-size:11px;font-weight:700">CIUDAD</p><p>${cli?.ciudad || '—'}</p></div>
          <div><p style="color:#1e3a8a;font-size:11px;font-weight:700">PAÍS</p><p>${cli?.pais || '—'}</p></div>
          <div><p style="color:#1e3a8a;font-size:11px;font-weight:700">CONTACTO</p><p>${cot.contacto_nombre || '—'}</p></div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:24px">
        <div><p style="color:#1e3a8a;font-size:11px;font-weight:700">CONDICIÓN DE PAGO</p><p>${cot.condicion_pago}</p></div>
        <div><p style="color:#1e3a8a;font-size:11px;font-weight:700">MONEDA</p><p>${cot.tipo_moneda || 'Pesos Colombianos'}</p></div>
        <div><p style="color:#1e3a8a;font-size:11px;font-weight:700">VENDEDOR</p><p>${cot.vendedor || '—'}</p></div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <thead><tr style="background:#1e1b4b">
          ${['Código','Descripción','Cant.','Unidad','Precio Unit.','Desc.','Subtotal'].map(h => `<th style="padding:10px 12px;color:#fff;font-size:11px;text-align:left">${h}</th>`).join('')}
        </tr></thead><tbody>${rows}</tbody>
      </table>
      <div style="text-align:right;margin-bottom:24px">
        <p>Subtotal: <strong>${sym}${fmtMoney(subtotal)}</strong></p>
        <br/>
        <p>Impuesto (${cot.pct_impuesto}%): <strong>${sym}${fmtMoney(impuesto)}</strong></p>
        <br/>
        <p style="font-size:18px;color:#1e1b4b;border-top:2px solid #1e1b4b;padding-top:8px;margin-top:4px">TOTAL GENERAL: <strong>${sym}${fmtMoney(total)}</strong></p>
      </div>
      ${cot.observaciones ? `<div style="background:#f9fafb;padding:12px;border-radius:8px;margin-bottom:24px"><p style="color:#1e3a8a;font-size:11px;font-weight:700">OBSERVACIONES</p><p>${cot.observaciones}</p></div>` : ''}
      ${cot.situacion === 'Anulada' ? `<div style="text-align:center;margin:32px 0;padding:24px;border:6px solid #dc2626;border-radius:12px;background:rgba(220,38,38,0.05)"><p style="color:#dc2626;font-size:64px;font-weight:900;letter-spacing:8px;margin:0;text-shadow:2px 2px 0 rgba(220,38,38,0.2)">A N U L A D A</p></div>` : ''}
      <div style="display:flex;justify-content:space-around;margin-top:40px">
        <div style="text-align:center;width:200px"><div style="border-top:1px solid #000;padding-top:4px;font-size:11px">Elaborado por</div><p style="font-weight:700;font-size:11px">${cot.vendedor || cot.responsable}</p></div>
        <div style="text-align:center;width:200px"><div style="border-top:1px solid #000;padding-top:4px;font-size:11px">Aprobado por</div></div>
      </div>
      <script>window.onload=()=>window.print()<\/script></body></html>`
    const win = window.open('', '_blank', 'width=900,height=700')
    if (win) { win.document.write(html); win.document.close() }
  }

  const statusStyle = (s: string): React.CSSProperties => {
    const map: Record<string, React.CSSProperties> = {
      'Borrador': { background: 'transparent', color: '#9ca3af', border: '1px solid #9ca3af' },
      'En Construcción': { background: 'transparent', color: '#3b82f6', border: '1px solid #3b82f6' },
      'Anulada': { background: 'transparent', color: '#b45309', border: '1px solid #b45309', textDecoration: 'line-through' },
      'Enviada': { background: 'transparent', color: '#10b981', border: '1px solid #10b981' },
      'Aprobada': { background: 'transparent', color: '#059669', border: '1px solid #059669' },
      'Rechazada': { background: 'transparent', color: '#dc2626', border: '1px solid #dc2626' },
      'Vencida': { background: 'transparent', color: '#f59e0b', border: '1px solid #f59e0b' },
    }
    return map[s] || {}
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, background: '#ffffff', border: '1px solid #1e3a8a', color: '#1e3a8a', fontWeight: 600, fontSize: 13, outline: 'none' }
  const btnStyle: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }
  const tabBtnStyle = (active: boolean): React.CSSProperties => ({ ...btnStyle, background: active ? '#1e3a8a' : 'rgba(255,255,255,0.15)', color: active ? '#ffffff' : '#0f172a', border: active ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.2)' })
  const refOptions = (table: string) => (refData[table as keyof typeof refData] || []).filter(r => r.situacion).map(r => r.descripcion)

  const sendWhatsApp = (cot: Cotizacion) => {
    const contacto = allContactos.find(c => c.id === cot.contacto_id)
    const cliente = clientes.find(c => c.id === cot.cliente_id)
    const celular = contacto?.celular || cliente?.telefono || ''
    if (!celular) { alert('No se encontró número de celular del contacto o empresa'); return }
    const numero = celular.replace(/[^0-9]/g, '')
    const { subtotal, impuesto, total } = calcTotals(cot.detalles, cot.pct_impuesto)
    const sym = monedaSimbolo(cot.tipo_moneda)
    const items = cot.detalles.map(d => `  - ${d.descripcion}: ${d.cantidad} x ${sym}${fmtMoney(d.precio_unitario)} = ${sym}${fmtMoney(d.subtotal)}`).join('\n')
    const mensaje = `Hola, le enviamos la cotización *${cot.codigo}*\n\n` +
      `*Empresa:* ${cot.cliente_nombre}\n` +
      `*Fecha:* ${fDate(cot.fecha_emision)}\n` +
      `*Condición de Pago:* ${cot.condicion_pago}\n` +
      `*Moneda:* ${cot.tipo_moneda}\n\n` +
      `*Detalle:*\n${items}\n\n` +
      `*Subtotal:* ${sym}${fmtMoney(subtotal)}\n` +
      `*Impuesto (${cot.pct_impuesto}%):* ${sym}${fmtMoney(impuesto)}\n` +
      `*TOTAL: ${sym}${fmtMoney(total)}*\n\n` +
      (cot.observaciones ? `_${cot.observaciones}_\n\n` : '') +
      `Vendedor: ${cot.vendedor || cot.responsable}`
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`, '_blank')
  }

  const contactosDelCliente = selected ? allContactos.filter(c => c.cliente_id === selected.cliente_id) : []
  const oposDelCliente = selected ? oportunidades.filter(o => o.cliente_id === selected.cliente_id) : []

  // ── EMAIL MODAL ──
  if (emailModal) {
    const cli = clientes.find(c => c.id === emailModal.cliente_id)
    const con = allContactos.find(c => c.id === emailModal.contacto_id)
    return (
      <div>
        <button onClick={() => setEmailModal(null)} style={{ ...btnStyle, background: '#000000', color: '#ffffff', border: '1px solid #333333', marginBottom: 16 }}>{t('btn.volver')}</button>
        <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, border: '1px solid #1e3a8a', maxWidth: 500 }}>
          <h2 style={{ color: '#013978', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Enviar {emailModal.codigo} por Email</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.para')} *</label>
              <input type="email" value={emailTo} onChange={e => setEmailTo(e.target.value)} placeholder={con?.email || cli?.email || 'correo@ejemplo.com'} required style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.asunto')}</label>
              <input value={emailAsunto} onChange={e => setEmailAsunto(e.target.value)} placeholder={`Cotización ${emailModal.codigo}`} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.mensaje')}</label>
              <textarea value={emailMsg} onChange={e => setEmailMsg(e.target.value)} rows={4} placeholder="Mensaje adicional..." style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <button onClick={handleSendEmail} disabled={sending || !emailTo}
              style={{ ...btnStyle, background: sending ? '#16a34a' : '#22c55e', color: '#ffffff', marginTop: 8 }}>
              {sending ? 'Enviando...' : 'Enviar Cotización'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── VIEW DETAIL ──
  if (viewDetail) {
    const { subtotal, impuesto, total } = calcTotals(viewDetail.detalles, viewDetail.pct_impuesto)
    return (
      <div>
        <button onClick={() => { const back = searchParams.get("back"); if (back) { router.push(back); return } setViewDetail(null) }} style={{ ...btnStyle, background: "#000000", color: "#ffffff", border: "1px solid #333333", marginBottom: 16 }}>{t('btn.volver')}</button>
        <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, border: '1px solid #1e3a8a' }}>
          {empresa && (
            <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
              <p style={{ color: '#013978', fontSize: 16, fontWeight: 800 }}>{empresa.nombre}</p>
              <p style={{ color: '#013978', fontSize: 12 }}>{empresa.direccion}{empresa.ciudad ? ', ' + empresa.ciudad : ''}</p>
              <p style={{ color: '#013978', fontSize: 12 }}>NIT: {empresa.nro_documento}</p>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ color: '#013978', fontSize: 20, fontWeight: 700 }}>{viewDetail.codigo}</h2>
              <p style={{ color: '#013978', fontSize: 13 }}>{viewDetail.cliente_nombre}</p>
            </div>
            <span style={{ padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, ...statusStyle(viewDetail.situacion) }}>{viewDetail.situacion}</span>
          </div>
          {(() => {
            const cli = clientes.find(c => c.id === viewDetail.cliente_id)
            return (
              <div style={{ background: '#ffffff', borderRadius: 10, padding: 14, marginBottom: 16, border: '1px solid #1e3a8a' }}>
                <p style={{ color: '#013978', fontSize: 11, fontWeight: 700, marginBottom: 10, letterSpacing: 0.5 }}>DATOS DEL CLIENTE</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 }}>
                  {[
                    { l: t('lbl.empresa'), v: viewDetail.cliente_nombre },
                    { l: t('lbl.tipoIdentificacion'), v: cli?.tipo_identificacion },
                    { l: t('lbl.nroDocumento'), v: cli?.nro_documento },
                    { l: t('lbl.direccion'), v: cli?.direccion },
                    { l: t('lbl.ciudad'), v: cli?.ciudad },
                    { l: t('lbl.pais'), v: cli?.pais },
                    { l: t('lbl.contacto'), v: viewDetail.contacto_nombre },
                  ].map(f => (
                    <div key={f.l}><p style={{ color: '#013978', fontSize: 16, fontWeight: 900 }}>{f.l}</p><p style={{ color: '#013978', fontSize: 13 }}>{f.v || '—'}</p></div>
                  ))}
                </div>
              </div>
            )
          })()}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
            {[
              { l: t('lbl.fechaEmision'), v: fDate(viewDetail.fecha_emision) }, { l: t('lbl.fechaVencimiento'), v: fDate(viewDetail.fecha_vencimiento) },
              { l: t('lbl.condicionPago'), v: viewDetail.condicion_pago },
              { l: t('lbl.vendedor'), v: viewDetail.vendedor },
              { l: t('lbl.oportunidad'), v: viewDetail.oportunidad_nombre },
            ].map(f => (
              <div key={f.l}><p style={{ color: '#013978', fontSize: 16, fontWeight: 900 }}>{f.l}</p><p style={{ color: '#013978', fontSize: 13 }}>{f.v || '—'}</p></div>
            ))}
          </div>

          {/* Detalles table */}
          <div style={{ borderRadius: 10, border: '1px solid #1e3a8a', overflow: 'hidden', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                {[t('lbl.codigo'), t('lbl.descripcion'), idioma === 'en' ? 'Qty.' : 'Cant.', t('lbl.unidadMedida'), idioma === 'en' ? 'Unit Price' : 'Precio Unit.', idioma === 'en' ? 'Disc.%' : 'Desc.%', t('lbl.subtotal')].map(h => (
                  <th key={h} style={{ padding: '10px 12px', background: '#1e3a8a', color: '#fff', fontSize: 11, textAlign: 'left' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {viewDetail.detalles.map((d, i) => (
                  <tr key={d.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 12, fontFamily: 'monospace' }}>{d.codigo_producto}</td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 12 }}>{d.descripcion}</td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 12, textAlign: 'center' }}>{d.cantidad}</td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 12, textAlign: 'center' }}>{d.unidad_medida}</td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 12, textAlign: 'right' }}>{monedaSimbolo(viewDetail.tipo_moneda)}{fmtMoney(d.precio_unitario)}</td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 12, textAlign: 'center' }}>{d.descuento_pct}%</td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 12, textAlign: 'right', fontWeight: 600 }}>{monedaSimbolo(viewDetail.tipo_moneda)}{fmtMoney(d.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ textAlign: 'right', marginBottom: 16 }}>
            <p style={{ color: '#013978', fontSize: 13 }}>Subtotal: <span style={{ color: '#013978', fontWeight: 600 }}>{monedaSimbolo(viewDetail.tipo_moneda)}{fmtMoney(subtotal)}</span></p>
            <div style={{ height: 12 }} />
            <p style={{ color: '#013978', fontSize: 13 }}>Impuesto ({viewDetail.pct_impuesto}%): <span style={{ color: '#013978', fontWeight: 600 }}>{monedaSimbolo(viewDetail.tipo_moneda)}{fmtMoney(impuesto)}</span></p>
            <div style={{ height: 12 }} />
            <p style={{ color: '#013978', fontSize: 18, fontWeight: 800, borderTop: '2px solid rgba(255,255,255,0.2)', paddingTop: 8 }}>TOTAL GENERAL: {monedaSimbolo(viewDetail.tipo_moneda)}{fmtMoney(total)}</p>
          </div>

          {viewDetail.observaciones && <p style={{ color: '#013978', fontSize: 13, marginBottom: 16 }}>Observaciones: {viewDetail.observaciones}</p>}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => generatePDF(viewDetail)} style={{ ...btnStyle, background: '#b91c1c', color: '#ffffff', border: '1px solid #dc2626' }}>PDF</button>
            <button onClick={() => { setEmailTo(''); setEmailAsunto(''); setEmailMsg(''); setEmailModal(viewDetail) }} style={{ ...btnStyle, background: '#1e3a8a', color: '#ffffff', border: '1px solid #3b82f6' }}>{t('btn.enviarEmail')}</button>
            <button onClick={() => sendWhatsApp(viewDetail)} style={{ ...btnStyle, background: '#25d366', color: '#ffffff', border: '1px solid #22c55e' }}>WhatsApp</button>
            <p style={{ color: '#64748b', fontSize: 12, marginTop: 12 }}>Creado por: <strong style={{ color: '#013978' }}>{viewDetail.creado_por || '—'}</strong>{viewDetail.creado_en ? ` · ${viewDetail.creado_en}` : ''}</p>
            {permisos.editar && !['Aprobada', 'Rechazada'].includes(viewDetail.situacion) && (
              <button onClick={() => { setSelected(viewDetail); setIsForm(true); setViewDetail(null) }} style={{ ...btnStyle, background: '#2563eb', color: '#ffffff', border: '1px solid #3b82f6' }}>{t('btn.editar')}</button>
            )}
          </div>
          <SeguimientoPanel
            seguimientos={viewDetail.seguimientos || []}
            usuario={`${currentUser?.nombre} ${currentUser?.apellido}`}
            situacionActual={viewDetail.situacion}
            situacionOpciones={refData.situacion_cotizacion.filter(r => r.situacion).map(r => r.descripcion)}
            onAdd={(seg: Seguimiento) => {
              const updated = { ...viewDetail, situacion: seg.situacion, seguimientos: [...(viewDetail.seguimientos || []), seg] }
              updateCotizacion(viewDetail.id, updated)
              setViewDetail(updated)
            }}
          />
          <DocumentosPanel modulo="cotizaciones" registroId={viewDetail.id} />
        </div>
      </div>
    )
  }

  // ── FORM ──
  if (isForm && selected) {
    const { subtotal, impuesto, total } = calcTotals(selected.detalles, selected.pct_impuesto)
    return (
      <div>
        <button onClick={() => { setIsForm(false); setSelected(null); setVerLectura(false) }} style={{ ...btnStyle, background: '#000000', color: '#ffffff', border: '1px solid #333333', marginBottom: 16 }}>{t('btn.volver')}</button>
        <form onSubmit={handleSave} style={{ background: '#ffffff', borderRadius: 16, padding: 24, border: '1px solid #1e3a8a' }}>
          <h2 style={{ color: '#013978', fontSize: 18, fontWeight: 700, marginBottom: 20, textAlign: 'center' }}>{verLectura ? 'Ver Cotización' : `${selected.id ? t('fmt.editarCotizacion') : t('fmt.nuevaCotizacion')} Nro ${selected.codigo}`}</h2>

          <fieldset disabled={verLectura} style={{ border: 'none', padding: 0, margin: 0, minInlineSize: 'auto' }}>
          {/* Header fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div style={{ gridColumn: 'span 3' }}>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.empresa')} *</label>
              <select value={selected.cliente_id} onChange={e => {
                const cli = clientes.find(c => c.id === e.target.value)
                setSelected({ ...selected, cliente_id: e.target.value, cliente_nombre: cli?.razon_social || '', contacto_id: '', contacto_nombre: '', oportunidad_id: '', oportunidad_nombre: '' })
              }} required style={inputStyle}>
                <option value="">Seleccionar empresa...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
              </select>
            </div>
            {selected.cliente_id && (() => {
              const cli =
                allClientes.find(c => c.id === selected.cliente_id) ||
                allClientes.find(c => c.razon_social === selected.cliente_nombre)
              return (
                <div style={{ gridColumn: 'span 3', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 10, padding: 12 }}>
                  <p style={{ color: '#013978', fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: 0.5 }}>DATOS DEL CLIENTE</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 12 }}>
                    {[
                      { l: 'Tipo ID', v: cli?.tipo_identificacion },
                      { l: 'Nro Documento', v: cli?.nro_documento },
                      { l: 'Dirección', v: cli?.direccion },
                      { l: 'Ciudad', v: cli?.ciudad },
                      { l: 'País', v: cli?.pais },
                    ].map(f => (
                      <div key={f.l}>
                        <p style={{ color: '#013978', fontSize: 10 }}>{f.l}</p>
                        <p style={{ color: '#013978', fontSize: 12, fontWeight: 600 }}>{f.v || '—'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.codigo')}</label>
              <input value={selected.codigo} readOnly style={{ ...inputStyle, opacity: 0.5 }} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.fechaRegistro')}</label>
              <input value={fDate(selected.fecha_registro || today)} readOnly style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.fechaEmision')}</label>
              <input type="date" value={selected.fecha_emision} onChange={e => setSelected({ ...selected, fecha_emision: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.fechaVencimiento')}</label>
              <input type="date" value={selected.fecha_vencimiento} onChange={e => setSelected({ ...selected, fecha_vencimiento: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.contacto')}</label>
              <select value={selected.contacto_id} onChange={e => {
                const con = contactosDelCliente.find(c => c.id === e.target.value)
                setSelected({ ...selected, contacto_id: e.target.value, contacto_nombre: con ? `${con.nombre} ${con.apellido}` : '' })
              }} style={inputStyle}>
                <option value="">{t("campo.seleccionar")}</option>
                {contactosDelCliente.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.oportunidad')}</label>
              <select value={selected.oportunidad_id} onChange={e => {
                const opo = oportunidades.find(o => o.id === e.target.value)
                setSelected({ ...selected, oportunidad_id: e.target.value, oportunidad_nombre: opo?.proyecto || '' })
              }} style={inputStyle}>
                <option value="">Ninguna</option>
                {(oposDelCliente.length > 0 ? oposDelCliente : oportunidades).map(o => <option key={o.id} value={o.id}>{o.proyecto}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.condicionPagoCorta')}</label>
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
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>% Impuesto</label>
              <input type="number" step="0.01" min="0" value={selected.pct_impuesto} onChange={e => setSelected({ ...selected, pct_impuesto: parseFloat(e.target.value) || 0 })} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.vendedor')}</label>
              <select value={selected.vendedor} onChange={e => setSelected({ ...selected, vendedor: e.target.value })} style={inputStyle}>
                <option value="">{t("campo.seleccionar")}</option>
                {vendedores.map(v => <option key={v.id} value={`${v.nombre} ${v.apellido}`}>{v.codigo} - {v.nombre} {v.apellido}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.situacion')}</label>
              <select value={selected.situacion} onChange={e => setSelected({ ...selected, situacion: e.target.value })} style={inputStyle}>
                {refOptions('situacion_cotizacion').map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* Buscar y agregar producto */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ color: '#013978', fontSize: 14, fontWeight: 600, margin: 0 }}>{idioma === 'en' ? 'Product Detail' : 'Detalle de Productos'}</h3>
            <button type="button" onClick={() => { setShowProductos(!showProductos); setSearchProd('') }}
              style={{ padding: '8px 18px', borderRadius: 8, background: showProductos ? '#dc2626' : '#1e3a8a', color: '#ffffff', border: showProductos ? '1px solid #ef4444' : '1px solid #3b82f6', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {showProductos ? '✕ Cerrar' : '+ Agregar Productos'}
            </button>
          </div>
          {showProductos && (
            <div style={{ marginBottom: 12 }}>
              <input value={searchProd} onChange={e => setSearchProd(e.target.value)} placeholder="Buscar producto por código o descripción..." style={{ ...inputStyle, maxWidth: 500, marginBottom: 8 }} autoFocus />
              <div style={{ background: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, maxHeight: 220, overflow: 'auto' }}>
                {productos.filter(p => p.situacion === 'Activo').filter(p => !searchProd || p.descripcion.toLowerCase().includes(searchProd.toLowerCase()) || p.codigo.toLowerCase().includes(searchProd.toLowerCase())).slice(0, 20).map(p => (
                  <div key={p.id} onClick={() => {
                    if (!selected) return
                    const nuevo = recalcDetalle({ id: crypto.randomUUID(), producto_id: p.id, codigo_producto: p.codigo, descripcion: p.descripcion, cantidad: 1, precio_unitario: p.precio_unitario, unidad_medida: p.unidad_medida, descuento_pct: 0, subtotal: 0 })
                    const detalles = selected.detalles.filter(d => d.producto_id)
                    setSelected({ ...selected, detalles: [...detalles, nuevo] })
                  }} style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 12, color: '#013978', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.15)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <span><span style={{ color: '#013978', fontFamily: 'monospace', marginRight: 8 }}>{p.codigo}</span>{p.descripcion}</span>
                    <span style={{ color: '#013978', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: 12 }}>{monedaSimbolo(selected.tipo_moneda)}{fmtMoney(p.precio_unitario)}</span>
                  </div>
                ))}
                {productos.filter(p => p.situacion === 'Activo').filter(p => !searchProd || p.descripcion.toLowerCase().includes(searchProd.toLowerCase()) || p.codigo.toLowerCase().includes(searchProd.toLowerCase())).length === 0 && (
                  <div style={{ padding: '16px 14px', color: '#013978', fontSize: 12, textAlign: 'center' }}>No se encontraron productos</div>
                )}
              </div>
            </div>
          )}

          {/* Tabla de items */}
          {selected.detalles.filter(d => d.producto_id).length > 0 && (
            <div style={{ borderRadius: 10, border: '1px solid #1e3a8a', overflow: 'hidden', marginBottom: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  {[t('lbl.codigo'), t('lbl.descripcion'), idioma === 'en' ? 'Qty.' : 'Cant.', t('lbl.unidadMedida'), idioma === 'en' ? 'Unit Price' : 'Precio Unit.', idioma === 'en' ? 'Disc.%' : 'Desc.%', t('lbl.subtotal'), ''].map(h => (
                    <th key={h} style={{ padding: '8px 10px', background: '#1e3a8a', color: '#fff', fontSize: 11, textAlign: 'left' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {selected.detalles.filter(d => d.producto_id).map((d, idx) => {
                    const realIdx = selected.detalles.findIndex(x => x.id === d.id)
                    return (
                      <tr key={d.id} style={{ background: idx % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 12, fontFamily: 'monospace', width: 100 }}>{d.codigo_producto}</td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 12 }}>{d.descripcion}</td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0', width: 80 }}>
                          <input type="number" min="1" value={d.cantidad} onChange={e => updateDetalle(realIdx, 'cantidad', parseInt(e.target.value) || 1)} style={{ ...inputStyle, fontSize: 12, padding: '4px 6px', textAlign: 'center' }} />
                        </td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 12, width: 70 }}>{d.unidad_medida}</td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0', width: 110 }}>
                          <input type="number" step="0.01" min="0" value={d.precio_unitario || ''} onChange={e => updateDetalle(realIdx, 'precio_unitario', parseFloat(e.target.value) || 0)} style={{ ...inputStyle, fontSize: 12, padding: '4px 6px', textAlign: 'right' }} />
                        </td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0', width: 70 }}>
                          <input type="number" step="0.1" min="0" max="100" value={d.descuento_pct} onChange={e => updateDetalle(realIdx, 'descuento_pct', parseFloat(e.target.value) || 0)} style={{ ...inputStyle, fontSize: 12, padding: '4px 6px', textAlign: 'center' }} />
                        </td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 12, fontWeight: 600, textAlign: 'right', width: 110 }}>{monedaSimbolo(selected.tipo_moneda)}{fmtMoney(d.subtotal)}</td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0', width: 40 }}>
                          <button type="button" onClick={() => removeDetalle(realIdx)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: 16 }}>×</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          <div style={{ textAlign: 'right', marginBottom: 16 }}>
            <p style={{ color: '#013978', fontSize: 13 }}>Subtotal: <span style={{ color: '#013978', fontWeight: 600 }}>{monedaSimbolo(selected.tipo_moneda)}{fmtMoney(subtotal)}</span></p>
            <p style={{ color: '#013978', fontSize: 13 }}>Impuesto ({selected.pct_impuesto}%): <span style={{ color: '#013978', fontWeight: 600 }}>{monedaSimbolo(selected.tipo_moneda)}{fmtMoney(impuesto)}</span></p>
            <p style={{ color: '#013978', fontSize: 18, fontWeight: 800, marginTop: 4 }}>TOTAL: {monedaSimbolo(selected.tipo_moneda)}{fmtMoney(total)}</p>
          </div>

          <div style={{ gridColumn: 'span 3', marginBottom: 16 }}>
            <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.observaciones')}</label>
            <textarea value={selected.observaciones} onChange={e => setSelected({ ...selected, observaciones: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          </fieldset>
          <div style={{ display: 'flex', gap: 10 }}>
            {!verLectura && <button type="submit" style={{ ...btnStyle, background: '#1e3a8a', color: '#ffffff' }}>{t('btn.guardar')}</button>}
            <button type="button" onClick={() => { setIsForm(false); setSelected(null); setVerLectura(false) }} style={{ ...btnStyle, background: '#64748b', color: '#ffffff' }}>{verLectura ? t('btn.volver') : t('btn.cancelar')}</button>
          </div>
        </form>
        {selected.id && <DocumentosPanel modulo="cotizaciones" registroId={selected.id} />}
      </div>
    )
  }

  // ── REPORT DATA ──
  const reportColumns = [
    { header: 'Código', key: 'codigo', width: 12 },
    { header: 'Empresa', key: 'cliente_nombre', width: 22 },
    { header: 'Emisión', key: 'emision', width: 10 },
    { header: 'Vence', key: 'vence', width: 10 },
    { header: 'Items', key: 'items', width: 6 },
    { header: 'Total', key: 'total', width: 14 },
    { header: 'Situación', key: 'situacion', width: 10 },
  ]
  const reportRows = filtered.map(c => {
    const { total } = calcTotals(c.detalles, c.pct_impuesto)
    return {
      codigo: c.codigo, cliente_nombre: c.cliente_nombre, emision: fDate(c.fecha_emision),
      vence: fDate(c.fecha_vencimiento), items: c.detalles.length, total: `${monedaSimbolo(c.tipo_moneda)}${fmtMoney(total)}`,
      situacion: c.situacion,
    }
  })

  // ── MAIN VIEW ──
  return (
    <div>
      <ModuleHeader title={t('page.cotizaciones.title')} subtitle={t('page.cotizaciones.subtitle')} />

      {permisos.editar && tab === 'registros' && (
        <div style={{ marginBottom: 20 }}>
          <button onClick={() => { { const nc = nextConsecutivo('COT-', cotizaciones.map(c => c.codigo)); setSelected(emptyCotizacion(nc.codigo, nc.nro, `${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`)) }; setIsForm(true) }} style={{ ...btnStyle, background: '#1e3a8a', color: '#ffffff' }}>{t('page.cotizaciones.btnNuevo')}</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setTab('registros')} style={tabBtnStyle(tab === 'registros')}>📋 {t('tab.registros')}</button>
        <button onClick={() => setTab('reportes')} style={tabBtnStyle(tab === 'reportes')}>📊 {t('tab.reportes')}</button>
      </div>

      {tab === 'registros' && (
        <>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('ph.buscarCotizacion')}
            style={{ ...inputStyle, maxWidth: 400, marginBottom: 16 }} />
          <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                {[t('lbl.codigo'), t('lbl.empresa'), t('lbl.tipoIdentificacion'), t('lbl.nroDocumento'), t('lbl.direccion'), t('lbl.ciudad'), t('lbl.pais'), t('lbl.fechaEmision'), idioma === 'en' ? 'Expires' : 'Vence', idioma === 'en' ? 'Items' : 'Items', t('lbl.total'), t('lbl.situacion'), idioma === 'en' ? 'Actions' : 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', background: '#1e3a8a', color: '#fff', fontSize: 12, textAlign: 'left' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.map((c, i) => {
                  const { total } = calcTotals(c.detalles, c.pct_impuesto)
                  const cli = clientes.find(cl => cl.id === c.cliente_id)
                  return (
                    <tr key={c.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13, fontFamily: 'monospace' }}>{c.codigo}</td>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{c.cliente_nombre}</td>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{cli?.tipo_identificacion || ''}</td>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{cli?.nro_documento || ''}</td>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{cli?.direccion || ''}</td>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{cli?.ciudad || ''}</td>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{cli?.pais || ''}</td>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{fDate(c.fecha_emision)}</td>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{fDate(c.fecha_vencimiento)}</td>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13, textAlign: 'center' }}>{c.detalles.length}</td>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13, fontWeight: 600 }}>{monedaSimbolo(c.tipo_moneda)}{fmtMoney(total)}</td>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, ...statusStyle(c.situacion) }}>{ts(c.situacion)}</span>
                      </td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                          <button onClick={() => { setSelected(c); setVerLectura(true); setIsForm(true) }} style={{ ...btnStyle, padding: '3px 8px', fontSize: 9, background: '#ea580c', color: '#ffffff', border: '1px solid #f97316' }}>Ver</button>
                          <button onClick={() => generatePDF(c)} style={{ ...btnStyle, padding: '3px 8px', fontSize: 9, background: '#b91c1c', color: '#ffffff', border: '1px solid #dc2626' }}>PDF</button>
                          <button onClick={() => { setEmailTo(''); setEmailAsunto(''); setEmailMsg(''); setEmailModal(c) }} style={{ ...btnStyle, padding: '3px 8px', fontSize: 9, background: '#1e3a8a', color: '#ffffff', border: '1px solid #3b82f6' }}>Mail</button>
                          {(() => {
                            const con = allContactos.find(x => x.id === c.contacto_id)
                            const cli = allClientes.find(x => x.id === c.cliente_id)
                            const phone = con?.celular || con?.telefono || cli?.telefono || ''
                            const nombre = con ? con.nombre : (cli?.razon_social || c.cliente_nombre || '')
                            if (!isValidPhone(phone)) return null
                            const msg = idioma === 'en'
                              ? `Hi ${nombre}, we are sending you the quote ${c.codigo}.`
                              : `Hola ${nombre}, te enviamos la cotización ${c.codigo}.`
                            return (
                              <a href={buildWhatsAppLink(phone, msg)} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle, padding: '3px 8px', fontSize: 9, background: '#25d366', color: '#ffffff', border: '1px solid #128c7e', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>WA</a>
                            )
                          })()}
                          {permisos.editar && !['Aprobada', 'Rechazada'].includes(c.situacion) && (
                            <button onClick={() => { setSelected(c); setIsForm(true) }} style={{ ...btnStyle, padding: '3px 8px', fontSize: 9, background: '#15803d', color: '#ffffff', border: '1px solid #16a34a' }}>Edit</button>
                          )}
                          {permisos.eliminar && c.situacion !== 'Anulada' && (
                            <button onClick={() => {
                              const motivo = prompt(`¿Anular cotización ${c.codigo}?\n\nMotivo (opcional):`, '')
                              if (motivo === null) return
                              const nota = motivo.trim() ? `\n\n[ANULADA] Motivo: ${motivo.trim()}` : '\n\n[ANULADA]'
                              updateCotizacion(c.id, { situacion: 'Anulada', observaciones: (c.observaciones || '') + nota })
                            }} style={{ ...btnStyle, padding: '3px 8px', fontSize: 9, background: '#78350f', color: '#ffffff', border: '1px solid #b45309' }}>Anul</button>
                          )}
                          {permisos.eliminar && (
                            <button onClick={() => {
                              if (confirm(`¿Eliminar definitivamente la cotización ${c.codigo}? Esta acción no se puede deshacer.`)) {
                                deleteCotizacion(c.id)
                                logAudit({ ...auditParams(), accion: 'ELIMINAR', registro_codigo: c.codigo, registro_nombre: c.cliente_nombre })
                              }
                            }} style={{ ...btnStyle, padding: '3px 8px', fontSize: 9, background: '#dc2626', color: '#ffffff', border: '1px solid #ef4444' }}>{idioma === 'en' ? 'Del' : 'Elim'}</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && <tr><td colSpan={13} style={{ padding: 32, textAlign: 'center', color: '#013978', fontSize: 14 }}>No hay cotizaciones registradas</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'reportes' && (
        <ReportPanel title="Reporte de Cotizaciones" columns={reportColumns} rows={reportRows}
          filters={[{ label: 'Situación', key: 'situacion', options: [...new Set(cotizaciones.map(c => c.situacion).filter(Boolean))] }]} />
      )}
    </div>
  )
}
