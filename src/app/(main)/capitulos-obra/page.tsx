'use client'

import { useIdioma } from '@/shared/i18n/use-t'
import { useState, useEffect } from 'react'
import { PRESUPUESTO_CSS } from '@/shared/lib/presupuesto-css'
import { useCapitulosObraStore, type CapituloObra, type TipoCapitulo } from '@/features/capitulos-obra/store/capitulos-obra-store'
import { useOfertasStore } from '@/features/ofertas/store/ofertas-store'
import { useCurrentUserStore } from '@/features/usuarios-gestion/store/current-user-store'
import { PAISES_ACTIVOS, esGlobal, etiquetaPais } from '@/shared/lib/paises'
import { usePermisos } from '@/shared/hooks/use-permisos'
import ViewRecordModal from '@/shared/components/view-record-modal'
import { CreadoPorCell } from '@/shared/components/creado-por-cell'

const SITUACIONES = ['Activo', 'Inactivo']
const TIPOS: TipoCapitulo[] = ['Directo', 'Indirecto']

const sitStyle = (s: string): React.CSSProperties =>
  s === 'Activo'
    ? { background: 'rgba(122,152,198,1)', color: '#fff', border: '1px solid rgba(122,152,198,0.3)' }
    : { background: 'rgba(239,68,68,1)', color: '#fff', border: '1px solid rgba(239,68,68,0.3)' }

const tipoStyle = (t: TipoCapitulo): React.CSSProperties =>
  t === 'Directo'
    ? { background: 'rgba(21,128,61,0.12)', color: '#15803d', border: '1px solid rgba(21,128,61,0.3)' }
    : { background: 'rgba(234,88,12,0.12)', color: '#ea580c', border: '1px solid rgba(234,88,12,0.3)' }

const hoy = () => new Date().toISOString().slice(0, 10)
const emptyForm: CapituloObra = {
  id: '', codigo: '', nombre: '', tipo: 'Directo', orden: 0, situacion: 'Activo',
  nivel: 'Capitulo', capitulo_padre_id: '',
  oferta_consecutivo: '', cliente: '', fecha_registro: '', codigo_gtm: '', responsable_tecnico: '',
  comercial: '', lugar_ejecucion: '', moneda: '', alcance: '', pais: '',
}

export default function CapitulosObraPage() {
  const idioma = useIdioma()
  const es = idioma !== 'en'
  const permisos = usePermisos('capitulos-obra')
  const { capitulos, addCapitulo, updateCapitulo, deleteCapitulo } = useCapitulosObraStore()
  const loadCapitulos = useCapitulosObraStore(s => s.loadCapitulos)
  const ofertas = useOfertasStore(s => s.ofertas)
  const loadOfertas = useOfertasStore(s => s.loadOfertas)
  const currentUser = useCurrentUserStore(s => s.user)
  const paisUsuario = currentUser?.pais || ''
  const usuarioGlobal = esGlobal(paisUsuario)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState<CapituloObra>(emptyForm)
  const [search, setSearch] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'Todos' | TipoCapitulo>('Todos')
  const [filtroPais, setFiltroPais] = useState('')  // solo lo usan usuarios GLOBAL
  const [ofertaSel, setOfertaSel] = useState('')
  const [viewRecord, setViewRecord] = useState<CapituloObra | null>(null)

  useEffect(() => {
    loadCapitulos()
    loadOfertas()
  }, [loadCapitulos, loadOfertas])

  // Ofertas que tienen capítulos + cabecera de la oferta seleccionada
  const ofertasDisponibles = Array.from(new Set(capitulos.map(c => c.oferta_consecutivo).filter(Boolean))) as string[]
  const cab = ofertaSel ? capitulos.find(c => c.oferta_consecutivo === ofertaSel) : null

  const filtered = capitulos
    .filter(r => !!r.oferta_consecutivo)   // solo capítulos ligados a una Oferta (los E-XX)
    .filter(r => !ofertaSel || r.oferta_consecutivo === ofertaSel)
    .filter(r => !usuarioGlobal || !filtroPais || r.pais === filtroPais)   // filtrado cliente para GLOBAL
    .filter(r => filtroTipo === 'Todos' || r.tipo === filtroTipo)
    .filter(r =>
      r.codigo.toLowerCase().includes(search.toLowerCase()) ||
      r.nombre.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => a.orden - b.orden)

  // Orden jerárquico: cada capítulo raíz seguido de sus subcapítulos (con profundidad para indentar)
  const filas: (CapituloObra & { _depth: number })[] = []
  const incluidos = new Set<string>()
  const raices = filtered.filter(r => !r.capitulo_padre_id).sort((a, b) => a.orden - b.orden)
  for (const r of raices) {
    filas.push({ ...r, _depth: 0 }); incluidos.add(r.id)
    filtered.filter(h => h.capitulo_padre_id === r.id).sort((a, b) => a.orden - b.orden)
      .forEach(h => { filas.push({ ...h, _depth: 1 }); incluidos.add(h.id) })
  }
  // Subcapítulos cuyo padre no está en el filtro actual: no perderlos
  filtered.filter(r => !incluidos.has(r.id)).sort((a, b) => a.orden - b.orden)
    .forEach(r => filas.push({ ...r, _depth: r.capitulo_padre_id ? 1 : 0 }))

  const openNew = () => {
    const maxOrden = capitulos.reduce((m, c) => Math.max(m, c.orden), 0)
    // Usuario de país → su país; GLOBAL → primer país activo (puede cambiarlo).
    setForm({ ...emptyForm, orden: maxOrden + 1, fecha_registro: hoy(), pais: usuarioGlobal ? (PAISES_ACTIVOS[0]?.codigo || 'Perú') : paisUsuario })
    setIsFormOpen(true)
  }
  const openEdit = (r: CapituloObra) => { setForm({ ...emptyForm, ...r }); setIsFormOpen(true) }

  // Crear un Subcapítulo bajo un capítulo padre: hereda la cabecera de la oferta y arma el código E-XX.NN
  const openNewSub = (padre: CapituloObra) => {
    const subs = capitulos.filter(c => c.capitulo_padre_id === padre.id)
    const nextN = subs.reduce((m, s) => { const n = parseInt(String(s.codigo).split('.')[1] || '0', 10); return Math.max(m, isNaN(n) ? 0 : n) }, 0) + 1
    const maxOrden = capitulos.reduce((m, c) => Math.max(m, c.orden), 0)
    setForm({
      ...emptyForm,
      nivel: 'Subcapitulo',
      capitulo_padre_id: padre.id,
      codigo: `${padre.codigo}.${String(nextN).padStart(2, '0')}`,
      tipo: padre.tipo,
      orden: maxOrden + 1,
      fecha_registro: hoy(),
      // heredar cabecera de la oferta del padre
      oferta_consecutivo: padre.oferta_consecutivo, cliente: padre.cliente, codigo_gtm: padre.codigo_gtm,
      responsable_tecnico: padre.responsable_tecnico, comercial: padre.comercial,
      lugar_ejecucion: padre.lugar_ejecucion, moneda: padre.moneda, alcance: padre.alcance,
      // hereda el país del capítulo padre (multipaís)
      pais: padre.pais || (usuarioGlobal ? (PAISES_ACTIVOS[0]?.codigo || 'Perú') : paisUsuario),
    })
    setIsFormOpen(true)
  }

  // Al seleccionar la Oferta, traer los datos de su cabecera
  const seleccionarOferta = (consec: string) => {
    const of = ofertas.find(o => o.consecutivo === consec)
    setForm(f => ({
      ...f,
      oferta_consecutivo: consec,
      cliente: of?.cliente || of?.proyecto || '',
      codigo_gtm: of?.codigo_gtm || '',
      responsable_tecnico: of?.responsable_tecnico || '',
      comercial: of?.comercial || '',
      lugar_ejecucion: of?.lugar_ejecucion || '',
      moneda: of?.moneda || '',
      alcance: of?.alcance || '',
    }))
  }
  const handleDelete = (id: string) => { if (confirm('¿Eliminar este capítulo de obra?')) deleteCapitulo(id) }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.id) { updateCapitulo(form.id, { ...form }) }
    else { addCapitulo({ ...form, id: crypto.randomUUID() }) }
    setIsFormOpen(false)
  }

  return (
    <div className="po-root">
      <style dangerouslySetInnerHTML={{ __html: PRESUPUESTO_CSS }} />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#0b1d4a] tracking-tight">Capítulos de Ofertas</h1>
          <p className="text-[#6b7280] mt-1">Catálogo maestro de capítulos (directos e indirectos) para el seguimiento de obras</p>
        </div>
        {permisos.editar && (
          <button onClick={openNew} className="px-5 py-2.5 rounded-xl font-medium text-white transition-all" style={{ background: '#1e3a8a', border: '1px solid #1e3a8a' }}>
            Nuevo Capítulo
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="mb-8 rounded-2xl p-6 space-y-4" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
          <h2 className="text-lg font-semibold text-[#0b1d4a]">{form.id ? 'Editar' : 'Nuevo'} {form.capitulo_padre_id ? 'Subcapítulo' : 'Capítulo'} de Oferta</h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* ── Cabecera de la Oferta ── */}
            <div className="lg:col-span-3">
              <h3 className="text-base font-extrabold" style={{ color: '#1e3a8a' }}>📈 Datos de la Oferta</h3>
              <p className="text-sm text-[#6b7280]">Selecciona la Oferta y sus datos se traen automáticamente.</p>
            </div>
            <div>
              <label className="block text-lg font-extrabold text-[#0b1d4a] mb-1">{es ? 'Nro. Consecutivo Oferta' : 'Bid Sequence No.'}</label>
              <select value={form.oferta_consecutivo || ''} onChange={e => seleccionarOferta(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-[#0b1d4a] font-bold outline-none" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                <option value="">Seleccione Oferta…</option>
                {ofertas.map(o => <option key={o.id} value={o.consecutivo}>{o.consecutivo}{o.cliente || o.proyecto ? ` — ${o.cliente || o.proyecto}` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-lg font-extrabold text-[#0b1d4a] mb-1">{es ? 'Fecha Registro' : 'Registration Date'}</label>
              <input type="date" value={form.fecha_registro || ''} onChange={e => setForm({ ...form, fecha_registro: e.target.value })}
                className="w-full rounded-xl px-4 py-2.5 text-[#0b1d4a] font-bold outline-none" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }} />
            </div>
            <div>
              <label className="block text-lg font-extrabold text-[#0b1d4a] mb-1">{es ? 'Nro. Oferta GTM' : 'GTM Bid No.'}</label>
              <input readOnly value={form.codigo_gtm || ''} className="w-full rounded-xl px-4 py-2.5 font-bold outline-none cursor-not-allowed" style={{ background: '#f1f5f9', border: '1px solid #e5e7eb', color: '#0b1d4a' }} placeholder="(de la oferta)" />
            </div>
            <div>
              <label className="block text-lg font-extrabold text-[#0b1d4a] mb-1">{es ? 'Cliente' : 'Client'}</label>
              <input readOnly value={form.cliente || ''} className="w-full rounded-xl px-4 py-2.5 font-bold outline-none cursor-not-allowed" style={{ background: '#f1f5f9', border: '1px solid #e5e7eb', color: '#0b1d4a' }} placeholder="(de la oferta)" />
            </div>
            <div>
              <label className="block text-lg font-extrabold text-[#0b1d4a] mb-1">{es ? 'Responsable Técnico' : 'Technical Manager'}</label>
              <input readOnly value={form.responsable_tecnico || ''} className="w-full rounded-xl px-4 py-2.5 font-bold outline-none cursor-not-allowed" style={{ background: '#f1f5f9', border: '1px solid #e5e7eb', color: '#0b1d4a' }} placeholder="(de la oferta)" />
            </div>
            <div>
              <label className="block text-lg font-extrabold text-[#0b1d4a] mb-1">{es ? 'Responsable Comercial' : 'Sales Manager'}</label>
              <input readOnly value={form.comercial || ''} className="w-full rounded-xl px-4 py-2.5 font-bold outline-none cursor-not-allowed" style={{ background: '#f1f5f9', border: '1px solid #e5e7eb', color: '#0b1d4a' }} placeholder="(de la oferta)" />
            </div>
            <div>
              <label className="block text-lg font-extrabold text-[#0b1d4a] mb-1">{es ? 'Lugar de Ejecución' : 'Execution Site'}</label>
              <input readOnly value={form.lugar_ejecucion || ''} className="w-full rounded-xl px-4 py-2.5 font-bold outline-none cursor-not-allowed" style={{ background: '#f1f5f9', border: '1px solid #e5e7eb', color: '#0b1d4a' }} placeholder="(de la oferta)" />
            </div>
            <div>
              <label className="block text-lg font-extrabold text-[#0b1d4a] mb-1">{es ? 'Tipo Moneda' : 'Currency Type'}</label>
              <input readOnly value={form.moneda || ''} className="w-full rounded-xl px-4 py-2.5 font-bold outline-none cursor-not-allowed" style={{ background: '#f1f5f9', border: '1px solid #e5e7eb', color: '#0b1d4a' }} placeholder="(de la oferta)" />
            </div>
            <div className="lg:col-span-3">
              <label className="block text-lg font-extrabold text-[#0b1d4a] mb-1">{es ? 'Alcance del Proyecto' : 'Project Scope'}</label>
              <textarea readOnly value={form.alcance || ''} rows={2} className="w-full rounded-xl px-4 py-2.5 font-bold outline-none cursor-not-allowed" style={{ background: '#f1f5f9', border: '1px solid #e5e7eb', color: '#0b1d4a' }} placeholder="(de la oferta)" />
            </div>

            {form.capitulo_padre_id && (
              <div className="lg:col-span-3 rounded-lg px-4 py-2.5 text-sm font-bold" style={{ background: '#eef2ff', border: '1px solid #c7d2fe', color: '#3730a3' }}>
                ↳ Subcapítulo de: <span className="font-mono">{capitulos.find(c => c.id === form.capitulo_padre_id)?.codigo}</span> — {capitulos.find(c => c.id === form.capitulo_padre_id)?.nombre}
              </div>
            )}
            {/* ── Datos del Capítulo ── */}
            <div className="lg:col-span-3 mt-1 pt-2 border-t" style={{ borderColor: '#e5e7eb' }}>
              <h3 className="text-base font-extrabold" style={{ color: '#1e3a8a' }}>🧱 Datos del Capítulo</h3>
            </div>
            <div>
              <label className="block text-xl font-extrabold text-[#0b1d4a] mb-1">{es ? 'Código *' : 'Code *'}</label>
              <input required value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })}
                className="w-full rounded-xl px-4 py-2.5 text-[#0b1d4a] outline-none"
                style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}
                placeholder="60" />
            </div>
            <div>
              <label className="block text-xl font-extrabold text-[#0b1d4a] mb-1">{es ? 'Nombre *' : 'Name *'}</label>
              <input required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                className="w-full rounded-xl px-4 py-2.5 text-[#0b1d4a] outline-none"
                style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}
                placeholder="Estructura" />
            </div>
            <div>
              <label className="block text-xl font-extrabold text-[#0b1d4a] mb-1">{es ? 'Tipo *' : 'Type *'}</label>
              <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value as TipoCapitulo })}
                className="w-full rounded-xl px-4 py-2.5 text-[#0b1d4a] outline-none"
                style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xl font-extrabold text-[#0b1d4a] mb-1">{es ? 'Orden' : 'Order'}</label>
              <input type="number" value={form.orden} onChange={e => setForm({ ...form, orden: Number(e.target.value) })}
                className="w-full rounded-xl px-4 py-2.5 text-[#0b1d4a] outline-none"
                style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}
                placeholder="1" />
            </div>
            <div>
              <label className="block text-xl font-extrabold text-[#0b1d4a] mb-1">{es ? 'Situación' : 'Status'}</label>
              <select value={form.situacion} onChange={e => setForm({ ...form, situacion: e.target.value })}
                className="w-full rounded-xl px-4 py-2.5 text-[#0b1d4a] outline-none"
                style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                {SITUACIONES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {/* País: bloqueado para usuarios de un país (el servidor lo sella); editable para GLOBAL */}
            <div>
              <label className="block text-xl font-extrabold text-[#0b1d4a] mb-1">{es ? 'País' : 'Country'}{usuarioGlobal && ' *'}</label>
              {usuarioGlobal ? (
                <select value={form.pais} onChange={e => setForm({ ...form, pais: e.target.value })}
                  className="w-full rounded-xl px-4 py-2.5 text-[#0b1d4a] outline-none"
                  style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                  {PAISES_ACTIVOS.map(p => <option key={p.codigo} value={p.codigo}>{p.bandera} {p.nombre}</option>)}
                </select>
              ) : (
                <input readOnly value={etiquetaPais(form.pais)} className="w-full rounded-xl px-4 py-2.5 font-bold outline-none cursor-not-allowed" style={{ background: '#f1f5f9', border: '1px solid #e5e7eb', color: '#0b1d4a' }} />
              )}
            </div>
            <div className="md:col-span-2 lg:col-span-3 flex gap-3 pt-2">
              <button type="submit" className="px-6 py-2 rounded-xl text-white font-medium" style={{ background: 'rgba(92,128,190,1)', border: '1px solid rgba(74,107,175,1)' }}>Guardar</button>
              <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-2 rounded-xl text-[#374151]" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Maestro: seleccionar Presupuesto de Oferta → despliega cabecera */}
      <div className="mb-6 rounded-2xl p-5" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-lg font-extrabold text-[#0b1d4a]">📈 Presupuesto de Oferta:</span>
          <select value={ofertaSel} onChange={e => setOfertaSel(e.target.value)}
            className="rounded-xl px-4 py-2.5 text-[#0b1d4a] font-bold outline-none min-w-[320px]"
            style={{ background: '#fff', border: '1px solid #93c5fd' }}>
            <option value="">— Todas las ofertas —</option>
            {ofertasDisponibles.map(c => {
              const cli = capitulos.find(x => x.oferta_consecutivo === c)?.cliente
              return <option key={c} value={c}>{c}{cli ? ` — ${cli}` : ''}</option>
            })}
          </select>
        </div>
        {cab && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {([
              ['Cliente', cab.cliente],
              ['Nro. Oferta GTM', cab.codigo_gtm],
              ['Fecha Registro', cab.fecha_registro],
              ['Responsable Técnico', cab.responsable_tecnico],
              ['Responsable Comercial', cab.comercial],
              ['Lugar de Ejecución', cab.lugar_ejecucion],
              ['Tipo Moneda', cab.moneda],
            ] as [string, string | undefined][]).map(([l, v]) => (
              <div key={l}><p className="text-xs uppercase tracking-wider text-[#6b7280]">{l}</p><p className="text-[#0b1d4a] font-bold mt-0.5 border rounded-md px-2.5 py-1.5" style={{ borderColor: '#e5e7eb' }}>{v || '—'}</p></div>
            ))}
            <div className="col-span-2 md:col-span-3 lg:col-span-4"><p className="text-xs uppercase tracking-wider text-[#6b7280]">Alcance del Proyecto</p><p className="text-sm text-[#374151] mt-0.5 border rounded-lg p-3" style={{ borderColor: '#e5e7eb', background: '#fafbfe' }}>{cab.alcance || '—'}</p></div>
          </div>
        )}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
        <div className="p-4 border-b flex flex-wrap items-center gap-3" style={{ borderColor: '#e5e7eb' }}>
          {ofertaSel && <span className="text-base font-extrabold text-[#0b1d4a]">🧱 Capítulos de {ofertaSel}</span>}
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="rounded-xl px-4 py-2 text-[#0b1d4a] outline-none text-base font-bold max-w-xs"
            style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}
            placeholder="Buscar por código o nombre..." />
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value as 'Todos' | TipoCapitulo)}
            className="rounded-xl px-4 py-2 text-[#0b1d4a] outline-none"
            style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
            <option value="Todos">Todos los tipos</option>
            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {usuarioGlobal && (
            <select value={filtroPais} onChange={e => setFiltroPais(e.target.value)}
              className="rounded-xl px-4 py-2 text-[#0b1d4a] outline-none"
              style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
              <option value="">🌎 Todos los países</option>
              {PAISES_ACTIVOS.map(p => <option key={p.codigo} value={p.codigo}>{p.bandera} {p.nombre}</option>)}
            </select>
          )}
          <span className="text-xs text-[#9ca3af]">{filtered.length} capítulos</span>
        </div>
        <table className="w-full text-base text-left">
          <thead style={{ background: '#1e3a8a' }}>
            <tr>
              {['Orden', 'Código', 'Nombre', 'Tipo', 'Situación', 'País', 'Creado Por', 'Acciones'].map(h => (
                <th key={h} className="px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,1)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map(r => {
              const esSub = r._depth > 0
              return (
              <tr key={r.id} style={{ borderTop: '1px solid #e5e7eb', background: esSub ? '#f8fafc' : '#ffffff' }}>
                <td className="px-6 py-4 text-[#111827]">{esSub ? '' : r.orden}</td>
                <td className="px-6 py-4 font-mono font-bold text-[#111827]" style={{ paddingLeft: esSub ? 40 : undefined }}>{esSub ? '↳ ' : ''}{r.codigo}</td>
                <td className="px-6 py-4 text-[#111827]">
                  {esSub && <span className="mr-2 px-2 py-0.5 rounded text-xs font-bold" style={{ background: '#e0e7ff', color: '#3730a3' }}>Sub</span>}
                  {r.nombre}
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 rounded-full text-xs font-medium" style={tipoStyle(r.tipo)}>{r.tipo}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 rounded-full text-xs font-medium" style={sitStyle(r.situacion)}>{r.situacion}</span>
                </td>
                <td className="px-6 py-4 text-[#111827] whitespace-nowrap">{etiquetaPais(r.pais)}</td>
                <td className="px-5 py-4"><CreadoPorCell r={r} /></td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setViewRecord(r)} className="px-3 py-1 rounded-lg text-xs font-medium" style={{ background: '#ea580c', color: '#fff', border: '1px solid #ea580c' }}>Ver</button>
                    {permisos.editar && !esSub && <button onClick={() => openNewSub(r)} className="px-3 py-1 rounded-lg text-xs font-bold" style={{ background: '#4338ca', color: '#fff', border: '1px solid #4338ca' }}>+ Sub</button>}
                    {permisos.editar && <button onClick={() => openEdit(r)} className="px-3 py-1 rounded-lg text-xs font-medium" style={{ background: '#15803d', color: '#fff', border: '1px solid #15803d' }}>Editar</button>}
                    {permisos.eliminar && <button onClick={() => handleDelete(r.id)} className="px-3 py-1 rounded-lg text-xs font-medium" style={{ background: '#dc2626', color: '#fff', border: '1px solid #dc2626' }}>Eliminar</button>}
                  </div>
                </td>
              </tr>
              )
            })}
            {filas.length === 0 && (
              <tr><td colSpan={8} className="px-6 py-12 text-center" style={{ color: '#111827' }}>No hay capítulos registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {viewRecord && (
        <ViewRecordModal
          title={`Capítulo ${viewRecord.codigo}`}
          fields={[
            { label: 'Nro. Consecutivo Oferta', value: viewRecord.oferta_consecutivo || '—' },
            { label: 'Fecha Registro', value: viewRecord.fecha_registro || '—' },
            { label: 'Nro. Oferta GTM', value: viewRecord.codigo_gtm || '—' },
            { label: 'Cliente', value: viewRecord.cliente || '—' },
            { label: 'Responsable Técnico', value: viewRecord.responsable_tecnico || '—' },
            { label: 'Responsable Comercial', value: viewRecord.comercial || '—' },
            { label: 'Lugar de Ejecución', value: viewRecord.lugar_ejecucion || '—' },
            { label: 'Tipo Moneda', value: viewRecord.moneda || '—' },
            { label: 'Alcance del Proyecto', value: viewRecord.alcance || '—' },
            { label: 'Nivel', value: viewRecord.capitulo_padre_id ? 'Subcapítulo' : 'Capítulo' },
            { label: 'Subcapítulo de', value: viewRecord.capitulo_padre_id ? (capitulos.find(c => c.id === viewRecord.capitulo_padre_id)?.codigo || '—') : '—' },
            { label: 'Código', value: viewRecord.codigo },
            { label: 'Nombre', value: viewRecord.nombre },
            { label: 'Tipo', value: viewRecord.tipo },
            { label: 'Orden', value: String(viewRecord.orden) },
            { label: 'Situación', value: viewRecord.situacion },
            { label: 'País', value: etiquetaPais(viewRecord.pais) },
          ]}
          onClose={() => setViewRecord(null)}
        />
      )}
    </div>
  )
}
