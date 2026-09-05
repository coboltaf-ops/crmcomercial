'use client'
import { useState, useEffect, useMemo } from 'react'
import ModuleHeader from '@/shared/components/module-header'
import { useMaquinariasStore, MaquinariaEquipo } from '@/features/maquinarias-equipos/store/maquinarias-equipos-store'
import { useCurrentUserStore } from '@/features/usuarios-gestion/store/current-user-store'
import { usePermisos } from '@/shared/hooks/use-permisos'
import { nextConsecutivo } from '@/shared/lib/consecutivo'
import { todayColombia } from '@/shared/lib/format-date'
import { useIdioma } from '@/shared/i18n/use-t'
import { PAISES_ACTIVOS, esGlobal, etiquetaPais } from '@/shared/lib/paises'

export default function MaquinariasEquiposPage() {
  const idioma = useIdioma()
  const es = idioma !== 'en'
  const permisos = usePermisos('maquinarias-equipos')
  const currentUser = useCurrentUserStore(s => s.user)
  const paisUsuario = currentUser?.pais || ''
  const usuarioGlobal = esGlobal(paisUsuario)

  const { maquinarias, addMaquinaria, updateMaquinaria, deleteMaquinaria } = useMaquinariasStore()
  const loadMaquinarias = useMaquinariasStore(s => s.loadMaquinarias)

  const [q, setQ] = useState('')
  const [filtroPais, setFiltroPais] = useState('')  // solo lo usan usuarios GLOBAL
  const [detalle, setDetalle] = useState<MaquinariaEquipo | null>(null)
  const [selected, setSelected] = useState<MaquinariaEquipo | null>(null)  // form crear/editar
  const [isForm, setIsForm] = useState(false)

  useEffect(() => {
    loadMaquinarias()
  }, [loadMaquinarias])

  const emptyMaquinaria = (): MaquinariaEquipo => ({
    id: '', codigo: nextConsecutivo('MAQ-', maquinarias.map(m => m.codigo)).codigo,
    tipo: '', marca: '', categoria: '', grupo: '', descripcion: '',
    vr_hora: 0, vr_dia: 0, vr_semana: 0, vr_mes: 0, proveedor: '',
    // Usuario de país → su país; GLOBAL → primer país activo (puede cambiarlo).
    pais: usuarioGlobal ? (PAISES_ACTIVOS[0]?.codigo || 'Perú') : paisUsuario,
    situacion: 'Activo', creado_por_usuario: currentUser?.usuario || '',
    creado_en: todayColombia(), fecha_registro: todayColombia(),
  })

  const filtrados = useMemo(() => {
    let base = maquinarias
    if (usuarioGlobal && filtroPais) base = base.filter(m => m.pais === filtroPais)
    const t = q.trim().toLowerCase()
    if (!t) return base
    return base.filter(m =>
      [m.codigo, m.tipo, m.marca, m.categoria, m.grupo, m.descripcion, m.proveedor, m.pais]
        .filter(Boolean).join(' ').toLowerCase().includes(t),
    )
  }, [maquinarias, q, filtroPais, usuarioGlobal])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    if (!selected.descripcion.trim()) { alert(es ? 'La descripción es obligatoria' : 'Description is required'); return }
    if (selected.id) updateMaquinaria(selected.id, selected)
    else addMaquinaria({ ...selected, id: crypto.randomUUID() })
    setIsForm(false); setSelected(null)
  }

  const handleDelete = (m: MaquinariaEquipo) => {
    if (confirm(es ? `¿Eliminar la maquinaria "${m.descripcion}"?` : `Delete equipment "${m.descripcion}"?`)) {
      deleteMaquinaria(m.id)
      if (detalle?.id === m.id) setDetalle(null)
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
  const money = (n: number) => (Number(n) || 0).toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  // ═══════════ FORMULARIO CREAR / EDITAR ═══════════
  if (isForm && selected) {
    const textos: { label: string; key: keyof MaquinariaEquipo }[] = [
      { label: es ? 'Tipo' : 'Type', key: 'tipo' },
      { label: es ? 'Marca' : 'Brand', key: 'marca' },
      { label: es ? 'Categoría' : 'Category', key: 'categoria' },
      { label: es ? 'Grupo' : 'Group', key: 'grupo' },
      { label: es ? 'Proveedor' : 'Supplier', key: 'proveedor' },
    ]
    const numericos: { label: string; key: keyof MaquinariaEquipo }[] = [
      { label: es ? 'Valor Hora' : 'Hour rate', key: 'vr_hora' },
      { label: es ? 'Valor Día' : 'Day rate', key: 'vr_dia' },
      { label: es ? 'Valor Semana' : 'Week rate', key: 'vr_semana' },
      { label: es ? 'Valor Mes' : 'Month rate', key: 'vr_mes' },
    ]
    return (
      <div style={{ padding: 24 }}>
        <ModuleHeader title={es ? 'Maquinaria y Equipos' : 'Machinery & Equipment'} subtitle={selected.id ? (es ? 'Editar maquinaria' : 'Edit equipment') : (es ? 'Nueva maquinaria' : 'New equipment')} />
        <form onSubmit={handleSave} style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #1e3a8a', maxWidth: 900 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ color: '#013978', fontSize: 16, fontWeight: 700 }}>{selected.id ? (es ? 'Editar' : 'Edit') : (es ? 'Nueva' : 'New')} · {selected.codigo}</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>{es ? 'Descripción' : 'Description'}<span style={{ color: '#dc2626' }}> *</span></label>
              <input
                value={selected.descripcion}
                onChange={e => setSelected({ ...selected, descripcion: e.target.value })}
                required
                style={inputStyle}
              />
            </div>
            {textos.map(f => (
              <div key={f.key}>
                <label style={labelStyle}>{f.label}</label>
                <input
                  value={(selected as unknown as Record<string, string>)[f.key] || ''}
                  onChange={e => setSelected({ ...selected, [f.key]: e.target.value })}
                  style={inputStyle}
                />
              </div>
            ))}
            {numericos.map(f => (
              <div key={f.key}>
                <label style={labelStyle}>{f.label}</label>
                <input
                  type="number" min={0} step="0.01"
                  value={(selected as unknown as Record<string, number>)[f.key] ?? 0}
                  onChange={e => setSelected({ ...selected, [f.key]: Number(e.target.value) })}
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
        <ModuleHeader title={es ? 'Maquinaria y Equipos' : 'Machinery & Equipment'} subtitle={es ? 'Detalle' : 'Detail'} />
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button onClick={() => setDetalle(null)} style={{ ...btn, background: '#000', color: '#fff' }}>{es ? '← Volver' : '← Back'}</button>
          {permisos.editar && <button onClick={() => { setSelected(detalle); setIsForm(true); setDetalle(null) }} style={{ ...btn, background: '#15803d', color: '#fff' }}>{es ? 'Editar' : 'Edit'}</button>}
        </div>
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #1e3a8a' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0b1d4a' }}>{detalle.descripcion}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{detalle.codigo} · {detalle.tipo} {detalle.marca}</div>
            </div>
            <span style={badge(detalle.situacion === 'Activo')}>{detalle.situacion}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            <div>
              <Row label={es ? 'Tipo' : 'Type'} value={detalle.tipo} />
              <Row label={es ? 'Marca' : 'Brand'} value={detalle.marca} />
              <Row label={es ? 'Categoría' : 'Category'} value={detalle.categoria} />
              <Row label={es ? 'Grupo' : 'Group'} value={detalle.grupo} />
              <Row label={es ? 'Proveedor' : 'Supplier'} value={detalle.proveedor} />
            </div>
            <div>
              <Row label={es ? 'Valor Hora' : 'Hour rate'} value={money(detalle.vr_hora)} />
              <Row label={es ? 'Valor Día' : 'Day rate'} value={money(detalle.vr_dia)} />
              <Row label={es ? 'Valor Semana' : 'Week rate'} value={money(detalle.vr_semana)} />
              <Row label={es ? 'Valor Mes' : 'Month rate'} value={money(detalle.vr_mes)} />
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
      <ModuleHeader title={es ? 'Maquinaria y Equipos' : 'Machinery & Equipment'} subtitle={es ? 'Gestión de maquinaria y equipos' : 'Machinery & equipment management'} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder={es ? 'Buscar por descripción, tipo, marca, categoría…' : 'Search by description, type, brand, category…'}
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
          {filtrados.length} {es ? 'equipos' : 'items'}
        </span>
        {permisos.crear && (
          <button onClick={() => { setSelected(emptyMaquinaria()); setIsForm(true) }} style={{ ...btn, background: '#1e3a8a', color: '#fff' }}>
            + {es ? 'Nuevo' : 'New'}
          </button>
        )}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {[es ? 'Código' : 'Code', es ? 'Descripción' : 'Description', es ? 'Tipo' : 'Type', es ? 'Marca' : 'Brand', es ? 'Categoría' : 'Category', es ? 'Valor Día' : 'Day rate', es ? 'País' : 'Country', es ? 'Situación' : 'Status', ''].map((h, i) => (
                  <th key={i} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr><td style={{ ...td, textAlign: 'center', color: '#94a3b8', padding: 24 }} colSpan={9}>
                  {es ? 'No hay maquinaria. Crea la primera con "Nuevo".' : 'No equipment yet. Create one with "New".'}
                </td></tr>
              )}
              {filtrados.map((m, i) => (
                <tr key={m.id} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
                  <td style={{ ...td, fontWeight: 700, color: '#1e3a8a' }}>{m.codigo}</td>
                  <td style={td}>{m.descripcion}</td>
                  <td style={td}>{m.tipo}</td>
                  <td style={td}>{m.marca}</td>
                  <td style={td}>{m.categoria}</td>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>{money(m.vr_dia)}</td>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>{etiquetaPais(m.pais)}</td>
                  <td style={td}><span style={badge(m.situacion === 'Activo')}>{m.situacion}</span></td>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>
                    <button onClick={() => setDetalle(m)} style={{ ...btn, padding: '5px 12px', fontSize: 12, background: '#1e3a8a', color: '#fff', marginRight: 4 }}>{es ? 'Ver' : 'View'}</button>
                    {permisos.editar && <button onClick={() => { setSelected(m); setIsForm(true) }} style={{ ...btn, padding: '5px 12px', fontSize: 12, background: '#15803d', color: '#fff', marginRight: 4 }}>{es ? 'Editar' : 'Edit'}</button>}
                    {permisos.eliminar && <button onClick={() => handleDelete(m)} style={{ ...btn, padding: '5px 12px', fontSize: 12, background: '#dc2626', color: '#fff' }}>{es ? 'Elim' : 'Del'}</button>}
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
