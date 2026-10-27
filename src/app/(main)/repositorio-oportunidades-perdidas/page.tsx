'use client'
import { useState, useEffect } from 'react'
import ModuleHeader from '@/shared/components/module-header'
import { useRepositorioOportunidadesStore, OportunidadArchivada } from '@/features/repositorio-oportunidades/store/repositorio-oportunidades-store'
import { useOportunidadesStore } from '@/features/oportunidades/store/oportunidades-store'
import { useCurrentUserStore } from '@/features/usuarios-gestion/store/current-user-store'
import { usePaisFiltroStore } from '@/features/ui/pais-filtro-store'
import { usePermisos } from '@/shared/hooks/use-permisos'
import { logAudit } from '@/shared/lib/audit'
import { fmtMoney, setMonedaLocale } from '@/shared/lib/format-number'
import { fDate } from '@/shared/lib/format-date'
import { useIdioma } from '@/shared/i18n/use-t'
import { PAISES_ACTIVOS, esGlobal, etiquetaPais } from '@/shared/lib/paises'

export default function RepositorioOportunidadesPerdidasPage() {
  const idioma = useIdioma()
  const L = (es: string, en: string) => (idioma === 'en' ? en : es)
  const permisos = usePermisos('oportunidades')
  const currentUser = useCurrentUserStore(s => s.user)
  const paisUsuario = currentUser?.pais || ''
  const usuarioGlobal = esGlobal(paisUsuario)
  setMonedaLocale(paisUsuario)

  const { archivadas, loadArchivadas, quitar } = useRepositorioOportunidadesStore()
  const addOportunidad = useOportunidadesStore(s => s.addOportunidad)

  const filtroPais = usePaisFiltroStore(s => s.paisFiltro)
  const setFiltroPais = usePaisFiltroStore(s => s.setPaisFiltro)

  const [search, setSearch] = useState('')
  const [ver, setVer] = useState<OportunidadArchivada | null>(null)

  useEffect(() => { loadArchivadas() }, [loadArchivadas])

  const filtered = archivadas.filter(o =>
    (!usuarioGlobal || !filtroPais || o.pais === filtroPais) &&
    (!search ||
      (o.proyecto || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.codigo || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.cliente_nombre || '').toLowerCase().includes(search.toLowerCase()))
  ).sort((a, b) => (b.archivado_en || '').localeCompare(a.archivado_en || ''))

  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, background: '#ffffff', border: '1px solid #1e3a8a', color: '#1e3a8a', fontWeight: 600, fontSize: 13, outline: 'none' }
  const btnStyle: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800 }
  // Colores pedidos: Ver = naranja, Restaurar = azul, texto blanco intenso
  const btnVer: React.CSSProperties = { ...btnStyle, background: '#ea580c', color: '#ffffff' }
  const btnRestaurar: React.CSSProperties = { ...btnStyle, background: '#1e3a8a', color: '#ffffff' }

  const restaurar = (o: OportunidadArchivada) => {
    if (!confirm(L(`¿Restaurar la oportunidad ${o.codigo} a Oportunidades? Saldrá del Repositorio.`, `Restore opportunity ${o.codigo} back to Opportunities? It will leave the Archive.`))) return
    // Quitamos los metadatos de archivado y la devolvemos a Oportunidades tal cual quedó.
    const { archivado_en: _ae, archivado_por: _ap, ...oportunidad } = o
    void _ae; void _ap
    addOportunidad(oportunidad)
    quitar(o.id)
    logAudit({
      modulo: 'oportunidades', usuario: currentUser?.usuario || 'desconocido',
      usuario_nombre: `${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`.trim(),
      rol: currentUser?.rol || '',
      accion: 'RESTAURAR', registro_codigo: o.codigo, registro_nombre: o.proyecto,
      detalle: 'Restaurada desde Repositorio Oportunidades Perdidas',
    })
  }

  const row = (label: string, value: React.ReactNode) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '7px 0', borderBottom: '1px solid #e2e8f0' }}>
      <span style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>{label}</span>
      <span style={{ color: '#013978', fontSize: 13, fontWeight: 600, textAlign: 'right' }}>{value ?? '—'}</span>
    </div>
  )

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader title={L('Repositorio Oportunidades Perdidas', 'Lost Opportunities Archive')} subtitle={L('Oportunidades en estado Perdida guardadas. Puedes ver o restaurar cada una.', 'Lost opportunities stored here. You can view or restore each one.')} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={L('Buscar por código, proyecto o cliente…', 'Search by code, project or client…')} style={{ ...inputStyle, maxWidth: 500 }} />
        {usuarioGlobal && (
          <select value={filtroPais} onChange={e => setFiltroPais(e.target.value)} className="pais-filtro" style={{ ...inputStyle, maxWidth: 260, width: 'auto' }}>
            <option value="">🌎 {L('Todos los países', 'All countries')}</option>
            {PAISES_ACTIVOS.map(p => <option key={p.codigo} value={p.codigo}>{p.bandera} {p.nombre}</option>)}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: '#013978', fontSize: 14, padding: '20px 0' }}>{L('No hay oportunidades perdidas en el repositorio.', 'No lost opportunities in the archive.')}</p>
      ) : (
        <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              {[L('Código', 'Code'), L('Proyecto', 'Project'), L('Cliente', 'Client'), L('País', 'Country'), 'Estimado USA', L('Veredicto', 'Verdict'), L('Archivada', 'Archived'), L('Acciones', 'Actions')].map(h => (
                <th key={h} style={{ padding: '12px 14px', background: '#1e3a5f', color: '#fff', fontSize: 12, textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} style={{ background: '#ffffff' }}>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13, fontFamily: 'monospace' }}>{o.codigo}</td>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13, maxWidth: 280 }}>{o.proyecto}</td>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{o.cliente_nombre}</td>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13, whiteSpace: 'nowrap' }}>{etiquetaPais(o.pais)}</td>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13, fontWeight: 600, textAlign: 'right' }}>US$ {fmtMoney(o.monto_estimado || 0)}</td>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 12 }}>{o.veredicto || '-'}</td>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 12, whiteSpace: 'nowrap' }}>{o.archivado_en ? fDate(o.archivado_en) : '-'}</td>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setVer(o)} style={btnVer}>👁️ {L('Ver', 'View')}</button>
                      {permisos.editar && <button onClick={() => restaurar(o)} style={btnRestaurar}>↩️ {L('Restaurar Oportunidad', 'Restore Opportunity')}</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Ver: imagen de la oportunidad archivada (solo lectura) */}
      {ver && (
        <div onClick={() => setVer(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 24, zIndex: 1000, overflowY: 'auto' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: 16, padding: 28, width: 620, maxWidth: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ color: '#013978', fontSize: 20, fontWeight: 800, margin: 0 }}>{L('Oportunidad', 'Opportunity')} {ver.codigo}</h2>
              <button onClick={() => setVer(null)} style={{ ...btnStyle, background: '#000000', color: '#ffffff' }}>✕</button>
            </div>
            <div>
              {row(L('Proyecto', 'Project'), ver.proyecto)}
              {row(L('Cliente', 'Client'), ver.cliente_nombre)}
              {row(L('Contacto', 'Contact'), ver.contacto_nombre)}
              {row(L('Ciudad', 'City'), ver.ciudad)}
              {row(L('País', 'Country'), etiquetaPais(ver.pais))}
              {row('Estimado USA', `US$ ${fmtMoney(ver.monto_estimado || 0)}`)}
              {row(L('Probable %', 'Probable %'), `${ver.probable_pct || 0}%`)}
              {row(L('Adjudicación', 'Award'), ver.adjudicacion)}
              {row(L('Veredicto', 'Verdict'), ver.veredicto)}
              {row(L('Empresa ganadora', 'Winning company'), ver.empresa_ganadora)}
              {row(L('Situación', 'Status'), ver.situacion)}
              {row(L('Responsable', 'Owner'), ver.responsable)}
              {row(L('Fecha registro', 'Registered'), ver.fecha_registro ? fDate(ver.fecha_registro) : '—')}
              {row(L('Archivada', 'Archived'), ver.archivado_en ? `${fDate(ver.archivado_en)}${ver.archivado_por ? ` · ${ver.archivado_por}` : ''}` : '—')}
              <div style={{ paddingTop: 10 }}>
                <span style={{ color: '#64748b', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>{L('Observaciones', 'Notes')}</span>
                <div style={{ color: '#013978', fontSize: 13, whiteSpace: 'pre-wrap' }}>{ver.observaciones || '—'}</div>
              </div>
              {/* Bitácora de Seguimiento (viaja con la oportunidad al archivar y al restaurar) */}
              <div style={{ paddingTop: 16 }}>
                <span style={{ color: '#64748b', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8 }}>{L('Bitácora de Seguimiento', 'Follow-up Log')} ({(ver.seguimientos || []).length})</span>
                {(ver.seguimientos || []).length === 0 ? (
                  <div style={{ color: '#94a3b8', fontSize: 13 }}>{L('Sin seguimientos.', 'No follow-ups.')}</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[...(ver.seguimientos || [])].reverse().map(s => (
                      <div key={s.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', background: '#f8fafc' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
                          <span style={{ color: '#013978', fontSize: 12, fontWeight: 700 }}>{s.fecha ? fDate(s.fecha) : '—'}</span>
                          <span style={{ color: '#1e3a8a', fontSize: 11, fontWeight: 700, background: '#e0e7ff', borderRadius: 10, padding: '1px 8px', whiteSpace: 'nowrap' }}>{s.situacion || '—'}</span>
                        </div>
                        <div style={{ color: '#013978', fontSize: 13, whiteSpace: 'pre-wrap' }}>{s.detalle}</div>
                        <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>{[s.persona_actividad, s.usuario].filter(Boolean).join(' · ')}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              {permisos.editar && <button onClick={() => { const o = ver; setVer(null); restaurar(o) }} style={btnRestaurar}>↩️ {L('Restaurar Oportunidad', 'Restore Opportunity')}</button>}
              <button onClick={() => setVer(null)} style={{ ...btnStyle, background: '#64748b', color: '#ffffff' }}>{L('Cerrar', 'Close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
