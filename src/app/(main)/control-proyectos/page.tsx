'use client'
import { useIdioma } from '@/shared/i18n/use-t'
import { logAudit, computarDiff } from '@/shared/lib/audit'
import { useState, useEffect, useRef } from 'react'
import { useControlProyectosStore, ControlProyecto, Partida, Corte, nivelDeCodigo, esHoja } from '@/features/control-proyectos/store/control-proyectos-store'
import { parseWbsFromArrayBuffer } from '@/features/control-proyectos/lib/parse-wbs-excel'
import CurvaS from '@/features/control-proyectos/components/curva-s'
import { useSeguimientoOfertaStore } from '@/features/seguimiento-oferta/store/seguimiento-oferta-store'
import { useProyectosStore } from '@/features/proyectos/store/proyectos-store'
import { useClientesStore } from '@/features/clientes/store/clientes-store'
import { useReferenceStore } from '@/features/referencias/store/reference-store'
import { useCurrentUserStore } from '@/features/usuarios-gestion/store/current-user-store'
import { usePermisos } from '@/shared/hooks/use-permisos'
import { fDate, todayColombia } from '@/shared/lib/format-date'
import { fmtMoney } from '@/shared/lib/format-number'
import MoneyInput from '@/shared/components/money-input'
import { nextConsecutivo } from '@/shared/lib/consecutivo'
import SeguimientoPanel from '@/shared/components/seguimiento-panel'
import DocumentosPanel from '@/shared/components/documentos-panel'
import { Seguimiento } from '@/shared/types/seguimiento'
import { PAISES_ACTIVOS, esGlobal, etiquetaPais } from '@/shared/lib/paises'

const today = todayColombia()

const SITUACION_DEFAULT = ['En Planeación', 'En Ejecución', 'Suspendido', 'Finalizado', 'Cancelado']
const MONEDA_DEFAULT = ['Pesos Colombianos', 'Dólares', 'Euros']
const FRECUENCIA = ['Mensual', 'Semanal']
const CONTRATO_DEFAULT = ['Precio Fijo', 'Administración Delegada', 'Precios Unitarios', 'Llave en Mano', 'Otro']

const emptyControlProyecto = (codigo: string, responsable: string, pais: string): ControlProyecto => ({
  id: '', codigo, fecha_registro: today, nombre_proyecto: '', codigo_proyecto: '',
  cliente_id: '', cliente_nombre: '', descripcion: '', responsable,
  tipo_contrato: 'Precio Fijo', presupuesto_base: 0, tipo_moneda: 'Pesos Colombianos',
  fecha_inicio_plan: '', fecha_fin_plan: '', fecha_inicio_real: '', frecuencia_corte: 'Mensual',
  oferta_id: '', oferta_nro: '', proyecto_id: '',
  situacion: 'En Planeación', pais, seguimientos: [],
})

export default function ControlProyectosPage() {
  const idioma = useIdioma()
  const es = idioma !== 'en'
  const currentUser = useCurrentUserStore(s => s.user)
  const paisUsuario = currentUser?.pais || ''
  const usuarioGlobal = esGlobal(paisUsuario)
  const permisos = usePermisos('control-proyectos')

  const items = useControlProyectosStore(s => s.items)
  const addItem = useControlProyectosStore(s => s.addItem)
  const updateItem = useControlProyectosStore(s => s.updateItem)
  const deleteItem = useControlProyectosStore(s => s.deleteItem)
  const loadItems = useControlProyectosStore(s => s.loadItems)

  const ofertas = useSeguimientoOfertaStore(s => s.ofertas)
  const loadOfertas = useSeguimientoOfertaStore(s => s.loadOfertas)
  const proyectosActuales = useProyectosStore(s => s.proyectos)
  const loadProyectos = useProyectosStore(s => s.loadProyectos)

  useEffect(() => { loadItems(); loadOfertas(); loadProyectos() }, [loadItems, loadOfertas, loadProyectos])

  const clientes = useClientesStore(s => s.clientes).filter(c => (c.situacion || '').toLowerCase() === 'activo')
  const allClientes = useClientesStore(s => s.clientes)
  const refData = useReferenceStore(s => s.data)

  const [selected, setSelected] = useState<ControlProyecto | null>(null)
  const [isForm, setIsForm] = useState(false)
  const [verLectura, setVerLectura] = useState(false)
  const [search, setSearch] = useState('')
  const [filtroPais, setFiltroPais] = useState('')

  const refOptions = (table: string, fallback: string[]) => {
    const opts = (refData[table as keyof typeof refData] || []).filter(r => r.situacion).map(r => r.descripcion)
    return opts.length ? opts : fallback
  }

  const auditParams = () => ({
    usuario: currentUser?.usuario || 'desconocido',
    usuario_nombre: `${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`.trim(),
    rol: currentUser?.rol || '',
    modulo: 'control-proyectos',
    pais: currentUser?.pais || '',
  })

  const filtered = items.filter(p =>
    (!usuarioGlobal || !filtroPais || p.pais === filtroPais) &&
    (!search || p.codigo.toLowerCase().includes(search.toLowerCase()) ||
      (p.nombre_proyecto || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.cliente_nombre || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.responsable || '').toLowerCase().includes(search.toLowerCase()))
  )

  // Vincular una Oferta → auto-rellena para evitar doble digitación (Sección 3.6 del documento)
  const vincularOferta = (ofertaId: string) => {
    if (!selected) return
    if (!ofertaId) { setSelected({ ...selected, oferta_id: '', oferta_nro: '' }); return }
    const of = ofertas.find(o => o.id === ofertaId)
    if (!of) return
    setSelected({
      ...selected,
      oferta_id: of.id,
      oferta_nro: of.nro_oferta || '',
      cliente_id: of.cliente_id || selected.cliente_id,
      cliente_nombre: of.cliente_nombre || selected.cliente_nombre,
      nombre_proyecto: selected.nombre_proyecto || of.proyecto || '',
      tipo_moneda: of.tipo_moneda || selected.tipo_moneda,
      presupuesto_base: (of.monto_real_oferta && of.monto_real_oferta > 0) ? of.monto_real_oferta : selected.presupuesto_base,
    })
  }

  // ── WBS / Partidas (Fase 2a) ──
  const fileRef = useRef<HTMLInputElement>(null)
  const codigos = (selected?.partidas || []).map(p => p.codigo)
  const partidasTotal = (selected?.partidas || [])
    .filter(p => esHoja(p.codigo, codigos))
    .reduce((s, p) => s + (p.total_presupuesto || 0), 0)

  const handleImportExcel = async (file: File) => {
    if (!selected) return
    try {
      const buf = await file.arrayBuffer()
      const { partidas, hoja } = parseWbsFromArrayBuffer(buf)
      if (!partidas.length) { alert('No se encontró una tabla de WBS (Código/ITEM) en el Excel.'); return }
      const nuevas: Partida[] = partidas.map(p => ({ id: crypto.randomUUID(), ...p }))
      const cods = nuevas.map(x => x.codigo)
      const totalHojas = nuevas.filter(p => esHoja(p.codigo, cods)).reduce((s, p) => s + (p.total_presupuesto || 0), 0)
      if (!confirm(`Se leyeron ${nuevas.length} partidas de la hoja "${hoja}".\nPresupuesto (suma de hojas): ${totalHojas.toLocaleString('es-CO')}\n\n¿Reemplazar las partidas actuales?`)) return
      setSelected({ ...selected, partidas: nuevas, presupuesto_base: totalHojas || selected.presupuesto_base })
    } catch (err) {
      alert('Error leyendo el Excel: ' + (err as Error).message)
    }
  }
  const addPartida = () => { if (!selected) return; setSelected({ ...selected, partidas: [...(selected.partidas || []), { id: crypto.randomUUID(), codigo: '', item: '', unidad: '', cantidad: 0, valor_unitario: 0, total_presupuesto: 0 }] }) }
  const updPartida = (id: string, patch: Partial<Partida>) => {
    if (!selected) return
    setSelected({ ...selected, partidas: (selected.partidas || []).map(p => {
      if (p.id !== id) return p
      const np = { ...p, ...patch }
      // auto-total si hay cantidad y VU (y no tocaron total manualmente)
      if (('cantidad' in patch || 'valor_unitario' in patch) && np.cantidad && np.valor_unitario) np.total_presupuesto = np.cantidad * np.valor_unitario
      return np
    }) })
  }
  const delPartida = (id: string) => { if (!selected) return; setSelected({ ...selected, partidas: (selected.partidas || []).filter(p => p.id !== id) }) }

  // ── Cortes de avance / Curva S (Fase 3) ──
  const addCorte = () => {
    if (!selected) return
    const nro = (selected.cortes || []).length + 1
    setSelected({ ...selected, cortes: [...(selected.cortes || []), { id: crypto.randomUUID(), periodo: 'Semana ' + nro, fecha: today, pct_plan: 0, pct_real: 0, nota: '' }] })
  }
  const updCorte = (id: string, patch: Partial<Corte>) => { if (!selected) return; setSelected({ ...selected, cortes: (selected.cortes || []).map(c => c.id === id ? { ...c, ...patch } : c) }) }
  const delCorte = (id: string) => { if (!selected) return; setSelected({ ...selected, cortes: (selected.cortes || []).filter(c => c.id !== id) }) }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    const cli = allClientes.find(c => c.id === selected.cliente_id)
    const toSave = { ...selected, cliente_nombre: cli?.razon_social || selected.cliente_nombre }
    if (toSave.id) {
      const _anterior = items.find(x => x.id === toSave.id)
      updateItem(toSave.id, toSave)
      logAudit({ ...auditParams(), accion: 'MODIFICAR', registro_codigo: toSave.codigo, registro_nombre: toSave.nombre_proyecto, detalle: computarDiff(_anterior as unknown as Record<string, unknown>, toSave as unknown as Record<string, unknown>) })
    } else {
      addItem({ ...toSave, id: crypto.randomUUID(), fecha_registro: today, creado_por: `${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`.trim() || (currentUser?.usuario || 'desconocido'), creado_por_usuario: currentUser?.usuario || '', creado_en: today })
      logAudit({ ...auditParams(), accion: 'CREAR', registro_codigo: toSave.codigo, registro_nombre: toSave.nombre_proyecto })
    }
    setIsForm(false); setSelected(null); setVerLectura(false)
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, background: '#ffffff', border: '1px solid #1e3a8a', color: '#1e3a8a', fontWeight: 600, fontSize: 13, outline: 'none' }
  const inputRO: React.CSSProperties = { ...inputStyle, opacity: 0.5 }
  const btnStyle: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }
  const labelStyle: React.CSSProperties = { color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }
  const tdW: React.CSSProperties = { padding: '4px 8px', borderBottom: '1px solid #fed7aa', color: '#000', whiteSpace: 'nowrap' }
  const inW: React.CSSProperties = { padding: '4px 6px', borderRadius: 6, border: '1px solid #fdba74', background: '#fff', color: '#1e3a8a', fontSize: 12, outline: 'none' }
  const situColor = (s: string): React.CSSProperties => {
    const map: Record<string, string> = { 'En Planeación': '#2563eb', 'En Ejecución': '#16a34a', 'Suspendido': '#f59e0b', 'Finalizado': '#059669', 'Cancelado': '#dc2626' }
    return { background: 'transparent', color: map[s] || '#6b7280', border: `1px solid ${map[s] || '#6b7280'}`, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, display: 'inline-block' }
  }

  // Encabezado naranja de obra (identidad del módulo). Envuelto en .po-root para
  // saltar las reglas !important globales y poder usar naranja de verdad.
  const OrangeHeader = () => (
    <div className="po-root" style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 26 }}>📈</span>
        <h1 style={{ margin: 0, fontSize: 23, fontWeight: 900, color: '#ea580c' }}>Control de Proyectos</h1>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#ffffff', background: '#ea580c', padding: '3px 9px', borderRadius: 8, letterSpacing: 0.3 }}>🚧 EN CONSTRUCCIÓN</span>
      </div>
      <div style={{ fontSize: 12.5, color: '#9a3412', marginTop: 4 }}>
        Dashboard gerencial de obra — <b>Fase 1: ficha y datos base</b>. Módulo independiente del módulo Proyectos actual.
      </div>
    </div>
  )

  // ── FORMULARIO (crear / editar / ver) ──
  if (isForm && selected) {
    const ofSel = ofertas.find(o => o.id === selected.oferta_id)
    // ── KPIs del Resumen Gerencial (Fase 4) ──
    const cortesArr = selected.cortes || []
    const ultimoCorte = cortesArr[cortesArr.length - 1]
    const presupuesto = partidasTotal > 0 ? partidasTotal : (selected.presupuesto_base || 0)
    const avanceFisico = ultimoCorte ? (ultimoCorte.pct_real || 0) : 0
    const avancePlan = ultimoCorte ? (ultimoCorte.pct_plan || 0) : 0
    const desvAvance = avanceFisico - avancePlan
    const margenPres = presupuesto > 0 ? (presupuesto - (selected.costo_presupuestado || 0)) / presupuesto * 100 : 0
    const valProy = selected.valor_proyectado || presupuesto
    const margenProy = valProy > 0 ? (valProy - (selected.costo_proyectado || 0)) / valProy * 100 : 0
    const margenRealHoy = (selected.ingresos_real || 0) - (selected.egresos_real || 0)
    const factPct = presupuesto > 0 ? (selected.facturado_acum || 0) / presupuesto * 100 : 0
    const saldoFacturar = (avanceFisico / 100) * presupuesto - (selected.facturado_acum || 0)
    const kpi = (titulo: string, valor: string, color: string, sub?: string) => (
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: `3px solid ${color}`, borderRadius: 10, padding: '10px 14px' }}>
        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .3 }}>{titulo}</div>
        <div style={{ fontSize: 19, fontWeight: 800, color, marginTop: 2 }}>{valor}</div>
        {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{sub}</div>}
      </div>
    )
    const cMargen = (m: number) => m < 0 ? '#dc2626' : m < 5 ? '#f59e0b' : '#16a34a'
    const finInput = (label: string, val: number | undefined, key: keyof ControlProyecto) => (
      <div>
        <label style={labelStyle}>{label}</label>
        {verLectura ? <div className="ver-box">{fmtMoney((val as number) || 0)}</div> : <MoneyInput value={(val as number) || 0} onChange={n => setSelected({ ...selected, [key]: n } as ControlProyecto)} placeholder="0" style={inputStyle} />}
      </div>
    )
    return (
      <div>
        <OrangeHeader />
        <button onClick={() => { setIsForm(false); setSelected(null); setVerLectura(false) }} style={{ ...btnStyle, background: '#000000', color: '#ffffff', border: '1px solid #333333', marginBottom: 16 }}>← Volver</button>
        <form onSubmit={handleSave} style={{ background: '#ffffff', borderRadius: 16, padding: 24, border: '2px solid #ea580c' }}>
          <h2 style={{ color: '#9a3412', fontSize: 18, fontWeight: 800, marginBottom: 20 }}>{verLectura ? 'Ver Control de Proyecto' : selected.id ? 'Editar Control de Proyecto' : 'Nuevo Control de Proyecto'}</h2>
          <fieldset disabled={verLectura} style={{ border: 'none', padding: 0, margin: 0, minInlineSize: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Nro Control *</label>
                {verLectura ? <div className="ver-box">{selected.codigo || '—'}</div> : <input value={selected.codigo} readOnly style={inputRO} />}
              </div>
              <div>
                <label style={labelStyle}>Fecha Registro</label>
                {verLectura ? <div className="ver-box">{fDate(selected.fecha_registro || today) || '—'}</div> : <input value={fDate(selected.fecha_registro || today)} readOnly style={inputRO} />}
              </div>
              <div>
                <label style={labelStyle}>Código Proyecto</label>
                {verLectura ? <div className="ver-box">{selected.codigo_proyecto || '—'}</div> : <input value={selected.codigo_proyecto} onChange={e => setSelected({ ...selected, codigo_proyecto: e.target.value.toUpperCase() })} placeholder="Código interno..." style={inputStyle} />}
              </div>

              {/* Vínculo a Oferta ganada (auto-rellena) */}
              <div style={{ gridColumn: 'span 3', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 10, padding: 12 }}>
                <label style={{ ...labelStyle, color: '#9a3412' }}>🔗 Vincular Oferta (opcional — trae cliente, proyecto, moneda y presupuesto)</label>
                {verLectura
                  ? <div className="ver-box">{selected.oferta_nro ? `${selected.oferta_nro}${ofSel ? ' · ' + (ofSel.proyecto || '') : ''}` : '— sin vincular —'}</div>
                  : <select value={selected.oferta_id || ''} onChange={e => vincularOferta(e.target.value)} style={inputStyle}>
                      <option value="">— sin vincular —</option>
                      {ofertas.map(o => <option key={o.id} value={o.id}>{o.nro_oferta} · {o.cliente_nombre} · {o.proyecto}{o.situacion ? ` (${o.situacion})` : ''}</option>)}
                    </select>}
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Nombre del Proyecto *</label>
                {verLectura ? <div className="ver-box">{selected.nombre_proyecto || '—'}</div> : <input value={selected.nombre_proyecto} onChange={e => setSelected({ ...selected, nombre_proyecto: e.target.value })} required placeholder="Nombre del proyecto..." style={inputStyle} />}
              </div>
              <div>
                <label style={labelStyle}>País{usuarioGlobal && ' *'}</label>
                {verLectura ? <div className="ver-box">{etiquetaPais(selected.pais)}</div> : usuarioGlobal ? (
                  <select value={selected.pais || ''} onChange={e => setSelected({ ...selected, pais: e.target.value })} style={inputStyle}>
                    {PAISES_ACTIVOS.map(p => <option key={p.codigo} value={p.codigo}>{p.bandera} {p.nombre}</option>)}
                  </select>
                ) : <div style={{ ...inputStyle, background: '#f1f5f9', color: '#64748b' }}>{etiquetaPais(selected.pais)}</div>}
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Cliente *</label>
                {verLectura ? <div className="ver-box">{selected.cliente_nombre || '—'}</div> : <select value={selected.cliente_id} onChange={e => {
                  const cli = clientes.find(c => c.id === e.target.value)
                  setSelected({ ...selected, cliente_id: e.target.value, cliente_nombre: cli?.razon_social || '' })
                }} required style={inputStyle}>
                  <option value="">Seleccionar cliente...</option>
                  {selected.cliente_id && !clientes.some(c => c.id === selected.cliente_id) && (
                    <option value={selected.cliente_id}>{selected.cliente_nombre || '(cliente del registro)'}</option>
                  )}
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
                </select>}
              </div>
              <div>
                <label style={labelStyle}>Responsable / Gerente</label>
                {verLectura ? <div className="ver-box">{selected.responsable || '—'}</div> : <input value={selected.responsable} onChange={e => setSelected({ ...selected, responsable: e.target.value })} placeholder="Responsable..." style={inputStyle} />}
              </div>

              <div style={{ gridColumn: 'span 3' }}>
                <label style={labelStyle}>Alcance / Descripción</label>
                {verLectura ? <div className="ver-box">{selected.descripcion || '—'}</div> : <textarea value={selected.descripcion} onChange={e => setSelected({ ...selected, descripcion: e.target.value })} rows={2} placeholder="Alcance del proyecto..." style={{ ...inputStyle, resize: 'vertical' }} />}
              </div>

              <div>
                <label style={labelStyle}>Tipo de Contrato</label>
                {verLectura ? <div className="ver-box">{selected.tipo_contrato || '—'}</div> : <select value={selected.tipo_contrato} onChange={e => setSelected({ ...selected, tipo_contrato: e.target.value })} style={inputStyle}>
                  {CONTRATO_DEFAULT.map(o => <option key={o} value={o}>{o}</option>)}
                </select>}
              </div>
              <div>
                <label style={labelStyle}>Tipo de Moneda</label>
                {verLectura ? <div className="ver-box">{selected.tipo_moneda || '—'}</div> : <select value={selected.tipo_moneda} onChange={e => setSelected({ ...selected, tipo_moneda: e.target.value })} style={inputStyle}>
                  {refOptions('tipo_moneda', MONEDA_DEFAULT).map(o => <option key={o} value={o}>{o}</option>)}
                </select>}
              </div>
              <div>
                <label style={labelStyle}>Presupuesto / Línea Base</label>
                <MoneyInput value={selected.presupuesto_base || 0} onChange={n => setSelected({ ...selected, presupuesto_base: n })} placeholder="0" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Fecha Inicio (Plan)</label>
                {verLectura ? <div className="ver-box">{selected.fecha_inicio_plan || '—'}</div> : <input type="date" value={selected.fecha_inicio_plan} onChange={e => setSelected({ ...selected, fecha_inicio_plan: e.target.value })} style={inputStyle} />}
              </div>
              <div>
                <label style={labelStyle}>Fecha Fin (Plan)</label>
                {verLectura ? <div className="ver-box">{selected.fecha_fin_plan || '—'}</div> : <input type="date" value={selected.fecha_fin_plan} onChange={e => setSelected({ ...selected, fecha_fin_plan: e.target.value })} style={inputStyle} />}
              </div>
              <div>
                <label style={labelStyle}>Fecha Inicio Real</label>
                {verLectura ? <div className="ver-box">{selected.fecha_inicio_real || '—'}</div> : <input type="date" value={selected.fecha_inicio_real} onChange={e => setSelected({ ...selected, fecha_inicio_real: e.target.value })} style={inputStyle} />}
              </div>

              <div>
                <label style={labelStyle}>Frecuencia de Corte</label>
                {verLectura ? <div className="ver-box">{selected.frecuencia_corte || '—'}</div> : <select value={selected.frecuencia_corte} onChange={e => setSelected({ ...selected, frecuencia_corte: e.target.value })} style={inputStyle}>
                  {FRECUENCIA.map(o => <option key={o} value={o}>{o}</option>)}
                </select>}
              </div>
              <div>
                <label style={labelStyle}>Vincular Proyecto actual (opcional)</label>
                {verLectura ? <div className="ver-box">{proyectosActuales.find(pr => pr.id === selected.proyecto_id)?.codigo_proyecto || '— ninguno —'}</div> : <select value={selected.proyecto_id || ''} onChange={e => setSelected({ ...selected, proyecto_id: e.target.value })} style={inputStyle}>
                  <option value="">— ninguno —</option>
                  {proyectosActuales.map(pr => <option key={pr.id} value={pr.id}>{pr.codigo} · {pr.codigo_proyecto || pr.cliente_nombre}</option>)}
                </select>}
              </div>
              <div>
                <label style={labelStyle}>Situación</label>
                {verLectura ? <div className="ver-box">{selected.situacion || '—'}</div> : <select value={selected.situacion} onChange={e => setSelected({ ...selected, situacion: e.target.value })} style={inputStyle}>
                  {refOptions('situacion_proyecto', SITUACION_DEFAULT).map(o => <option key={o} value={o}>{o}</option>)}
                </select>}
              </div>
            </div>
          </fieldset>

          {/* 🧱 WBS / Partidas — Fase 2a */}
          <div style={{ marginTop: 22, border: '1px solid #fdba74', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ background: '#fff7ed', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <b style={{ color: '#9a3412', fontSize: 14 }}>🧱 Partidas (WBS) · Presupuesto línea base</b>
              {!verLectura && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleImportExcel(f); e.target.value = '' }} />
                  <button type="button" onClick={() => fileRef.current?.click()} style={{ ...btnStyle, padding: '6px 12px', fontSize: 12, background: '#16a34a', color: '#fff' }}>⬆ Importar Excel</button>
                  <button type="button" onClick={addPartida} style={{ ...btnStyle, padding: '6px 12px', fontSize: 12, background: '#ea580c', color: '#fff' }}>+ Partida</button>
                </div>
              )}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>{['Código', 'ITEM', 'Unidad', 'Cantidad', 'Valor Unitario', 'Total Presupuesto', 'Peso %', ...(verLectura ? [] : [''])].map((h, idx) => <th key={idx} style={{ background: '#fed7aa', color: '#7c2d12', padding: '6px 8px', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {(selected.partidas || []).map(pt => {
                    const nivel = nivelDeCodigo(pt.codigo)
                    const hoja = esHoja(pt.codigo, codigos)
                    const peso = partidasTotal > 0 && hoja ? (pt.total_presupuesto / partidasTotal * 100) : 0
                    return (
                      <tr key={pt.id} style={{ background: nivel === 1 ? '#fff7ed' : '#fff' }}>
                        <td style={tdW}>{verLectura ? pt.codigo : <input value={pt.codigo} onChange={e => updPartida(pt.id, { codigo: e.target.value })} style={{ ...inW, width: 70, fontWeight: 700 }} />}</td>
                        <td style={tdW}><div style={{ paddingLeft: (nivel - 1) * 14 }}>{verLectura ? <span style={{ fontWeight: nivel === 1 ? 700 : 400 }}>{pt.item}</span> : <input value={pt.item} onChange={e => updPartida(pt.id, { item: e.target.value })} style={{ ...inW, minWidth: 200, fontWeight: nivel === 1 ? 700 : 400 }} />}</div></td>
                        <td style={tdW}>{verLectura ? pt.unidad : <input value={pt.unidad} onChange={e => updPartida(pt.id, { unidad: e.target.value })} style={{ ...inW, width: 60 }} />}</td>
                        <td style={{ ...tdW, textAlign: 'right' }}>{verLectura ? (pt.cantidad || 0).toLocaleString('es-CO') : <input type="number" value={pt.cantidad || 0} onChange={e => updPartida(pt.id, { cantidad: parseFloat(e.target.value) || 0 })} style={{ ...inW, width: 80, textAlign: 'right' }} />}</td>
                        <td style={{ ...tdW, textAlign: 'right' }}>{verLectura ? fmtMoney(pt.valor_unitario || 0) : <input type="number" value={pt.valor_unitario || 0} onChange={e => updPartida(pt.id, { valor_unitario: parseFloat(e.target.value) || 0 })} style={{ ...inW, width: 110, textAlign: 'right' }} />}</td>
                        <td style={{ ...tdW, textAlign: 'right' }}>{verLectura ? fmtMoney(pt.total_presupuesto || 0) : <input type="number" value={pt.total_presupuesto || 0} onChange={e => updPartida(pt.id, { total_presupuesto: parseFloat(e.target.value) || 0 })} style={{ ...inW, width: 130, textAlign: 'right' }} />}</td>
                        <td style={{ ...tdW, textAlign: 'right', color: '#9a3412', fontWeight: 700 }}>{hoja ? peso.toFixed(1) + '%' : '—'}</td>
                        {!verLectura && <td style={tdW}><button type="button" onClick={() => delPartida(pt.id)} style={{ ...btnStyle, padding: '2px 8px', fontSize: 10, background: '#dc2626', color: '#fff' }}>✕</button></td>}
                      </tr>
                    )
                  })}
                  {(selected.partidas || []).length === 0 && <tr><td colSpan={verLectura ? 7 : 8} style={{ padding: 18, textAlign: 'center', color: '#9a3412' }}>Sin partidas. Importa el Excel o agrega manualmente.</td></tr>}
                </tbody>
                {(selected.partidas || []).length > 0 && <tfoot><tr><td colSpan={5} style={{ ...tdW, textAlign: 'right', fontWeight: 800, color: '#7c2d12' }}>TOTAL (suma de hojas)</td><td style={{ ...tdW, textAlign: 'right', fontWeight: 800, color: '#7c2d12' }}>{fmtMoney(partidasTotal)}</td><td colSpan={verLectura ? 1 : 2} style={tdW}></td></tr></tfoot>}
              </table>
            </div>
          </div>

          {/* 📈 Cortes de Avance + Curva S — Fase 3 */}
          <div style={{ marginTop: 22, border: '1px solid #fdba74', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ background: '#fff7ed', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <b style={{ color: '#9a3412', fontSize: 14 }}>📈 Cortes de Avance · Curva S</b>
              {!verLectura && <button type="button" onClick={addCorte} style={{ ...btnStyle, padding: '6px 12px', fontSize: 12, background: '#ea580c', color: '#fff' }}>+ Corte</button>}
            </div>
            <CurvaS
              labels={(selected.cortes || []).map(c => c.periodo || '')}
              series={[
                { label: 'Planeado', color: '#2563eb', values: (selected.cortes || []).map(c => c.pct_plan || 0) },
                { label: 'Real', color: '#ea580c', values: (selected.cortes || []).map(c => c.pct_real || 0) },
              ]}
              fmt={v => Math.round(v) + '%'}
              maxHint={100}
              vacio="Aún no hay cortes. Agrega cortes y la Curva S se dibuja sola."
            />
            <div style={{ overflowX: 'auto', borderTop: '1px solid #fed7aa' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr>{['Periodo', 'Fecha', '% Plan acum.', '% Real acum.', 'Desv.', 'Hito / Nota', ...(verLectura ? [] : [''])].map((h, idx) => <th key={idx} style={{ background: '#fed7aa', color: '#7c2d12', padding: '6px 8px', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {(selected.cortes || []).map(ct => {
                    const desv = (ct.pct_real || 0) - (ct.pct_plan || 0)
                    return (
                      <tr key={ct.id}>
                        <td style={tdW}>{verLectura ? ct.periodo : <input value={ct.periodo} onChange={e => updCorte(ct.id, { periodo: e.target.value })} style={{ ...inW, width: 110 }} />}</td>
                        <td style={tdW}>{verLectura ? (ct.fecha || '—') : <input type="date" value={ct.fecha} onChange={e => updCorte(ct.id, { fecha: e.target.value })} style={{ ...inW, width: 130 }} />}</td>
                        <td style={{ ...tdW, textAlign: 'right' }}>{verLectura ? ((ct.pct_plan || 0) + '%') : <input type="number" value={ct.pct_plan || 0} onChange={e => updCorte(ct.id, { pct_plan: parseFloat(e.target.value) || 0 })} style={{ ...inW, width: 70, textAlign: 'right' }} />}</td>
                        <td style={{ ...tdW, textAlign: 'right' }}>{verLectura ? ((ct.pct_real || 0) + '%') : <input type="number" value={ct.pct_real || 0} onChange={e => updCorte(ct.id, { pct_real: parseFloat(e.target.value) || 0 })} style={{ ...inW, width: 70, textAlign: 'right' }} />}</td>
                        <td style={{ ...tdW, textAlign: 'right', fontWeight: 700, color: desv < 0 ? '#dc2626' : '#16a34a' }}>{desv > 0 ? '+' : ''}{desv.toFixed(1)}%</td>
                        <td style={tdW}>{verLectura ? (ct.nota || '—') : <input value={ct.nota || ''} onChange={e => updCorte(ct.id, { nota: e.target.value })} placeholder="hito / retraso..." style={{ ...inW, minWidth: 180 }} />}</td>
                        {!verLectura && <td style={tdW}><button type="button" onClick={() => delCorte(ct.id)} style={{ ...btnStyle, padding: '2px 8px', fontSize: 10, background: '#dc2626', color: '#fff' }}>✕</button></td>}
                      </tr>
                    )
                  })}
                  {(selected.cortes || []).length === 0 && <tr><td colSpan={verLectura ? 6 : 7} style={{ padding: 14, textAlign: 'center', color: '#9a3412' }}>Sin cortes. Pulsa “+ Corte” para registrar el avance por período.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* 📊 Resumen Gerencial (KPIs) + finanzas + Curva S financiera — Fase 4 */}
          <div style={{ marginTop: 22, border: '1px solid #fdba74', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ background: '#fff7ed', padding: '10px 14px' }}>
              <b style={{ color: '#9a3412', fontSize: 14 }}>📊 Resumen Gerencial · KPIs</b>
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>
                {kpi('Presupuesto', fmtMoney(presupuesto), '#1e3a8a')}
                {kpi('Avance físico', avanceFisico.toFixed(1) + '%', '#ea580c', `Plan ${avancePlan.toFixed(1)}% · Desv ${desvAvance > 0 ? '+' : ''}${desvAvance.toFixed(1)}%`)}
                {kpi('Margen presupuestado', margenPres.toFixed(1) + '%', cMargen(margenPres))}
                {kpi('Margen proyectado', margenProy.toFixed(1) + '%', cMargen(margenProy))}
                {kpi('Margen real a hoy', fmtMoney(margenRealHoy), margenRealHoy < 0 ? '#dc2626' : '#16a34a', 'Ingresos − Egresos')}
                {kpi('Facturado', factPct.toFixed(1) + '%', '#2563eb', fmtMoney(selected.facturado_acum || 0))}
                {kpi('Saldo por facturar', fmtMoney(saldoFacturar), saldoFacturar > 0 ? '#f59e0b' : '#16a34a', '(avance × ppto) − facturado')}
              </div>
              <fieldset disabled={verLectura} style={{ border: 'none', padding: 0, margin: '16px 0 0', minInlineSize: 'auto' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#9a3412', marginBottom: 8 }}>Datos financieros (alimentan los KPIs)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  {finInput('Costo presupuestado', selected.costo_presupuestado, 'costo_presupuestado')}
                  {finInput('Valor proyectado', selected.valor_proyectado, 'valor_proyectado')}
                  {finInput('Costo proyectado', selected.costo_proyectado, 'costo_proyectado')}
                  {finInput('Ingresos reales', selected.ingresos_real, 'ingresos_real')}
                  {finInput('Egresos reales', selected.egresos_real, 'egresos_real')}
                  {finInput('Facturado acumulado', selected.facturado_acum, 'facturado_acum')}
                </div>
              </fieldset>
            </div>
            <div style={{ borderTop: '1px solid #fed7aa' }}>
              <div style={{ padding: '8px 14px 0', fontSize: 13, fontWeight: 700, color: '#9a3412' }}>Curva S financiera ($) — valor planeado vs valor ganado</div>
              <CurvaS
                labels={cortesArr.map(c => c.periodo || '')}
                series={[
                  { label: 'Valor planeado', color: '#2563eb', values: cortesArr.map(c => (c.pct_plan || 0) / 100 * presupuesto) },
                  { label: 'Valor ganado (real)', color: '#ea580c', values: cortesArr.map(c => (c.pct_real || 0) / 100 * presupuesto) },
                ]}
                fmt={v => '$' + (v / 1e6).toFixed(0) + 'M'}
                vacio="Registra cortes y define el presupuesto; la curva financiera aparece sola."
              />
            </div>
          </div>

          {verLectura && (
            <p style={{ color: '#000000', fontSize: 13, fontWeight: 700, marginTop: 14 }}>
              👤 Creado por: {selected.creado_por || '—'}{selected.creado_por_usuario ? ` (${selected.creado_por_usuario})` : ''}{selected.creado_en ? ` · ${selected.creado_en}` : ''}
            </p>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            {!verLectura && <button type="submit" style={{ ...btnStyle, background: '#ea580c', color: '#ffffff' }}>Guardar</button>}
            <button type="button" onClick={() => { setIsForm(false); setSelected(null); setVerLectura(false) }} style={{ ...btnStyle, background: '#64748b', color: '#ffffff' }}>{verLectura ? 'Volver' : 'Cancelar'}</button>
          </div>
        </form>
        {selected.id && (
          <>
            <SeguimientoPanel
              seguimientos={selected.seguimientos || []}
              usuario={`${currentUser?.nombre} ${currentUser?.apellido}`}
              situacionActual={selected.situacion}
              situacionOpciones={refOptions('situacion_proyecto', SITUACION_DEFAULT)}
              readOnly={verLectura}
              onAdd={(seg: Seguimiento) => {
                const updated = { ...selected, situacion: seg.situacion, seguimientos: [...(selected.seguimientos || []), seg] }
                updateItem(selected.id, updated); setSelected(updated)
              }}
            />
            <DocumentosPanel modulo="control-proyectos" registroId={selected.id} />
          </>
        )}
      </div>
    )
  }

  // ── VISTA PRINCIPAL ──
  return (
    <div>
      <OrangeHeader />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por código, proyecto, cliente o responsable..." style={{ ...inputStyle, maxWidth: 380 }} />
        {usuarioGlobal && (
          <select value={filtroPais} onChange={e => setFiltroPais(e.target.value)} style={{ ...inputStyle, maxWidth: 220 }}>
            <option value="">🌎 Todos los países</option>
            {PAISES_ACTIVOS.map(p => <option key={p.codigo} value={p.codigo}>{p.bandera} {p.nombre}</option>)}
          </select>
        )}
        {permisos.crear && (
          <button onClick={() => { setSelected(emptyControlProyecto(nextConsecutivo('CTP-', items.map(p => p.codigo)).codigo, `${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`.trim(), usuarioGlobal ? (PAISES_ACTIVOS[0]?.codigo || 'Colombia') : paisUsuario)); setVerLectura(false); setIsForm(true) }} style={{ ...btnStyle, background: '#ea580c', color: '#ffffff' }}>+ Nuevo Control</button>
        )}
      </div>

      <div style={{ borderRadius: 12, border: '1px solid #ea580c', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Nro', 'Proyecto', 'Cliente', 'Responsable', 'País', 'Presupuesto Base', 'Situación', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '12px 14px', background: '#ea580c', color: '#fff', fontSize: 12, textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={p.id} style={{ background: i % 2 === 0 ? '#fff7ed' : '#fff' }}>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #fed7aa', color: '#000', fontSize: 13, fontFamily: 'monospace' }}>{p.codigo}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #fed7aa', color: '#000', fontSize: 13, fontWeight: 600 }}>{p.nombre_proyecto || '—'}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #fed7aa', color: '#000', fontSize: 13 }}>{p.cliente_nombre || '—'}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #fed7aa', color: '#000', fontSize: 13 }}>{p.responsable || '—'}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #fed7aa', color: '#000', fontSize: 13, whiteSpace: 'nowrap' }}>{etiquetaPais(p.pais)}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #fed7aa', color: '#000', fontSize: 13, textAlign: 'right' }}>{fmtMoney(p.presupuesto_base || 0)}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #fed7aa' }}><span style={situColor(p.situacion)}>{p.situacion}</span></td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #fed7aa' }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <button onClick={() => { setSelected(p); setVerLectura(true); setIsForm(true) }} style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#ea580c', color: '#ffffff', border: '1px solid #f97316' }}>Ver</button>
                    {permisos.editar && <button onClick={() => { setSelected(p); setVerLectura(false); setIsForm(true) }} style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#2563eb', color: '#ffffff', border: '1px solid #3b82f6' }}>Editar</button>}
                    {permisos.eliminar && <button onClick={() => { if (confirm(`¿Eliminar el control ${p.codigo}?`)) { deleteItem(p.id); logAudit({ ...auditParams(), accion: 'ELIMINAR', registro_codigo: p.codigo, registro_nombre: p.nombre_proyecto }) } }} style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#dc2626', color: '#ffffff', border: '1px solid #ef4444' }}>Eliminar</button>}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#9a3412', fontSize: 14 }}>No hay proyectos en control todavía. Crea el primero con “+ Nuevo Control”.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
