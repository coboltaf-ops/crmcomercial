'use client'
import { useState, useEffect, useMemo } from 'react'
import ModuleHeader from '@/shared/components/module-header'
import { useSubcontratistasStore, Subcontratista } from '@/features/subcontratistas/store/subcontratistas-store'
import { useCurrentUserStore } from '@/features/usuarios-gestion/store/current-user-store'
import { usePermisos } from '@/shared/hooks/use-permisos'
import { nextConsecutivo } from '@/shared/lib/consecutivo'
import { todayColombia } from '@/shared/lib/format-date'
import { useIdioma } from '@/shared/i18n/use-t'
import { PAISES_ACTIVOS, esGlobal, etiquetaPais } from '@/shared/lib/paises'

const TIPOS_SUBCONTRATISTA = ['Persona Natural', 'Persona Jurídica']
const TIPOS_IDENTIFICACION = ['DNI', 'RUC', 'Carné de Extranjería', 'Pasaporte']

export default function SubcontratistasPage() {
  const idioma = useIdioma()
  const es = idioma !== 'en'
  const permisos = usePermisos('subcontratistas')
  const currentUser = useCurrentUserStore(s => s.user)
  const paisUsuario = currentUser?.pais || ''
  const usuarioGlobal = esGlobal(paisUsuario)

  const { subcontratistas, addSubcontratista, updateSubcontratista, deleteSubcontratista } = useSubcontratistasStore()
  const loadSubcontratistas = useSubcontratistasStore(s => s.loadSubcontratistas)

  const [q, setQ] = useState('')
  const [filtroPais, setFiltroPais] = useState('')  // solo lo usan usuarios GLOBAL
  const [detalle, setDetalle] = useState<Subcontratista | null>(null)
  const [selected, setSelected] = useState<Subcontratista | null>(null)  // form crear/editar
  const [isForm, setIsForm] = useState(false)

  useEffect(() => {
    loadSubcontratistas()
  }, [loadSubcontratistas])

  const emptySubcontratista = (): Subcontratista => ({
    id: '', codigo: nextConsecutivo('SUB-', subcontratistas.map(s => s.codigo)).codigo,
    tipo_subcontratista: 'Persona Jurídica', tipo_identificacion: 'RUC', nro_documento: '',
    correo: '', nro_celular: '', actividad: '', representante_legal: '', direccion: '', ciudad: '',
    // Usuario de país → su país; GLOBAL → primer país activo (puede cambiarlo).
    pais: usuarioGlobal ? (PAISES_ACTIVOS[0]?.codigo || 'Perú') : paisUsuario,
    situacion: 'Activo', creado_por_usuario: currentUser?.usuario || '',
    creado_en: todayColombia(), fecha_registro: todayColombia(),
  })

  const filtrados = useMemo(() => {
    let base = subcontratistas
    if (usuarioGlobal && filtroPais) base = base.filter(s => s.pais === filtroPais)
    const t = q.trim().toLowerCase()
    if (!t) return base
    return base.filter(s =>
      [s.codigo, s.representante_legal, s.nro_documento, s.actividad, s.ciudad, s.correo, s.nro_celular, s.pais]
        .filter(Boolean).join(' ').toLowerCase().includes(t),
    )
  }, [subcontratistas, q, filtroPais, usuarioGlobal])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    if (!selected.representante_legal.trim()) { alert(es ? 'El representante / razón social es obligatorio' : 'Representative / company name is required'); return }
    if (selected.id) updateSubcontratista(selected.id, selected)
    else addSubcontratista({ ...selected, id: crypto.randomUUID() })
    setIsForm(false); setSelected(null)
  }

  const handleDelete = (s: Subcontratista) => {
    if (confirm(es ? `¿Eliminar el contratista "${s.representante_legal}"?` : `Delete contractor "${s.representante_legal}"?`)) {
      deleteSubcontratista(s.id)
      if (detalle?.id === s.id) setDetalle(null)
    }
  }

  // ── Estilos base ──
  const th: React.CSSProperties = { padding: '12px 14px', background: '#1e3a8a', color: '#fff', fontSize: 12, textAlign: 'left', whiteSpace: 'nowrap' }
  const td: React.CSSProperties = { padding: '10px 14px', color: '#0f172a', fontSize: 13, borderBottom: '1px solid #e2e8f0' }
  const btn: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', border: 'none' }
  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, background: '#fff', border: '1px solid #1e3a8a', color: '#0f172a', fontSize: 13, outline: 'none' }
  const labelStyle: React.CSSProperties = { color: '#013978', fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block' }
  const badge = (activo: boolean): React.CSSProperties => ({
    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
    background: activo ? 'rgba(34,197,94,0.15)' : 'rgba(156,163,175,0.2)',
    color: activo ? '#15803d' : '#6b7280', border: `1px solid ${activo ? '#22c55e' : '#9ca3af'}`,
  })

  // ═══════════ FORMULARIO CREAR / EDITAR ═══════════
  if (isForm && selected) {
    const campos: { label: string; key: keyof Subcontratista }[] = [
      { label: es ? 'Representante / Razón Social' : 'Representative / Company', key: 'representante_legal' },
      { label: es ? 'Nro. Documento' : 'ID number', key: 'nro_documento' },
      { label: es ? 'Actividad' : 'Activity', key: 'actividad' },
      { label: es ? 'Correo' : 'Email', key: 'correo' },
      { label: es ? 'Nro. Celular' : 'Mobile', key: 'nro_celular' },
      { label: es ? 'Dirección' : 'Address', key: 'direccion' },
      { label: es ? 'Ciudad' : 'City', key: 'ciudad' },
    ]
    return (
      <div style={{ padding: 24 }}>
        <ModuleHeader title={es ? 'Contratistas' : 'Contractors'} subtitle={selected.id ? (es ? 'Editar contratista' : 'Edit contractor') : (es ? 'Nuevo contratista' : 'New contractor')} />
        <form onSubmit={handleSave} style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #1e3a8a', maxWidth: 900 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ color: '#013978', fontSize: 16, fontWeight: 700 }}>{selected.id ? (es ? 'Editar' : 'Edit') : (es ? 'Nuevo' : 'New')} · {selected.codigo}</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>{es ? 'Tipo de Contratista' : 'Contractor type'}</label>
              <select value={selected.tipo_subcontratista} onChange={e => setSelected({ ...selected, tipo_subcontratista: e.target.value })} style={inputStyle}>
                {TIPOS_SUBCONTRATISTA.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{es ? 'Tipo de Identificación' : 'ID type'}</label>
              <select value={selected.tipo_identificacion} onChange={e => setSelected({ ...selected, tipo_identificacion: e.target.value })} style={inputStyle}>
                {TIPOS_IDENTIFICACION.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            {campos.map(f => (
              <div key={f.key}>
                <label style={labelStyle}>{f.label}{f.key === 'representante_legal' && <span style={{ color: '#dc2626' }}> *</span>}</label>
                <input
                  value={(selected as unknown as Record<string, string>)[f.key] || ''}
                  onChange={e => setSelected({ ...selected, [f.key]: e.target.value })}
                  required={f.key === 'representante_legal'}
                  style={inputStyle}
                />
              </div>
            ))}
            {/* País: bloqueado para usuarios de un país (el servidor lo sella); editable para GLOBAL */}
            <div>
              <label style={labelStyle}>{es ? 'País' : 'Country'}{usuarioGlobal && <span style={{ color: '#dc2626' }}> *</span>}</label>
              {usuarioGlobal ? (
                <select value={selected.pais} onChange={e => setSelected({ ...selected, pais: e.target.value })} style={inputStyle}>
                  {PAISES_ACTIVOS.map(p => <option key={p.codigo} value={p.codigo}>{p.bandera} {p.nombre}</option>)}
                </select>
              ) : (
                <div style={{ ...inputStyle, background: '#f1f5f9', color: '#64748b' }}>{etiquetaPais(selected.pais)}</div>
              )}
            </div>
            <div>
              <label style={labelStyle}>{es ? 'Situación' : 'Status'}</label>
              <select value={selected.situacion} onChange={e => setSelected({ ...selected, situacion: e.target.value })} style={inputStyle}>
                {['Activo', 'Inactivo'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="submit" style={{ ...btn, background: '#1e3a8a', color: '#fff' }}>{es ? 'Guardar' : 'Save'}</button>
            <button type="button" onClick={() => { setIsForm(false); setSelected(null) }} style={{ ...btn, background: '#64748b', color: '#fff' }}>{es ? 'Cancelar' : 'Cancel'}</button>
          </div>
        </form>
      </div>
    )
  }

  // ── Vista detalle ──
  if (detalle) {
    const Row = ({ label, value }: { label: string; value?: string }) => (
      <div style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ width: 180, color: '#64748b', fontSize: 12, fontWeight: 600 }}>{label}</div>
        <div style={{ color: '#0f172a', fontSize: 13 }}>{value || '—'}</div>
      </div>
    )
    return (
      <div style={{ padding: 24 }}>
        <ModuleHeader title={es ? 'Contratistas' : 'Contractors'} subtitle={es ? 'Detalle' : 'Detail'} />
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button onClick={() => setDetalle(null)} style={{ ...btn, background: '#000', color: '#fff' }}>{es ? '← Volver' : '← Back'}</button>
          {permisos.editar && <button onClick={() => { setSelected(detalle); setIsForm(true); setDetalle(null) }} style={{ ...btn, background: '#15803d', color: '#fff' }}>{es ? 'Editar' : 'Edit'}</button>}
        </div>
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #1e3a8a' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0b1d4a' }}>{detalle.representante_legal}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{detalle.codigo} · {detalle.tipo_identificacion} {detalle.nro_documento}</div>
            </div>
            <span style={badge(detalle.situacion === 'Activo')}>{detalle.situacion}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            <div>
              <Row label={es ? 'Tipo de contratista' : 'Contractor type'} value={detalle.tipo_subcontratista} />
              <Row label={es ? 'Actividad' : 'Activity'} value={detalle.actividad} />
              <Row label={es ? 'Correo' : 'Email'} value={detalle.correo} />
              <Row label={es ? 'Nro. Celular' : 'Mobile'} value={detalle.nro_celular} />
            </div>
            <div>
              <Row label={es ? 'Dirección' : 'Address'} value={detalle.direccion} />
              <Row label={es ? 'Ciudad' : 'City'} value={detalle.ciudad} />
              <Row label={es ? 'País' : 'Country'} value={etiquetaPais(detalle.pais)} />
              <Row label={es ? 'Fecha registro' : 'Registered'} value={detalle.fecha_registro} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Vista lista ──
  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader title={es ? 'Contratistas' : 'Contractors'} subtitle={es ? 'Gestión de contratistas' : 'Contractor management'} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder={es ? 'Buscar por nombre, documento, actividad, ciudad…' : 'Search by name, ID, activity, city…'}
          style={{ flex: 1, minWidth: 240, padding: '10px 14px', borderRadius: 10, background: '#fff', border: '1px solid #1e3a8a', color: '#0f172a', fontSize: 14, outline: 'none' }}
        />
        {usuarioGlobal && (
          <select value={filtroPais} onChange={e => setFiltroPais(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: 10, background: '#fff', border: '1px solid #1e3a8a', color: '#0f172a', fontSize: 13, outline: 'none' }}>
            <option value="">🌎 {es ? 'Todos los países' : 'All countries'}</option>
            {PAISES_ACTIVOS.map(p => <option key={p.codigo} value={p.codigo}>{p.bandera} {p.nombre}</option>)}
          </select>
        )}
        <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
          {filtrados.length} {es ? 'contratistas' : 'contractors'}
        </span>
        {permisos.crear && (
          <button onClick={() => { setSelected(emptySubcontratista()); setIsForm(true) }} style={{ ...btn, background: '#1e3a8a', color: '#fff' }}>
            + {es ? 'Nuevo Contratista' : 'New Contractor'}
          </button>
        )}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {[es ? 'Código' : 'Code', es ? 'Representante / Razón Social' : 'Representative / Company', es ? 'Documento' : 'ID', es ? 'Actividad' : 'Activity', es ? 'Ciudad' : 'City', es ? 'País' : 'Country', es ? 'Situación' : 'Status', ''].map((h, i) => (
                  <th key={i} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr><td style={{ ...td, textAlign: 'center', color: '#94a3b8', padding: 24 }} colSpan={8}>
                  {es ? 'No hay contratistas. Crea el primero con "Nuevo Contratista".' : 'No contractors yet. Create one with "New Contractor".'}
                </td></tr>
              )}
              {filtrados.map((s, i) => (
                <tr key={s.id} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
                  <td style={{ ...td, fontWeight: 700, color: '#1e3a8a' }}>{s.codigo}</td>
                  <td style={td}>{s.representante_legal}</td>
                  <td style={td}>{s.nro_documento}</td>
                  <td style={td}>{s.actividad}</td>
                  <td style={td}>{s.ciudad}</td>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>{etiquetaPais(s.pais)}</td>
                  <td style={td}><span style={badge(s.situacion === 'Activo')}>{s.situacion}</span></td>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>
                    <button onClick={() => setDetalle(s)} style={{ ...btn, padding: '5px 12px', fontSize: 12, background: '#1e3a8a', color: '#fff', marginRight: 4 }}>{es ? 'Ver' : 'View'}</button>
                    {permisos.editar && <button onClick={() => { setSelected(s); setIsForm(true) }} style={{ ...btn, padding: '5px 12px', fontSize: 12, background: '#15803d', color: '#fff', marginRight: 4 }}>{es ? 'Editar' : 'Edit'}</button>}
                    {permisos.eliminar && <button onClick={() => handleDelete(s)} style={{ ...btn, padding: '5px 12px', fontSize: 12, background: '#dc2626', color: '#fff' }}>{es ? 'Elim' : 'Del'}</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
