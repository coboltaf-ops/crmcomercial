'use client'
import { logAudit, computarDiff } from '@/shared/lib/audit'
import { useState, useEffect } from 'react'
import ModuleHeader from '@/shared/components/module-header'
import { useFactoresStore, FactorMoneda } from '@/features/factores-monedas/store/factores-store'
import { useCurrentUserStore } from '@/features/usuarios-gestion/store/current-user-store'
import { usePermisos } from '@/shared/hooks/use-permisos'
import { fDate, todayColombia } from '@/shared/lib/format-date'
import { nextConsecutivo } from '@/shared/lib/consecutivo'
import DecimalInput from '@/shared/components/decimal-input'

const today = todayColombia()

// Formato de factor: separador de miles y 2 decimales (ej. 4,000.00)
const fmtFactor = (n: number) => (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const emptyFactor = (codigo: string): FactorMoneda => ({
  id: '', codigo, fecha_registro: today,
  factor_pesos_usd: 0, factor_usd_euro: 0, situacion: 'Activo',
})

export default function FactoresMonedasPage() {
  const currentUser = useCurrentUserStore(s => s.user)
  const permisos = usePermisos('factores-monedas')
  const { factores, addFactor, updateFactor, deleteFactor } = useFactoresStore()
  const loadFactores = useFactoresStore(s => s.loadFactores)
  useEffect(() => { loadFactores() }, [loadFactores])

  const [selected, setSelected] = useState<FactorMoneda | null>(null)
  const [isForm, setIsForm] = useState(false)
  const [verLectura, setVerLectura] = useState(false)

  const auditParams = () => ({
    usuario: currentUser?.usuario || 'desconocido',
    usuario_nombre: `${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`.trim(),
    rol: currentUser?.rol || '',
    modulo: 'factores-monedas',
  })

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    const toSave = { ...selected }
    if (toSave.id) {
      const _anterior = factores.find(x => x.id === toSave.id)
      updateFactor(toSave.id, toSave)
      logAudit({ ...auditParams(), accion: 'MODIFICAR', registro_codigo: toSave.codigo, registro_nombre: 'Factores de conversión', detalle: computarDiff(_anterior as unknown as Record<string, unknown>, toSave as unknown as Record<string, unknown>) })
    } else {
      addFactor({ ...toSave, id: crypto.randomUUID(), fecha_registro: today, creado_por: `${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`.trim() || (currentUser?.usuario || 'desconocido'), creado_por_usuario: currentUser?.usuario || '', creado_en: today })
      logAudit({ ...auditParams(), accion: 'CREAR', registro_codigo: toSave.codigo, registro_nombre: 'Factores de conversión' })
    }
    setIsForm(false); setSelected(null); setVerLectura(false)
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, background: '#ffffff', border: '1px solid #1e3a8a', color: '#1e3a8a', fontWeight: 600, fontSize: 13, outline: 'none' }
  const inputRO: React.CSSProperties = { ...inputStyle, opacity: 0.5 }
  const btnStyle: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }
  const labelStyle: React.CSSProperties = { color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }
  const situColor = (s: string): React.CSSProperties => {
    const map: Record<string, string> = { 'Activo': '#16a34a', 'Inactivo': '#dc2626' }
    return { background: 'transparent', color: map[s] || '#6b7280', border: `1px solid ${map[s] || '#6b7280'}`, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, display: 'inline-block' }
  }

  // ── FORMULARIO (crear / editar / ver) ──
  if (isForm && selected) {
    return (
      <div>
        <button onClick={() => { setIsForm(false); setSelected(null); setVerLectura(false) }} style={{ ...btnStyle, background: '#000000', color: '#ffffff', border: '1px solid #333333', marginBottom: 16 }}>← Volver</button>
        <form onSubmit={handleSave} style={{ background: '#ffffff', borderRadius: 16, padding: 24, border: '1px solid #1e3a8a' }}>
          <h2 style={{ color: '#013978', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{verLectura ? 'Ver Factores' : selected.id ? 'Editar Factores' : 'Nuevos Factores'}</h2>
          <fieldset disabled={verLectura} style={{ border: 'none', padding: 0, margin: 0, minInlineSize: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Nro *</label>
                {verLectura ? <div className="ver-box">{selected.codigo || '—'}</div> : <input value={selected.codigo} readOnly style={inputRO} />}
              </div>
              <div>
                <label style={labelStyle}>Fecha Registro</label>
                {verLectura ? <div className="ver-box">{fDate(selected.fecha_registro || today) || '—'}</div> : <input value={fDate(selected.fecha_registro || today)} readOnly style={inputRO} />}
              </div>
              <div>
                <label style={labelStyle}>Factor Pesos a US$</label>
                <DecimalInput value={selected.factor_pesos_usd || 0} onChange={n => setSelected({ ...selected, factor_pesos_usd: n })} placeholder="Ej: 4000.00" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Factor US$ a Euro</label>
                <DecimalInput value={selected.factor_usd_euro || 0} onChange={n => setSelected({ ...selected, factor_usd_euro: n })} placeholder="Ej: 0.92" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Situación</label>
                {verLectura ? <div className="ver-box">{selected.situacion || '—'}</div> : (
                  <select value={selected.situacion} onChange={e => setSelected({ ...selected, situacion: e.target.value })} style={inputStyle}>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                )}
              </div>
            </div>
          </fieldset>
          {verLectura && (
            <p style={{ color: '#000000', fontSize: 13, fontWeight: 700, marginTop: 14 }}>
              👤 Creado por: {selected.creado_por || '—'}{selected.creado_por_usuario ? ` (${selected.creado_por_usuario})` : ''}{selected.creado_en ? ` · ${selected.creado_en}` : ''}
            </p>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            {!verLectura && <button type="submit" style={{ ...btnStyle, background: '#1e3a8a', color: '#ffffff' }}>Guardar</button>}
            <button type="button" onClick={() => { setIsForm(false); setSelected(null); setVerLectura(false) }} style={{ ...btnStyle, background: '#64748b', color: '#ffffff' }}>{verLectura ? 'Volver' : 'Cancelar'}</button>
          </div>
        </form>
      </div>
    )
  }

  // ── VISTA PRINCIPAL ──
  return (
    <div>
      <ModuleHeader title="Factores Conversión Monedas" subtitle="Factores de conversión de monedas" />
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 16 }}>
        {permisos.crear && (
          <button onClick={() => { setSelected(emptyFactor(nextConsecutivo('FCM-', factores.map(f => f.codigo)).codigo)); setVerLectura(false); setIsForm(true) }} style={{ ...btnStyle, background: '#1e3a8a', color: '#ffffff' }}>+ Nuevos Factores</button>
        )}
      </div>

      <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Nro', 'Fecha', 'Factor Pesos a US$', 'Factor US$ a Euro', 'Situación', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '12px 14px', background: '#1e3a8a', color: '#fff', fontSize: 12, textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {factores.map((f, i) => (
              <tr key={f.id} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#000', fontSize: 13, fontFamily: 'monospace' }}>{f.codigo}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#000', fontSize: 13 }}>{fDate(f.fecha_registro)}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#000', fontSize: 13 }}>{fmtFactor(f.factor_pesos_usd)}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#000', fontSize: 13 }}>{fmtFactor(f.factor_usd_euro)}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}><span style={situColor(f.situacion)}>{f.situacion}</span></td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <button onClick={() => { setSelected(f); setVerLectura(true); setIsForm(true) }} style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#ea580c', color: '#ffffff', border: '1px solid #f97316' }}>Ver</button>
                    {permisos.editar && <button onClick={() => { setSelected(f); setVerLectura(false); setIsForm(true) }} style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#2563eb', color: '#ffffff', border: '1px solid #3b82f6' }}>Editar</button>}
                    {permisos.eliminar && <button onClick={() => { if (confirm(`¿Eliminar los factores ${f.codigo}?`)) { deleteFactor(f.id); logAudit({ ...auditParams(), accion: 'ELIMINAR', registro_codigo: f.codigo, registro_nombre: 'Factores de conversión' }) } }} style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#dc2626', color: '#ffffff', border: '1px solid #ef4444' }}>Eliminar</button>}
                  </div>
                </td>
              </tr>
            ))}
            {factores.length === 0 && <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#013978', fontSize: 14 }}>No hay factores registrados</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
