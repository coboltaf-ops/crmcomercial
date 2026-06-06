'use client'
import { useState, useRef, useEffect } from 'react'
import DocumentosPanel from '@/shared/components/documentos-panel'
import { useEmpresaStore, Empresa } from '@/features/empresa/store/empresa-store'
import { useReferenceStore } from '@/features/referencias/store/reference-store'
import { useCurrentUserStore } from '@/features/usuarios-gestion/store/current-user-store'
import { usePermisos } from '@/shared/hooks/use-permisos'
import { nextConsecutivo } from '@/shared/lib/consecutivo'
import SeguimientoPanel from '@/shared/components/seguimiento-panel'
import { Seguimiento } from '@/shared/types/seguimiento'
import { useT, useIdioma, useTStatus } from '@/shared/i18n/use-t'

export default function DatosEmpresaPage() {
  const t = useT()
  const ts = useTStatus()
  const idioma = useIdioma()
  const permisos = usePermisos('datos-empresa')
  const currentUser = useCurrentUserStore(s => s.user)
  const { empresas, addEmpresa, updateEmpresa, deleteEmpresa, loadEmpresas } = useEmpresaStore()
  const refData = useReferenceStore(s => s.data)
  const fileRef = useRef<HTMLInputElement>(null)

  const [selected, setSelected] = useState<Empresa | null>(null)
  const [isForm, setIsForm] = useState(false)
  const [viewDetail, setViewDetail] = useState<Empresa | null>(null)

  // Cargar datos de empresa desde KV al abrir la página
  useEffect(() => {
    loadEmpresas()
  }, [loadEmpresas])

  if (currentUser?.rol.toLowerCase() !== 'admin') {
    return <div style={{ color: '#013978', padding: 40, textAlign: 'center' }}>{idioma === 'en' ? 'You do not have access to this section' : 'No tienes acceso a esta sección'}</div>
  }

  const emptyEmpresa = (): Empresa => {
    const nc = nextConsecutivo('EMP-', empresas.map(e => e.codigo))
    return {
      id: '', codigo: nc.codigo, nombre: '', tipo_identificacion: 'NIT', nro_documento: '',
      correo: '', telefono: '', nro_movil: '', pagina_web: '', logo_url: '', representante_legal: '',
      direccion: '', ciudad: '', pais: 'Colombia', codigo_postal: '',
      situacion: 'Activo', seguimientos: [],
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    if (selected.id) {
      updateEmpresa(selected.id, selected)
    } else {
      addEmpresa({ ...selected, id: crypto.randomUUID() })
    }
    setIsForm(false); setSelected(null)
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selected) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      // Redimensionar el logo a máx. 300px para que sea ligero y quepa en KV
      const img = new Image()
      img.onload = () => {
        const MAX = 300
        let { width, height } = img
        if (width > height && width > MAX) { height = (height * MAX) / width; width = MAX }
        else if (height > MAX) { width = (width * MAX) / height; height = MAX }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) { setSelected({ ...selected, logo_url: ev.target?.result as string }); return }
        ctx.drawImage(img, 0, 0, width, height)
        setSelected({ ...selected, logo_url: canvas.toDataURL('image/png') })
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const refOptions = (table: string) => (refData[table as keyof typeof refData] || []).filter(r => r.situacion).map(r => r.descripcion)

  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', fontSize: 13, outline: 'none' }
  const btnStyle: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }
  const labelStyle: React.CSSProperties = { color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }

  // ── VIEW DETAIL ──
  if (viewDetail) {
    return (
      <div>
        <button onClick={() => setViewDetail(null)} style={{ ...btnStyle, background: '#000000', color: '#ffffff', border: '1px solid #333333', marginBottom: 16 }}>{t('btn.volver')}</button>
        <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, border: '1px solid #1e3a8a' }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 20 }}>
            {viewDetail.logo_url ? (
              <img src={viewDetail.logo_url} alt="Logo" style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'contain', background: 'rgba(255,255,255,0.1)', padding: 8 }} />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: 12 }}>{t('lbl.sinLogo')}</div>
            )}
            <div>
              <h2 style={{ color: '#013978', fontSize: 20, fontWeight: 700 }}>{viewDetail.nombre}</h2>
              <p style={{ color: '#013978', fontSize: 13 }}>{viewDetail.codigo}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {[
              { label: t('lbl.codigo'), value: viewDetail.codigo },
              { label: t('lbl.tipoIdentificacion'), value: viewDetail.tipo_identificacion },
              { label: t('lbl.nroDocumento'), value: viewDetail.nro_documento },
              { label: t('lbl.correo'), value: viewDetail.correo },
              { label: t('lbl.telefono'), value: viewDetail.telefono },
              { label: t('lbl.nroMovil'), value: viewDetail.nro_movil },
              { label: t('lbl.paginaWeb'), value: viewDetail.pagina_web },
              { label: t('lbl.representanteLegal'), value: viewDetail.representante_legal },
            ].map(f => (
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

          <button onClick={() => { setSelected(viewDetail); setIsForm(true); setViewDetail(null) }} style={{ ...btnStyle, background: '#15803d', color: '#ffffff', border: '1px solid #16a34a', marginTop: 16 }}>{t('btn.editar')}</button>
          <SeguimientoPanel
            seguimientos={viewDetail.seguimientos || []}
            usuario={`${currentUser?.nombre} ${currentUser?.apellido}`}
            situacionActual={viewDetail.situacion || 'Activo'}
            situacionOpciones={['Activo', 'Inactivo', 'Suspendida']}
            onAdd={(seg: Seguimiento) => {
              const updated = { ...viewDetail, situacion: seg.situacion, seguimientos: [...(viewDetail.seguimientos || []), seg] }
              updateEmpresa(viewDetail.id, updated)
              setViewDetail(updated)
            }}
          />
          <DocumentosPanel modulo="datos-empresa" registroId={viewDetail.id} />
        </div>
      </div>
    )
  }

  // ── FORM ──
  if (isForm && selected) {
    return (
      <div>
        <button onClick={() => { setIsForm(false); setSelected(null) }} style={{ ...btnStyle, background: '#000000', color: '#ffffff', border: '1px solid #333333', marginBottom: 16 }}>{t('btn.volver')}</button>
        <form onSubmit={handleSave} style={{ background: '#ffffff', borderRadius: 16, padding: 24, border: '1px solid #1e3a8a' }}>
          <h2 style={{ color: '#013978', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{selected.id ? 'Editar' : 'Nueva'} Empresa</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>{t('lbl.codigo')}</label>
              <input value={selected.codigo} readOnly style={{ ...inputStyle, opacity: 0.5 }} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>{t('lbl.nombreEmpresa')} *</label>
              <input value={selected.nombre} onChange={e => setSelected({ ...selected, nombre: e.target.value.toUpperCase() })} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('lbl.tipoIdentificacion')}</label>
              <select value={selected.tipo_identificacion} onChange={e => setSelected({ ...selected, tipo_identificacion: e.target.value })} style={inputStyle}>
                {refOptions('tipo_identificacion').map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t('lbl.nroDocumento')} *</label>
              <input value={selected.nro_documento} onChange={e => setSelected({ ...selected, nro_documento: e.target.value })} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('lbl.correoEmpresa')}</label>
              <input type="email" value={selected.correo} onChange={e => setSelected({ ...selected, correo: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('lbl.telefonoEmpresa')}</label>
              <input value={selected.telefono} onChange={e => setSelected({ ...selected, telefono: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('lbl.nroMovil')}</label>
              <input value={selected.nro_movil} onChange={e => setSelected({ ...selected, nro_movil: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('lbl.paginaWeb')}</label>
              <input value={selected.pagina_web} onChange={e => setSelected({ ...selected, pagina_web: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('lbl.representanteLegal')}</label>
              <input value={selected.representante_legal} onChange={e => setSelected({ ...selected, representante_legal: e.target.value.toUpperCase() })} style={inputStyle} />
            </div>

            {/* Logo */}
            <div style={{ gridColumn: 'span 3' }}>
              <label style={labelStyle}>{t('lbl.logoEmpresa')}</label>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                {selected.logo_url ? (
                  <img src={selected.logo_url} alt="Logo" style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'contain', background: 'rgba(255,255,255,0.1)', padding: 8 }} />
                ) : (
                  <div style={{ width: 80, height: 80, borderRadius: 12, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: 11 }}>{t('lbl.sinLogo')}</div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                  <button type="button" onClick={() => fileRef.current?.click()} style={{ ...btnStyle, background: '#15803d', color: '#ffffff', border: '1px solid #16a34a' }}>Subir Logo</button>
                  {selected.logo_url && <button type="button" onClick={() => setSelected({ ...selected, logo_url: '' })} style={{ ...btnStyle, background: '#dc2626', color: '#ffffff', border: '1px solid #ef4444' }}>{idioma === 'en' ? 'Remove' : 'Quitar'}</button>}
                </div>
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div style={{ marginTop: 20, padding: 16, background: '#f1f5f9', borderRadius: 12, border: '1px solid #1e3a8a' }}>
            <h3 style={{ color: '#013978', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{t('lbl.ubicacion')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: 'span 3' }}>
                <label style={labelStyle}>{t('lbl.direccion')}</label>
                <input value={selected.direccion} onChange={e => setSelected({ ...selected, direccion: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{t('lbl.ciudad')}</label>
                <select value={selected.ciudad} onChange={e => setSelected({ ...selected, ciudad: e.target.value })} style={inputStyle}>
                  <option value="">{t("campo.seleccionar")}</option>
                  {refOptions('ciudad').map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>{t('lbl.pais')}</label>
                <select value={selected.pais} onChange={e => setSelected({ ...selected, pais: e.target.value })} style={inputStyle}>
                  <option value="">{t("campo.seleccionar")}</option>
                  {refOptions('pais').map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>{t('lbl.codigoPostal')}</label>
                <input value={selected.codigo_postal} onChange={e => setSelected({ ...selected, codigo_postal: e.target.value })} style={inputStyle} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="submit" style={{ ...btnStyle, background: '#1e3a8a', color: '#ffffff' }}>{t('btn.guardar')}</button>
            <button type="button" onClick={() => { setIsForm(false); setSelected(null) }} style={{ ...btnStyle, background: '#64748b', color: '#ffffff' }}>{t('btn.cancelar')}</button>
          </div>
        </form>
        {selected.id && <DocumentosPanel modulo="datos-empresa" registroId={selected.id} />}
      </div>
    )
  }

  // ── MAIN VIEW ──
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#013978', marginBottom: 4 }}>{t('page.miEmpresa.title')}</h1>
          <p style={{ color: '#013978', fontSize: 14 }}>{t('page.miEmpresa.subtitle')}</p>
        </div>
        <button onClick={() => { setSelected(emptyEmpresa()); setIsForm(true) }} style={{ ...btnStyle, background: '#1e3a8a', color: '#ffffff' }}>+ {t('btn.nuevo')}</button>
      </div>

      <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Logo', 'Código', 'Nombre', 'Documento', 'Correo', 'Teléfono', 'Rep. Legal', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '12px 14px', background: '#1e3a8a', color: '#fff', fontSize: 12, textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {empresas.map((emp, i) => (
              <tr key={emp.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0' }}>
                  {emp.logo_url ? (
                    <img src={emp.logo_url} alt="Logo" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'contain', background: 'rgba(255,255,255,0.1)' }} />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: 9 }}>—</div>
                  )}
                </td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 12, fontFamily: 'monospace' }}>{emp.codigo}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 12, fontWeight: 600 }}>{emp.nombre}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 12 }}>{emp.tipo_identificacion} {emp.nro_documento}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 12 }}>{emp.correo}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 12 }}>{emp.telefono}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 12 }}>{emp.representante_legal}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => setViewDetail(emp)} style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#ea580c', color: '#ffffff', border: '1px solid #f97316' }}>{idioma === 'en' ? 'View' : 'Ver'}</button>
                    <button onClick={() => { setSelected(emp); setIsForm(true) }} style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#15803d', color: '#ffffff', border: '1px solid #16a34a' }}>{t('btn.editar')}</button>
                    <button onClick={() => { if (confirm(idioma === 'en' ? `Delete "${emp.nombre}"?` : `¿Eliminar "${emp.nombre}"?`)) deleteEmpresa(emp.id) }} style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#dc2626', color: '#ffffff', border: '1px solid #ef4444' }}>{t('btn.eliminar')}</button>
                  </div>
                </td>
              </tr>
            ))}
            {empresas.length === 0 && <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#013978', fontSize: 14 }}>No hay empresas registradas</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
