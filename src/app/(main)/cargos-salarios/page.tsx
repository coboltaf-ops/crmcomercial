'use client'
import { useState, useEffect, useMemo } from 'react'
import ModuleHeader from '@/shared/components/module-header'
import { useCargosSalariosStore, CargoSalario } from '@/features/cargos-salarios/store/cargos-salarios-store'
import { useCurrentUserStore } from '@/features/usuarios-gestion/store/current-user-store'
import { usePermisos } from '@/shared/hooks/use-permisos'
import { nextConsecutivo } from '@/shared/lib/consecutivo'
import { todayColombia } from '@/shared/lib/format-date'
import { useIdioma } from '@/shared/i18n/use-t'
import { PAISES_ACTIVOS, esGlobal, etiquetaPais } from '@/shared/lib/paises'

export default function CargosSalariosPage() {
  const idioma = useIdioma()
  const es = idioma !== 'en'
  const permisos = usePermisos('cargos-salarios')
  const currentUser = useCurrentUserStore(s => s.user)
  const paisUsuario = currentUser?.pais || ''
  const usuarioGlobal = esGlobal(paisUsuario)

  const { cargos, addCargo, updateCargo, deleteCargo } = useCargosSalariosStore()
  const loadCargos = useCargosSalariosStore(s => s.loadCargos)

  const [q, setQ] = useState('')
  const [filtroPais, setFiltroPais] = useState('')  // solo lo usan usuarios GLOBAL
  const [detalle, setDetalle] = useState<CargoSalario | null>(null)
  const [selected, setSelected] = useState<CargoSalario | null>(null)  // form crear/editar
  const [isForm, setIsForm] = useState(false)

  useEffect(() => {
    loadCargos()
  }, [loadCargos])

  const emptyCargo = (): CargoSalario => ({
    id: '', codigo: nextConsecutivo('CAR-', cargos.map(c => c.codigo)).codigo,
    especialidad: '', descripcion: '', tipo_mo: 'Directa',
    salario_dia: 0, pct_prestaciones: 0, salario_mes: 0,
    fecha_actualizacion: todayColombia(),
    // Usuario de país → su país; GLOBAL → primer país activo (puede cambiarlo).
    pais: usuarioGlobal ? (PAISES_ACTIVOS[0]?.codigo || 'Perú') : paisUsuario,
    situacion: 'Activo', creado_por_usuario: currentUser?.usuario || '',
    creado_en: todayColombia(), fecha_registro: todayColombia(),
  })

  const filtrados = useMemo(() => {
    let base = cargos
    if (usuarioGlobal && filtroPais) base = base.filter(c => c.pais === filtroPais)
    const t = q.trim().toLowerCase()
    if (!t) return base
    return base.filter(c =>
      [c.codigo, c.especialidad, c.descripcion, c.tipo_mo, c.situacion, c.pais]
        .filter(Boolean).join(' ').toLowerCase().includes(t),
    )
  }, [cargos, q, filtroPais, usuarioGlobal])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    if (!selected.descripcion.trim()) { alert(es ? 'La descripción del cargo es obligatoria' : 'Job description is required'); return }
    if (selected.id) updateCargo(selected.id, selected)
    else addCargo({ ...selected, id: crypto.randomUUID() })
    setIsForm(false); setSelected(null)
  }

  const handleDelete = (c: CargoSalario) => {
    if (confirm(es ? `¿Eliminar el cargo "${c.descripcion}"?` : `Delete role "${c.descripcion}"?`)) {
      deleteCargo(c.id)
      if (detalle?.id === c.id) setDetalle(null)
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
  const money = (n: number) => (n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  // ═══════════ FORMULARIO CREAR / EDITAR ═══════════
  if (isForm && selected) {
    return (
      <div style={{ padding: 24 }}>
        <ModuleHeader title={es ? 'Cargos y Salarios' : 'Roles & Salaries'} subtitle={selected.id ? (es ? 'Editar cargo' : 'Edit role') : (es ? 'Nuevo cargo' : 'New role')} />
        <form onSubmit={handleSave} style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #1e3a8a', maxWidth: 900 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ color: '#013978', fontSize: 16, fontWeight: 700 }}>{selected.id ? (es ? 'Editar' : 'Edit') : (es ? 'Nuevo' : 'New')} · {selected.codigo}</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>{es ? 'Descripción del Cargo' : 'Job description'}<span style={{ color: '#dc2626' }}> *</span></label>
              <input value={selected.descripcion} onChange={e => setSelected({ ...selected, descripcion: e.target.value })} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{es ? 'Especialidad' : 'Specialty'}</label>
              <input value={selected.especialidad} onChange={e => setSelected({ ...selected, especialidad: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{es ? 'Tipo M.O.' : 'Labor type'}</label>
              <select value={selected.tipo_mo} onChange={e => setSelected({ ...selected, tipo_mo: e.target.value })} style={inputStyle}>
                {['Directa', 'Indirecta'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{es ? 'Salario Día' : 'Daily salary'}</label>
              <input type="number" step="0.01" value={selected.salario_dia} onChange={e => setSelected({ ...selected, salario_dia: Number(e.target.value) })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{es ? '% Prestaciones' : 'Benefits %'}</label>
              <input type="number" step="0.01" value={selected.pct_prestaciones} onChange={e => setSelected({ ...selected, pct_prestaciones: Number(e.target.value) })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{es ? 'Salario Mes' : 'Monthly salary'}</label>
              <input type="number" step="0.01" value={selected.salario_mes} onChange={e => setSelected({ ...selected, salario_mes: Number(e.target.value) })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{es ? 'Fecha Actualización' : 'Updated on'}</label>
              <input type="date" value={selected.fecha_actualizacion} onChange={e => setSelected({ ...selected, fecha_actualizacion: e.target.value })} style={inputStyle} />
            </div>
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
        <ModuleHeader title={es ? 'Cargos y Salarios' : 'Roles & Salaries'} subtitle={es ? 'Detalle del cargo' : 'Role detail'} />
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button onClick={() => setDetalle(null)} style={{ ...btn, background: '#000', color: '#fff' }}>{es ? '← Volver' : '← Back'}</button>
          {permisos.editar && <button onClick={() => { setSelected(detalle); setIsForm(true); setDetalle(null) }} style={{ ...btn, background: '#15803d', color: '#fff' }}>{es ? 'Editar' : 'Edit'}</button>}
        </div>
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #1e3a8a' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0b1d4a' }}>{detalle.descripcion}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{detalle.codigo} · {detalle.especialidad}</div>
            </div>
            <span style={badge(detalle.situacion === 'Activo')}>{detalle.situacion}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            <div>
              <Row label={es ? 'Especialidad' : 'Specialty'} value={detalle.especialidad} />
              <Row label={es ? 'Tipo M.O.' : 'Labor type'} value={detalle.tipo_mo} />
              <Row label={es ? 'País' : 'Country'} value={etiquetaPais(detalle.pais)} />
            </div>
            <div>
              <Row label={es ? 'Salario Día' : 'Daily salary'} value={money(detalle.salario_dia)} />
              <Row label={es ? '% Prestaciones' : 'Benefits %'} value={String(detalle.pct_prestaciones)} />
              <Row label={es ? 'Salario Mes' : 'Monthly salary'} value={money(detalle.salario_mes)} />
              <Row label={es ? 'Fecha actualización' : 'Updated on'} value={detalle.fecha_actualizacion} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Vista lista ──
  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader title={es ? 'Cargos y Salarios' : 'Roles & Salaries'} subtitle={es ? 'Gestión de cargos y salarios' : 'Roles & salaries management'} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder={es ? 'Buscar por código, cargo, especialidad…' : 'Search by code, role, specialty…'}
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
          {filtrados.length} {es ? 'cargos' : 'roles'}
        </span>
        {permisos.crear && (
          <button onClick={() => { setSelected(emptyCargo()); setIsForm(true) }} style={{ ...btn, background: '#1e3a8a', color: '#fff' }}>
            + {es ? 'Nuevo Cargo' : 'New Role'}
          </button>
        )}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {[es ? 'Código' : 'Code', es ? 'Descripción' : 'Description', es ? 'Especialidad' : 'Specialty', es ? 'Tipo M.O.' : 'Labor type', es ? 'Salario Día' : 'Daily salary', es ? 'Salario Mes' : 'Monthly salary', es ? 'País' : 'Country', es ? 'Situación' : 'Status', ''].map((h, i) => (
                  <th key={i} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr><td style={{ ...td, textAlign: 'center', color: '#94a3b8', padding: 24 }} colSpan={9}>
                  {es ? 'No hay cargos. Crea el primero con "Nuevo Cargo".' : 'No roles yet. Create one with "New Role".'}
                </td></tr>
              )}
              {filtrados.map((c, i) => (
                <tr key={c.id} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
                  <td style={{ ...td, fontWeight: 700, color: '#1e3a8a' }}>{c.codigo}</td>
                  <td style={td}>{c.descripcion}</td>
                  <td style={td}>{c.especialidad}</td>
                  <td style={td}>{c.tipo_mo}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{money(c.salario_dia)}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{money(c.salario_mes)}</td>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>{etiquetaPais(c.pais)}</td>
                  <td style={td}><span style={badge(c.situacion === 'Activo')}>{c.situacion}</span></td>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>
                    <button onClick={() => setDetalle(c)} style={{ ...btn, padding: '5px 12px', fontSize: 12, background: '#1e3a8a', color: '#fff', marginRight: 4 }}>{es ? 'Ver' : 'View'}</button>
                    {permisos.editar && <button onClick={() => { setSelected(c); setIsForm(true) }} style={{ ...btn, padding: '5px 12px', fontSize: 12, background: '#15803d', color: '#fff', marginRight: 4 }}>{es ? 'Editar' : 'Edit'}</button>}
                    {permisos.eliminar && <button onClick={() => handleDelete(c)} style={{ ...btn, padding: '5px 12px', fontSize: 12, background: '#dc2626', color: '#fff' }}>{es ? 'Elim' : 'Del'}</button>}
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
