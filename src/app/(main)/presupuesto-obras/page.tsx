'use client'

import { useState, useEffect, useRef, Fragment } from 'react'
import { PRESUPUESTO_CSS } from '@/shared/lib/presupuesto-css'
import { useOfertasStore } from '@/features/ofertas/store/ofertas-store'
import { type Oferta, type RenglonOferta, TIPOS_RENGLON, tipoConcepto, esDetalle, origenDeConcepto, precioUnit, costoTotal, montoVenta, nextOfertaConsecutivo } from '@/features/ofertas/types'
import { useReferenceStore } from '@/features/referencias/store/reference-store'
import { usePersonalEmpresaStore } from '@/features/personal-empresa/store/personal-empresa-store'
import { useClientesStore } from '@/features/clientes/store/clientes-store'
import { useCargosSalariosStore } from '@/features/cargos-salarios/store/cargos-salarios-store'
import { costoDiaCargado as costoDiaCargo } from '@/features/cargos-salarios/types'
import { useProductosStore } from '@/features/productos/store/productos-store'
import { useCotizacionesSubStore } from '@/features/cotizaciones-subcontratistas/store/cotizaciones-subcontratistas-store'
import { useMaquinariasStore } from '@/features/maquinarias-equipos/store/maquinarias-equipos-store'
import { CreadoPorCell } from '@/shared/components/creado-por-cell'
import { useCurrentUserStore } from '@/features/usuarios-gestion/store/current-user-store'
import { PAISES_ACTIVOS, esGlobal, etiquetaPais, simboloMoneda, monedaDePais } from '@/shared/lib/paises'

const inputSt: React.CSSProperties = { background: '#ffffff', border: '1px solid #e5e7eb', color: '#0b1d4a' }
const fmtMonto = (n: number) => (n || n === 0) ? Number(n).toLocaleString('en-US') : ''
const parseMonto = (s: string) => Number(String(s).replace(/[^\d.]/g, '')) || 0
// Símbolo de moneda ACTIVO (se fija por país de la oferta en cada render). Cada país su moneda.
let SIM_MONEDA = 'S/'
const money = (n: number) => SIM_MONEDA + ' ' + Math.round(n || 0).toLocaleString('en-US')
const fDate = (iso: string) => { if (!iso) return '—'; const [y, m, d] = iso.split('-'); return d && m && y ? `${d}/${m}/${y}` : iso }
const hoy = () => new Date().toISOString().slice(0, 10)

const conceptoColor: Record<string, string> = {
  'MOD': '#ea580c', 'MOI': '#0369a1', 'Materiales': '#7c3aed',
  'Maquinaria y Vehículos': '#16a34a', 'Subcontrato': '#a16207', 'Otro': '#6b7280',
}
const conceptoStyle = (c: string): React.CSSProperties => ({ background: conceptoColor[c] || '#6b7280', color: '#fff' })
const CONCEPTOS_ORDEN = ['MOD', 'MOI', 'Materiales', 'Maquinaria y Vehículos', 'Subcontrato', 'Otro'] as const
const conceptoCorto: Record<string, string> = { 'MOD': 'MOD', 'MOI': 'MOI', 'Materiales': 'Materiales', 'Maquinaria y Vehículos': 'Maquinaria', 'Subcontrato': 'Subcontr.', 'Otro': 'Otro' }
// Orden de los detalles dentro de un título: T2 primero, luego D1, D2, D3…
const ORDEN_TIPO: Record<string, number> = { T2: 0, D1: 1, D2: 2, D3: 3, D4: 4, D5: 5, D6: 6 }
// Migración: renglones viejos con tipo "D" → D1..D6 según su concepto
const CONCEPTO_TIPO: Record<string, string> = { 'MOD': 'D1', 'MOI': 'D2', 'Materiales': 'D3', 'Maquinaria y Vehículos': 'D4', 'Subcontrato': 'D5', 'Otro': 'D6' }
const migrarRenglon = (r: RenglonOferta): RenglonOferta =>
  (r.tipo === 'T1' || r.tipo === 'T2' || /^D[1-6]$/.test(r.tipo || '')) ? r : { ...r, tipo: CONCEPTO_TIPO[r.concepto] || 'D6' }
// Filtra a "toda la oferta" o solo el bloque de un Título (T1 + sus renglones hasta el próximo T1)
const filtrarPorVista = (rens: RenglonOferta[], vistaId: string): RenglonOferta[] => {
  if (vistaId === 'todo') return rens
  const idx = rens.findIndex(r => r.id === vistaId)
  if (idx < 0) return rens
  const out = [rens[idx]]
  for (let i = idx + 1; i < rens.length; i++) { if (rens[i].tipo === 'T1') break; out.push(rens[i]) }
  return out
}
const sitStyle = (s: string): React.CSSProperties => {
  if (s === 'Ganada') return { background: '#15803d', color: '#fff' }
  if (s === 'Enviada') return { background: '#1e3a8a', color: '#fff' }
  if (s === 'Perdida') return { background: '#dc2626', color: '#fff' }
  return { background: '#6b7280', color: '#fff' }
}

const nuevoRenglon = (tipo = 'D1'): RenglonOferta => ({ id: crypto.randomUUID(), tipo, codigo: '', concepto: tipoConcepto[tipo] || '', ref_id: '', descripcion: '', unidad: '', cantidad: 0, costo_unitario: 0, margen: 0 })
const initForm = (consec: string, pais = ''): Oferta => ({
  id: '', nro: 0, consecutivo: consec, proyecto: '', fecha_emision: hoy(),
  cliente: '', comercial: '', responsable_tecnico: '', codigo_gtm: '', unidad_negocio: '', lugar_ejecucion: '',
  moneda: pais ? monedaDePais(pais).nombre : '', margen_general: 0, pct_impuesto: 0, alcance: '', observaciones: '', pais, renglones: [nuevoRenglon()], situacion: 'Borrador',
})

export default function OfertasClientesPage() {
  const { ofertas, addOferta, updateOferta, deleteOferta, loadOfertas } = useOfertasStore()
  const currentUser = useCurrentUserStore(s => s.user)
  const paisUsuario = currentUser?.pais || ''
  const usuarioGlobal = esGlobal(paisUsuario)
  const refData = useReferenceStore(s => s.data)
  const personalActivo = usePersonalEmpresaStore(s => s.personal).filter(p => p.situacion === 'Activo')
  const clientesLista = useClientesStore(s => s.clientes).filter(c => c.situacion === 'Activo').slice().sort((a, b) => (a.razon_social || '').localeCompare(b.razon_social || '', 'es'))
  const ciudadesRef = (refData.ciudad ?? []).filter(c => c.situacion).slice().sort((a, b) => a.descripcion.localeCompare(b.descripcion, 'es'))
  const cargos = useCargosSalariosStore(s => s.cargos)
  const maquinarias = useMaquinariasStore(s => s.maquinarias)
  const productos = useProductosStore(s => s.productos)
  const cotizaciones = useCotizacionesSubStore(s => s.cotizaciones)

  const [form, setForm] = useState<Oferta>(initForm(nextOfertaConsecutivo([])))
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [search, setSearch] = useState('')
  const [filtroPais, setFiltroPais] = useState('')  // solo lo usan usuarios GLOBAL
  const [viewItem, setViewItem] = useState<Oferta | null>(null)
  const [vista, setVista] = useState<string>('todo')  // 'todo' o el id de un Título para enfocar
  // Editor de Porcentaje de Utilidad (en la vista): general o por capítulo
  const [showUtil, setShowUtil] = useState(false)
  const [utilPct, setUtilPct] = useState<number>(0)
  const [utilScope, setUtilScope] = useState<string>('general')  // 'general' o id de un Título (capítulo)
  const [utilMsg, setUtilMsg] = useState<string>('')
  // Mostrar desglose de Costos / Ventas / Utilidad en la totalización (No = solo total de la oferta)
  const [verDesglose, setVerDesglose] = useState(false)
  const draftIdRef = useRef('')  // id del borrador que se está auto-guardando

  // Símbolo de moneda según el país de la oferta en foco (Ver → viewItem, Editar/Nuevo → form, si no → país del usuario).
  SIM_MONEDA = simboloMoneda(viewItem?.pais || form?.pais || paisUsuario)

  // Carga las ofertas del servidor al montar (sin esto la lista sale vacía).
  useEffect(() => { loadOfertas() }, [loadOfertas])

  // ── Auto-guardado (borrador): graba solo ~0.8s después de cada cambio ──
  useEffect(() => {
    if (!isFormOpen) return
    const hayContenido = form.cliente || form.proyecto ||
      form.renglones.some(r => r.descripcion.trim() || r.costo_unitario > 0)
    if (!hayContenido) return
    const t = setTimeout(() => {
      const snap = { ...form, monto_calculado: total(form) }   // Monto Calculado siempre sincronizado
      if (form.id) {
        updateOferta(form.id, snap)
      } else if (draftIdRef.current) {
        updateOferta(draftIdRef.current, { ...snap, id: draftIdRef.current })
      } else {
        const id = crypto.randomUUID()
        const nro = useOfertasStore.getState().ofertas.reduce((m, r) => Math.max(m, r.nro || 0), 0) + 1
        draftIdRef.current = id
        addOferta({ ...snap, id, nro })
        setForm(f => ({ ...f, id, nro }))
      }
    }, 800)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, isFormOpen])

  // Recursos disponibles según el concepto del renglón
  type Recurso = { id: string; label: string; codigo: string; descripcion: string; unidad: string; costo: number }
  const recursosDe = (concepto: string): Recurso[] => {
    const origen = origenDeConcepto(concepto)
    if (origen === 'personal') {
      // MOD → Cargos tipo Directa · MOI → Cargos tipo Indirecta. Costo = Salario Día recargado (Costo Día cargado)
      const tipo = concepto === 'MOD' ? 'Directa' : 'Indirecta'
      return cargos.filter(c => c.situacion === 'Activo' && c.tipo_mo === tipo).map(c => {
        const cd = costoDiaCargo(c.salario_dia, c.pct_prestaciones)
        return { id: c.id, label: `${c.consecutivo} · ${c.descripcion} · Día S/${cd.toLocaleString('en-US')}${cd === 0 ? ' ⚠ sin salario' : ''}`, codigo: c.consecutivo, descripcion: c.descripcion, unidad: 'día', costo: cd }
      })
    }
    if (origen === 'producto') return productos.map(p => ({ id: p.id, label: `${p.codigo} — ${p.descripcion}`, codigo: p.codigo, descripcion: p.descripcion, unidad: p.unidad_medida || '', costo: p.costo_promedio || p.ult_costo || 0 }))
    if (origen === 'cotizacion') {
      const out: Recurso[] = []
      cotizaciones.forEach(c => (c.renglones || []).forEach(r => out.push({ id: `${c.id}::${r.id}`, label: `${c.consecutivo} · ${r.descripcion || '(sin desc.)'}`, codigo: c.consecutivo, descripcion: `${r.descripcion} — ${c.subcontratista}`, unidad: r.unidad || '', costo: r.cantidad > 0 ? (r.subtotal / r.cantidad) : (r.subtotal || 0) })))
      return out
    }
    if (origen === 'maquinaria') {
      // Maquinaria y Vehículos → catálogo de Maquinarias. Costo = Valor Día (editable a hora/semana/mes)
      return maquinarias.filter(m => m.situacion === 'Activo').map(m => ({ id: m.id, label: `${m.consecutivo} · ${m.descripcion} · Día S/${(m.vr_dia || 0).toLocaleString('en-US')}`, codigo: m.consecutivo, descripcion: m.descripcion, unidad: 'día', costo: m.vr_dia || 0 }))
    }
    return []
  }

  // Todos los cambios se hacen por ID del renglón (no por posición) para que el orden visual no los cruce.
  const setRenglon = (id: string, patch: Partial<RenglonOferta>) =>
    setForm(f => ({ ...f, renglones: f.renglones.map(r => r.id === id ? { ...r, ...patch } : r) }))

  // Editar el PRECIO DE VENTA directo: recalcula el % de utilidad (margen) contra el costo.
  const setPrecioVenta = (id: string, precio: number) =>
    setForm(f => ({ ...f, renglones: f.renglones.map(r => {
      if (r.id !== id) return r
      const p = precio || 0
      if ((r.costo_unitario || 0) > 0) return { ...r, margen: Math.round((p / r.costo_unitario - 1) * 10000) / 100 }
      return { ...r, costo_unitario: p, margen: 0 }   // sin costo aún: el precio pasa a ser el costo base
    }) }))
  const addRenglon = (tipo = 'D1') => setForm(f => {
    const nr = nuevoRenglon(tipo)
    if (esDetalle(nr.tipo)) nr.margen = f.margen_general || 0   // hereda el margen de la oferta
    return { ...f, renglones: [...f.renglones, nr] }
  })
  // Margen % de la oferta → se aplica a TODOS los renglones de detalle
  const setMargenGeneral = (pct: number) => setForm(f => ({ ...f, margen_general: pct, renglones: f.renglones.map(r => esDetalle(r.tipo) ? { ...r, margen: pct } : r) }))
  const removeRenglon = (id: string) => setForm(f => {
    const rest = f.renglones.filter(r => r.id !== id)
    return { ...f, renglones: rest.length ? rest : [nuevoRenglon()] }  // nunca queda vacío
  })

  // Orden de conceptos dentro de un capítulo (para auto-agrupar los renglones).
  const ordenConcepto = (c: string) => { const i = (CONCEPTOS_ORDEN as readonly string[]).indexOf(c); return i < 0 ? 99 : i }

  // Reubica el renglón `id` al FINAL de su mismo concepto (MOD/MOI/Materiales/…)
  // dentro de SU capítulo. Así cada renglón queda agrupado con los de su tipo.
  const acomodarRenglon = (renglones: RenglonOferta[], id: string): RenglonOferta[] => {
    const target = renglones.find(r => r.id === id)
    if (!target || !esDetalle(target.tipo)) return renglones
    const origIdx = renglones.findIndex(r => r.id === id)
    // Título (T1) del bloque al que pertenece
    let tituloId: string | null = null
    for (let i = origIdx; i >= 0; i--) { if (renglones[i].tipo === 'T1') { tituloId = renglones[i].id; break } }
    const list = renglones.filter(r => r.id !== id)
    const startL = tituloId ? list.findIndex(r => r.id === tituloId) : -1
    const blockStart = startL + 1
    let blockEnd = list.length
    for (let i = blockStart; i < list.length; i++) { if (list[i].tipo === 'T1') { blockEnd = i; break } }
    // Punto de inserción: tras subtítulos iniciales y tras el último detalle de orden <= al del target
    let insertAt = blockStart
    while (insertAt < blockEnd && list[insertAt] && list[insertAt].tipo === 'T2') insertAt++
    const to = ordenConcepto(target.concepto)
    for (let i = blockStart; i < blockEnd; i++) {
      const r = list[i]
      if (esDetalle(r.tipo) && ordenConcepto(r.concepto) <= to) insertAt = i + 1
    }
    const copy = [...list]
    copy.splice(insertAt, 0, target)
    return copy
  }

  // Inserta un renglón de Detalle dentro de un capítulo (Título T1) y lo auto-acomoda por tipo.
  const insertEnCapitulo = (tituloId: string, tipo = 'D1') => setForm(f => {
    const nr = nuevoRenglon(tipo)
    if (esDetalle(nr.tipo)) nr.margen = f.margen_general || 0
    const idx = f.renglones.findIndex(r => r.id === tituloId)
    const copy = [...f.renglones]
    if (idx < 0) { copy.push(nr) } else {
      let end = f.renglones.length
      for (let i = idx + 1; i < f.renglones.length; i++) { if (f.renglones[i].tipo === 'T1') { end = i; break } }
      copy.splice(end, 0, nr)
    }
    return { ...f, renglones: acomodarRenglon(copy, nr.id) }
  })

  const seleccionarRecurso = (id: string, refId: string, concepto: string) => {
    const rec = recursosDe(concepto).find(x => x.id === refId)
    if (!rec) { setRenglon(id, { ref_id: '' }); return }
    // NO se toca el código (Nro Item). Solo se traen descripción, unidad y costo.
    setRenglon(id, { ref_id: refId, descripcion: rec.descripcion, unidad: rec.unidad, costo_unitario: rec.costo })
  }

  // Cambiar el Tipo. Deriva el concepto y limpia el recurso (conserva Nro Item). El orden es visual.
  const cambiarTipo = (id: string, tipo: string) => setForm(f => {
    const renglones = f.renglones.map(r => r.id === id
      ? (esDetalle(tipo)
        ? { ...r, tipo, concepto: tipoConcepto[tipo] || 'Otro', ref_id: '', descripcion: '', unidad: '', costo_unitario: 0 }
        : { ...r, tipo, concepto: '' })
      : r)
    // Al elegir un tipo de Detalle, el renglón se acomoda al final de su mismo tipo dentro del capítulo.
    return { ...f, renglones: esDetalle(tipo) ? acomodarRenglon(renglones, id) : renglones }
  })

  // Agrupa los renglones por Título (T1). Cada grupo: { titulo, rows[] }
  const agruparPorTitulo = (rens: RenglonOferta[]) => {
    const groups: { titulo: RenglonOferta | null; rows: RenglonOferta[] }[] = []
    let g: { titulo: RenglonOferta | null; rows: RenglonOferta[] } | null = null
    rens.forEach(r => {
      if (r.tipo === 'T1') { if (g) groups.push(g); g = { titulo: r, rows: [] } }
      else { if (!g) g = { titulo: null, rows: [] }; g.rows.push(r) }
    })
    if (g) groups.push(g)
    return groups
  }

  // Ordena SIEMPRE por Tipo dentro de cada título (T2 → D1 → D2 → D3…), sin recodificar
  const ordenarSoloTipo = (rens: RenglonOferta[]): RenglonOferta[] => {
    const out: RenglonOferta[] = []
    agruparPorTitulo(rens).forEach(grp => {
      if (grp.titulo) out.push(grp.titulo)
      out.push(...[...grp.rows].sort((a, b) => (ORDEN_TIPO[a.tipo] ?? 99) - (ORDEN_TIPO[b.tipo] ?? 99)))
    })
    return out
  }

  // Subtotal por Título (desglosado por concepto, igual que los totales generales pero parcial).
  // Se ancla al último renglón del bloque.
  const subtotalesPorTitulo = (rens: RenglonOferta[]) => {
    const map: Record<string, { costo: number; venta: number; titulo: string; porConcepto: Record<string, { costo: number; venta: number }> }> = {}
    agruparPorTitulo(rens).forEach(grp => {
      if (!grp.titulo) return
      const dets = grp.rows.filter(r => esDetalle(r.tipo))
      const porConcepto: Record<string, { costo: number; venta: number }> = {}
      dets.forEach(r => {
        const k = r.concepto || 'Otro'
        if (!porConcepto[k]) porConcepto[k] = { costo: 0, venta: 0 }
        porConcepto[k].costo += costoTotal(r); porConcepto[k].venta += montoVenta(r)
      })
      const venta = dets.reduce((s, r) => s + montoVenta(r), 0)
      const costo = dets.reduce((s, r) => s + costoTotal(r), 0)
      const anchor = grp.rows.length ? grp.rows[grp.rows.length - 1] : grp.titulo
      map[anchor.id] = { costo, venta, titulo: grp.titulo.descripcion || grp.titulo.codigo || 'Título', porConcepto }
    })
    return map
  }

  // Detecta recursos repetidos (mismo ref_id) dentro de un mismo título
  const duplicadosEnRenglones = (rens: RenglonOferta[]): string[] => {
    const msgs: string[] = []
    agruparPorTitulo(rens).forEach(grp => {
      const seen = new Set<string>()
      grp.rows.forEach(row => {
        if (esDetalle(row.tipo) && row.ref_id) {
          if (seen.has(row.ref_id)) msgs.push(`"${row.descripcion || row.codigo}" en «${grp.titulo?.descripcion || 'sin título'}»`)
          else seen.add(row.ref_id)
        }
      })
    })
    return msgs
  }

  // Reordena por D1→D2→D3… dentro de cada título y recodifica el Nro Item
  const reordenarRecodificar = () => {
    const migradas = form.renglones.map(r => migrarRenglon({ ...r }))  // convierte "D" viejos a D1..D6
    const out: RenglonOferta[] = []
    let t = 0
    agruparPorTitulo(migradas).forEach(grp => {
      const rows = [...grp.rows].sort((a, b) => (ORDEN_TIPO[a.tipo] ?? 99) - (ORDEN_TIPO[b.tipo] ?? 99))  // D1 < D2 < D3 …
      if (grp.titulo) { t++; out.push({ ...grp.titulo, codigo: String(t) }) }
      let s = 0
      rows.forEach(row => { s++; out.push({ ...row, codigo: grp.titulo ? `${t}.${String(s).padStart(2, '0')}` : String(s).padStart(2, '0') }) })
    })
    const dups = duplicadosEnRenglones(out)
    setForm(f => ({ ...f, renglones: out }))
    setFormError(dups.length ? `⚠ Recursos repetidos en un mismo título: ${dups.join(' · ')}` : '')
  }

  // Totales (solo renglones de Detalle D1..D6; los T1/T2 son títulos)
  const soloD = (o: Oferta) => o.renglones.filter(r => esDetalle(r.tipo))
  const subtotal = (o: Oferta) => soloD(o).reduce((s, r) => s + montoVenta(r), 0)
  const impuesto = (o: Oferta) => subtotal(o) * (o.pct_impuesto || 0) / 100
  const total = (o: Oferta) => subtotal(o) + impuesto(o)
  const costoDirecto = (o: Oferta) => soloD(o).reduce((s, r) => s + costoTotal(r), 0)
  // % margen efectivo = (Venta − Costo) / Costo × 100 (redondeado a 2 decimales)
  const pctMargen = (costo: number, venta: number) => costo > 0 ? (Math.round(((venta - costo) / costo) * 10000) / 100).toLocaleString('en-US') : '0'
  const totalesPorConcepto = (o: Oferta) => {
    const map: Record<string, { costo: number; venta: number }> = {}
    soloD(o).forEach(r => {
      const k = r.concepto || 'Otro'
      if (!map[k]) map[k] = { costo: 0, venta: 0 }
      map[k].costo += costoTotal(r); map[k].venta += montoVenta(r)
    })
    return map
  }

  // Cuadro resumen vertical por concepto: Costo · Utilidad · % frente al total + totalización y % Utilidad Final
  const labelResumen: Record<string, string> = { MOD: 'MOD', MOI: 'MOI', Materiales: 'Materiales', 'Maquinaria y Vehículos': 'Equipos', Subcontrato: 'Subcontratistas', Otro: 'Otro' }
  const resumenVertical = (o: Oferta) => {
    const tc = totalesPorConcepto(o)
    const rows = CONCEPTOS_ORDEN.filter(c => tc[c]).map(c => {
      const costo = tc[c].costo, venta = tc[c].venta
      return { c, costo, venta, utilidad: venta - costo }
    })
    if (!rows.length) return null
    const totCosto = rows.reduce((s, r) => s + r.costo, 0)
    const totVenta = rows.reduce((s, r) => s + r.venta, 0)
    const totUtil = rows.reduce((s, r) => s + r.utilidad, 0)
    return (
      <div className="rounded-xl overflow-x-auto" style={{ border: '2px solid #1e3a8a' }}>
        <div className="px-3 py-2 font-extrabold text-white" style={{ background: '#1e3a8a' }}>📊 Cuadro Resumen · Costos, Ventas y Utilidad por Concepto</div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: '#dbe4fb' }}>
              <th className="px-3 py-2 text-left font-extrabold text-[#0b1d4a]">Concepto</th>
              <th className="px-3 py-2 text-right font-extrabold text-[#0b1d4a]">Costo</th>
              <th className="px-3 py-2 text-right font-extrabold text-[#0b1d4a]">Ventas</th>
              <th className="px-3 py-2 text-right font-extrabold text-[#0b1d4a]">Monto Utilidad</th>
              <th className="px-3 py-2 text-right font-extrabold text-[#0b1d4a]">% Utilidad s/Total Oferta</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.c} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td className="px-3 py-2"><span className="po-concepto px-2 py-0.5 rounded text-xs font-bold" style={conceptoStyle(r.c)}>{labelResumen[r.c] || r.c}</span></td>
                <td className="px-3 py-2 text-right font-bold text-[#111827]">{money(r.costo)}</td>
                <td className="px-3 py-2 text-right font-bold text-[#0b1d4a]">{money(r.venta)}</td>
                <td className="px-3 py-2 text-right font-bold" style={{ color: '#15803d' }}>{money(r.utilidad)}</td>
                <td className="px-3 py-2 text-right font-bold text-[#000000]">{totUtil > 0 ? (Math.round((r.utilidad / totUtil) * 1000) / 10).toLocaleString('en-US') : '0'}%</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#eef3ff', borderTop: '2px solid #1e3a8a' }}>
              <td className="px-3 py-2 font-extrabold text-[#0b1d4a]">TOTALES</td>
              <td className="px-3 py-2 text-right font-extrabold text-[#0b1d4a]">{money(totCosto)}</td>
              <td className="px-3 py-2 text-right font-extrabold text-[#0b1d4a]">{money(totVenta)}</td>
              <td className="px-3 py-2 text-right font-extrabold" style={{ color: '#15803d' }}>{money(totUtil)}</td>
              <td className="px-3 py-2 text-right font-extrabold text-[#0b1d4a]">100%</td>
            </tr>
            <tr style={{ background: '#fff7ed', borderTop: '2px solid #b45309' }}>
              <td colSpan={4} className="px-3 py-2 text-right font-extrabold text-[#000000]">% UTILIDAD FINAL DE LA OFERTA · Costo {money(totCosto)} → Venta {money(totVenta)} · Utilidad {money(totUtil)}</td>
              <td className="px-3 py-2 text-right font-extrabold text-[#000000]" style={{ background: '#fdba74' }}>{pctMargen(totCosto, totVenta)}%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    )
  }

  const abrirNuevo = () => { draftIdRef.current = ''; setVista('todo'); setForm(initForm(nextOfertaConsecutivo(ofertas), usuarioGlobal ? (PAISES_ACTIVOS[0]?.codigo || 'Perú') : paisUsuario)); setFormError(''); setIsFormOpen(true) }
  const abrirEditar = (o: Oferta) => { draftIdRef.current = ''; setVista('todo'); setForm({ ...o, renglones: ordenarSoloTipo(o.renglones.map(r => migrarRenglon({ ...r }))) }); setFormError(''); setIsFormOpen(true) }
  const abrirVer = (o: Oferta) => {
    // Abre el presupuesto directo (igual que en Operaciones/Borinquen). SIN window.confirm,
    // que bloqueaba el hilo y hacía parecer que "no traía datos".
    setVista('todo'); setViewItem(o)
    setUtilPct(o.margen_general || 0); setUtilScope('general'); setUtilMsg(''); setShowUtil(false)
  }

  // Ids de los renglones de DETALLE que pertenecen al bloque de un capítulo (Título T1)
  const detallesDeCapitulo = (rens: RenglonOferta[], tituloId: string): Set<string> => {
    const ids = new Set<string>()
    const idx = rens.findIndex(r => r.id === tituloId)
    if (idx < 0) return ids
    for (let i = idx + 1; i < rens.length; i++) { if (rens[i].tipo === 'T1') break; if (esDetalle(rens[i].tipo)) ids.add(rens[i].id) }
    return ids
  }

  // Aplica el Porcentaje de Utilidad (margen) — general o por capítulo — y persiste
  const aplicarUtilidad = () => {
    if (!viewItem) return
    const pct = utilPct || 0
    let renglones: RenglonOferta[]
    let ambito: string
    if (utilScope === 'general') {
      renglones = viewItem.renglones.map(r => esDetalle(r.tipo) ? { ...r, margen: pct } : r)
      ambito = 'todo el presupuesto'
    } else {
      const ids = detallesDeCapitulo(viewItem.renglones, utilScope)
      renglones = viewItem.renglones.map(r => ids.has(r.id) ? { ...r, margen: pct } : r)
      const cap = viewItem.renglones.find(r => r.id === utilScope)
      ambito = `capítulo «${cap?.descripcion || cap?.codigo || ''}» (${ids.size} renglones)`
    }
    const ofertaAct = { ...viewItem, renglones }
    const montoCalc = total(ofertaAct)
    const patch = utilScope === 'general' ? { renglones, margen_general: pct, monto_calculado: montoCalc } : { renglones, monto_calculado: montoCalc }
    updateOferta(viewItem.id, patch)
    setViewItem({ ...viewItem, ...patch })
    setUtilMsg(`✓ ${pct}% de utilidad aplicado a ${ambito}.`)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!form.cliente || !form.cliente.trim()) { setFormError('Ingrese el Cliente de la oferta.'); return }
    const limpio = { ...form, proyecto: form.cliente, monto_calculado: total(form), renglones: ordenarSoloTipo(form.renglones.filter(r => r.descripcion.trim() || r.costo_unitario > 0 || r.tipo === 'T1' || r.tipo === 'T2')) }
    if (limpio.renglones.length === 0) { setFormError('Agregue al menos un renglón.'); return }
    const dups = duplicadosEnRenglones(limpio.renglones)
    if (dups.length) { setFormError(`No se puede repetir el mismo recurso dentro de un título: ${dups.join(' · ')}`); return }
    if (form.id) updateOferta(form.id, limpio)
    else addOferta({ ...limpio, id: crypto.randomUUID(), nro: (ofertas.reduce((m, r) => Math.max(m, r.nro || 0), 0)) + 1 })
    setIsFormOpen(false)
  }
  const handleDelete = (id: string) => { if (confirm('¿Eliminar este proyecto y su presupuesto?')) deleteOferta(id) }

  const baseOfertas = (usuarioGlobal && filtroPais) ? ofertas.filter(o => o.pais === filtroPais) : ofertas
  const filtered = baseOfertas.filter(o => `${o.consecutivo} ${o.cliente || ''} ${o.proyecto} ${o.codigo_gtm || ''}`.toLowerCase().includes(search.toLowerCase()))
  // Oferta según la vista: si hay un título enfocado, los totales reflejan SOLO ese título
  const ofertaVisible: Oferta = { ...form, renglones: filtrarPorVista(form.renglones, vista) }
  const tituloVisible = vista !== 'todo' ? (form.renglones.find(r => r.id === vista)?.descripcion || 'título') : ''
  const verVisible: Oferta | null = viewItem ? { ...viewItem, renglones: filtrarPorVista(ordenarSoloTipo(viewItem.renglones), vista) } : null
  const tituloVisibleVer = vista !== 'todo' && viewItem ? (viewItem.renglones.find(r => r.id === vista)?.descripcion || 'título') : ''

  return (
    <div className="po-root space-y-6">
      {/* Fuerza el texto BLANCO en los chips/selects de concepto (MOD/MOI/Materiales/Maquinaria/Subcontrato),
          que el CSS global del CRM tiende a oscurecer. Se targetea por su color de fondo. */}
      <style dangerouslySetInnerHTML={{ __html: PRESUPUESTO_CSS }} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0b1d4a]">Presupuesto Ofertas</h1>
          <p className="text-[#6b7280] text-sm mt-1">Motor de APU: cada renglón jala su recurso del maestro (Personal · Productos · Subcontratos · Maquinaria).</p>
        </div>
        <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ background: 'rgba(122,152,198,1)', color: '#fff' }}>{ofertas.length} ofertas</span>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={abrirNuevo} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #2d3f66, #5c80be)' }}>+ Nueva Oferta</button>
        <input type="text" placeholder="Buscar por consecutivo o proyecto…" value={search} onChange={e => setSearch(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl text-sm text-[#0b1d4a] outline-none" style={inputSt} />
        {usuarioGlobal && (
          <select value={filtroPais} onChange={e => setFiltroPais(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm outline-none" style={inputSt}>
            <option value="">🌎 Todos los países</option>
            {PAISES_ACTIVOS.map(p => <option key={p.codigo} value={p.codigo}>{p.bandera} {p.nombre}</option>)}
          </select>
        )}
      </div>

      {isFormOpen && (
        <form onSubmit={handleSave} className="bg-black/20 p-6 rounded-2xl border border-white/10 space-y-4 shadow-inner">
          {formError && <div className="text-sm font-semibold px-4 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,1)', color: '#fff' }}>{formError}</div>}
          <h3 className="text-xl font-extrabold text-[#0b1d4a]">{form.id ? 'Editar' : 'Nueva'} Oferta · <span className="font-mono">{form.consecutivo}</span></h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xl font-extrabold text-[#0b1d4a] mb-1">Código GTM Oferta</label>
              <input value={form.codigo_gtm || ''} onChange={e => setForm({ ...form, codigo_gtm: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-lg text-[#0b1d4a] outline-none" style={inputSt} placeholder="GTM-OF-0001" />
            </div>
            <div>
              <label className="block text-xl font-extrabold text-[#0b1d4a] mb-1">Cliente *</label>
              <select required value={form.cliente || ''} onChange={e => setForm({ ...form, cliente: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-lg outline-none" style={inputSt}>
                <option value="">Seleccione Cliente…</option>
                {clientesLista.map(cl => <option key={cl.id} value={cl.razon_social}>{cl.razon_social}{cl.ciudad ? ` — ${cl.ciudad}` : ''}</option>)}
              </select>
            </div>
            {/* País: bloqueado para usuarios de un país (el servidor lo sella); editable para GLOBAL */}
            <div>
              <label className="block text-xl font-extrabold text-[#0b1d4a] mb-1">País{usuarioGlobal ? ' *' : ''}</label>
              {usuarioGlobal ? (
                <select value={form.pais || ''} onChange={e => { const p = e.target.value; setForm({ ...form, pais: p, moneda: monedaDePais(p).nombre }) }} className="w-full px-3 py-2.5 rounded-lg text-lg outline-none" style={inputSt}>
                  {PAISES_ACTIVOS.map(p => <option key={p.codigo} value={p.codigo}>{p.bandera} {p.nombre}</option>)}
                </select>
              ) : (
                <div className="w-full px-3 py-2.5 rounded-lg text-lg" style={{ background: '#f1f5f9', border: '1px solid #e5e7eb', color: '#64748b' }}>{etiquetaPais(form.pais)}</div>
              )}
            </div>
            <div>
              <label className="block text-xl font-extrabold text-[#0b1d4a] mb-1">Fecha Comienzo Elaboración</label>
              <input type="date" value={form.fecha_emision} onChange={e => setForm({ ...form, fecha_emision: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-lg text-[#0b1d4a] outline-none" style={inputSt} />
            </div>
            <div>
              <label className="block text-xl font-extrabold text-[#0b1d4a] mb-1">Comercial Oferta</label>
              <select value={form.comercial || ''} onChange={e => setForm({ ...form, comercial: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-lg outline-none" style={inputSt}>
                <option value="">Seleccione de Personal…</option>
                {personalActivo.map(p => { const n = `${p.nombre} ${p.apellido || ''}`.trim(); return <option key={p.id} value={n}>{n}{p.cargo ? ` — ${p.cargo}` : ''}</option> })}
              </select>
            </div>
            <div>
              <label className="block text-xl font-extrabold text-[#0b1d4a] mb-1">Responsable Técnico Oferta</label>
              <select value={form.responsable_tecnico || ''} onChange={e => setForm({ ...form, responsable_tecnico: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-lg outline-none" style={inputSt}>
                <option value="">Seleccione de Personal…</option>
                {personalActivo.map(p => { const n = `${p.nombre} ${p.apellido || ''}`.trim(); return <option key={p.id} value={n}>{n}{p.cargo ? ` — ${p.cargo}` : ''}</option> })}
              </select>
            </div>
            <div>
              <label className="block text-xl font-extrabold text-[#0b1d4a] mb-1">Unidad de Negocio</label>
              <select value={form.unidad_negocio || ''} onChange={e => setForm({ ...form, unidad_negocio: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-lg outline-none" style={inputSt}>
                <option value="">Seleccione…</option>
                {(refData.unidad_negocio ?? []).filter(u => u.situacion).map(u => <option key={u.id} value={u.descripcion}>{u.descripcion}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xl font-extrabold text-[#0b1d4a] mb-1">Lugar Ejecución</label>
              <select value={form.lugar_ejecucion || ''} onChange={e => setForm({ ...form, lugar_ejecucion: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-lg outline-none" style={inputSt}>
                <option value="">Seleccione Ciudad…</option>
                {ciudadesRef.map(c => <option key={c.id} value={c.descripcion}>{c.descripcion}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xl font-extrabold text-[#0b1d4a] mb-1">Tipo de Moneda</label>
              <select value={form.moneda} onChange={e => setForm({ ...form, moneda: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-lg outline-none" style={inputSt}>
                <option value="">Seleccione…</option>
                {(refData.tipo_moneda ?? []).map(m => <option key={m.id} value={m.descripcion}>{m.descripcion}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xl font-extrabold text-[#0b1d4a] mb-1">Porcentaje de Utilidad (%)</label>
              <input inputMode="decimal" value={form.margen_general || ''} onChange={e => setMargenGeneral(parseMonto(e.target.value))} className="w-full px-3 py-2.5 rounded-lg text-lg text-[#0b1d4a] outline-none text-right font-bold" style={inputSt} placeholder="0" />
              <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Es el % de utilidad por defecto de todos los renglones — luego puedes ajustarlo por ítem o, al Ver el presupuesto, cambiarlo en general o por capítulo.</p>
            </div>
            <div>
              <label className="block text-xl font-extrabold text-[#0b1d4a] mb-1">% Impuesto</label>
              <select value={form.pct_impuesto || 0} onChange={e => setForm({ ...form, pct_impuesto: Number(e.target.value) })} className="w-full px-3 py-2.5 rounded-lg text-lg outline-none" style={inputSt}>
                <option value={0}>Sin impuesto (0%)</option>
                {(refData.impuesto ?? []).filter(i => i.situacion !== false).map(i => <option key={i.id} value={parseMonto(i.descripcion)}>{i.descripcion}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xl font-extrabold text-[#0b1d4a] mb-1">Situación Oferta</label>
              <select value={form.situacion} onChange={e => setForm({ ...form, situacion: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-lg outline-none" style={inputSt}>
                <option value="Borrador">Borrador</option>
                <option value="Enviada">Enviada</option>
                <option value="Ganada">Ganada</option>
                <option value="Perdida">Perdida</option>
              </select>
            </div>
            <div>
              <label className="block text-xl font-extrabold text-[#0b1d4a] mb-1">Monto Calculado Oferta</label>
              <input readOnly value={money(total(form))} className="w-full px-3 py-2.5 rounded-lg text-lg outline-none text-right font-extrabold cursor-not-allowed" style={{ background: '#eef3ff', border: '1px solid #93c5fd', color: '#0b1d4a' }} />
              <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Se calcula automático: Venta + Impuesto de todos los renglones.</p>
            </div>
            <div className="lg:col-span-3">
              <label className="block text-xl font-extrabold text-[#0b1d4a] mb-1">Alcance de la Oferta</label>
              <textarea value={form.alcance} onChange={e => setForm({ ...form, alcance: e.target.value })} rows={3} className="w-full px-3 py-2.5 rounded-lg text-lg text-[#0b1d4a] outline-none" style={inputSt} placeholder="Describa el alcance del proyecto ofertado…" />
            </div>
          </div>

          {/* Selector de vista: toda la oferta o un título */}
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl" style={{ background: '#eef3ff', border: '1px solid #c7d7f5' }}>
            <span className="font-extrabold text-[#0b1d4a]">👁 Ver:</span>
            <button type="button" onClick={() => setVista('todo')} className="px-4 py-2 rounded-lg text-sm font-bold" style={vista === 'todo' ? { background: '#1e3a8a', color: '#fff' } : { background: '#fff', color: '#1e3a8a', border: '1px solid #93c5fd' }}>Todo el presupuesto</button>
            <select value={vista === 'todo' ? '' : vista} onChange={e => setVista(e.target.value || 'todo')} className="px-3 py-2 rounded-lg text-base outline-none" style={inputSt}>
              <option value="">Un título y sus componentes…</option>
              {form.renglones.filter(r => r.tipo === 'T1').map(t => <option key={t.id} value={t.id}>{t.codigo ? `${t.codigo} · ` : ''}{t.descripcion || '(título sin nombre)'}</option>)}
            </select>
            {vista !== 'todo' && <span className="text-sm text-[#6b7280]">Mostrando solo un título — los cambios se guardan igual.</span>}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm font-bold text-[#0b1d4a]">¿Ver Costos / Ventas / Utilidad?</span>
              <button type="button" onClick={() => setVerDesglose(false)} className="px-3 py-1.5 rounded-lg text-sm font-bold" style={!verDesglose ? { background: '#1e3a8a', color: '#fff' } : { background: '#fff', color: '#1e3a8a', border: '1px solid #93c5fd' }}>No</button>
              <button type="button" onClick={() => setVerDesglose(true)} className="px-3 py-1.5 rounded-lg text-sm font-bold" style={verDesglose ? { background: '#15803d', color: '#fff' } : { background: '#fff', color: '#15803d', border: '1px solid #86efac' }}>Sí</button>
            </div>
          </div>

          {/* Renglones (APU) */}
          <div className="rounded-xl overflow-x-auto" style={{ border: '1px solid #e5e7eb', background: '#fff' }}>
            <table className="w-full text-sm">
              <thead style={{ background: '#1e3a8a' }}>
                <tr>
                  {['Nro Item', 'Tipo / Concepto', 'Recurso (del maestro)', 'Descripción', 'Unid', 'Cantidad', 'Costo Unit.', 'Margen %', 'Precio Unit.', 'Monto', ''].map(h => (
                    <th key={h} className="px-2 py-2 text-xs font-semibold text-white text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const visibles = filtrarPorVista(form.renglones, vista)
                  const subT = subtotalesPorTitulo(visibles)
                  return visibles.map((r) => {
                  const codigoCell = (
                    <td className="px-2 py-1.5"><input value={r.codigo} maxLength={10} onChange={e => setRenglon(r.id, { codigo: e.target.value })} className="w-24 px-2 py-1.5 rounded-lg text-sm text-[#0b1d4a] outline-none font-bold" style={inputSt} placeholder="Item" /></td>
                  )
                  const detalle = esDetalle(r.tipo)
                  const tipoCell = (
                    <td className="px-2 py-1.5">
                      <select value={r.tipo} onChange={e => cambiarTipo(r.id, e.target.value)} className={`${detalle ? 'sel-white po-concepto ' : ''}w-44 px-2 py-1.5 rounded-lg text-sm outline-none font-bold`} style={detalle ? { ...conceptoStyle(r.concepto), border: '1px solid #e5e7eb' } : { background: '#bfdbfe', color: '#000000', border: '1px solid #93c5fd' }}>
                        {TIPOS_RENGLON.map(t => <option key={t.v} value={t.v} style={{ background: '#fff', color: '#000000' }}>{t.l}</option>)}
                      </select>
                    </td>
                  )
                  const removeCell = (
                    <td className="px-2 py-1.5 whitespace-nowrap text-right">
                      <div className="inline-flex items-center gap-1 justify-end">
                        {r.tipo === 'T1' && <button type="button" onClick={() => insertEnCapitulo(r.id, 'D1')} title="Agregar ítem a este capítulo" className="px-2 py-1 rounded-lg text-xs font-bold text-white" style={{ background: '#15803d' }}>+ ítem</button>}
                        <button type="button" onClick={() => removeRenglon(r.id)} title="Eliminar este renglón" className="px-2 py-1 rounded-lg text-xs font-bold text-white" style={{ background: '#dc2626' }}>🗑</button>
                      </div>
                    </td>
                  )
                  const sub = subT[r.id]
                  const subtotalTr = (sub && verDesglose) ? (
                    <>
                    <tr style={{ background: '#dbe4fb', borderTop: '2px solid #1e3a8a' }}>
                      <td colSpan={11} className="px-2 py-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-[#0b1d4a]">Σ «{sub.titulo}» · COSTOS</span>
                          {CONCEPTOS_ORDEN.filter(c => sub.porConcepto[c]).map(c => (
                            <span key={c} className="po-concepto px-2 py-0.5 rounded text-xs font-bold" style={conceptoStyle(c)}>{conceptoCorto[c]}: {money(sub.porConcepto[c].costo)}</span>
                          ))}
                          <span className="ml-auto font-extrabold text-[#0b1d4a]">Total Costo: {money(sub.costo)}</span>
                        </div>
                      </td>
                    </tr>
                    <tr style={{ background: '#c7d7f5' }}>
                      <td colSpan={11} className="px-2 py-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-[#0b1d4a]">«{sub.titulo}» · PRECIOS (Venta)</span>
                          {CONCEPTOS_ORDEN.filter(c => sub.porConcepto[c]).map(c => (
                            <span key={c} className="po-concepto px-2 py-0.5 rounded text-xs font-bold" style={conceptoStyle(c)}>{conceptoCorto[c]}: {money(sub.porConcepto[c].venta)}</span>
                          ))}
                          <span className="ml-auto font-extrabold text-[#0b1d4a]">Total Venta: {money(sub.venta)}</span>
                        </div>
                      </td>
                    </tr>
                    <tr style={{ background: '#fff7ed', borderBottom: '2px solid #1e3a8a' }}>
                      <td colSpan={11} className="px-2 py-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold" style={{ color: '#9a3412' }}>Margen «{sub.titulo}»</span>
                          <span className="px-2 py-0.5 rounded font-extrabold" style={{ background: '#fdba74', color: '#7c2d12' }}>{pctMargen(sub.costo, sub.venta)}%</span>
                          <span className="text-xs" style={{ color: '#9a3412' }}>(Venta {money(sub.venta)} − Costo {money(sub.costo)} = Utilidad {money(sub.venta - sub.costo)})</span>
                        </div>
                      </td>
                    </tr>
                    </>
                  ) : null

                  // Renglón de TÍTULO (T1) o SUBTÍTULO (T2): solo código + descripción
                  if (!detalle) {
                    return (
                      <Fragment key={r.id}>
                      <tr style={{ borderTop: '1px solid #e5e7eb', background: r.tipo === 'T1' ? '#dbe4fb' : '#eef3ff' }}>
                        {codigoCell}{tipoCell}
                        <td colSpan={8} className="px-2 py-1.5">
                          <input value={r.descripcion} onChange={e => setRenglon(r.id, { descripcion: e.target.value })}
                            className="w-full px-2 py-1.5 rounded-lg outline-none bg-transparent"
                            style={{ color: '#0b1d4a', fontWeight: 800, fontSize: r.tipo === 'T1' ? '15px' : '13px', paddingLeft: r.tipo === 'T2' ? '18px' : '2px' }}
                            placeholder={r.tipo === 'T1' ? 'TÍTULO / ACTIVIDAD…' : 'Subtítulo…'} />
                        </td>
                        {removeCell}
                      </tr>
                      {subtotalTr}
                      </Fragment>
                    )
                  }

                  // Renglón de DETALLE (D1..D6) — el concepto ya viene en el Tipo
                  const origen = origenDeConcepto(r.concepto)
                  const recursos = recursosDe(r.concepto)
                  return (
                    <Fragment key={r.id}>
                    <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                      {codigoCell}{tipoCell}
                      <td className="px-2 py-1.5">
                        {origen === 'manual'
                          ? <span className="text-xs text-[#9ca3af]">Manual</span>
                          : <select value={r.ref_id} onChange={e => seleccionarRecurso(r.id, e.target.value, r.concepto)} className="w-full min-w-[200px] px-2 py-1.5 rounded-lg text-sm text-[#0b1d4a] outline-none" style={inputSt}>
                              <option value="">Seleccione…</option>
                              {recursos.map(rec => <option key={rec.id} value={rec.id}>{rec.label}</option>)}
                            </select>}
                      </td>
                      <td className="px-2 py-1.5"><input value={r.descripcion} onChange={e => setRenglon(r.id, { descripcion: e.target.value })} className="w-full min-w-[200px] px-2 py-1.5 rounded-lg text-sm text-[#0b1d4a] outline-none" style={inputSt} placeholder="Descripción…" /></td>
                      <td className="px-2 py-1.5"><input value={r.unidad} onChange={e => setRenglon(r.id, { unidad: e.target.value })} className="w-20 px-2 py-1.5 rounded-lg text-sm text-[#0b1d4a] outline-none" style={inputSt} placeholder="und" /></td>
                      <td className="px-2 py-1.5"><input inputMode="decimal" value={r.cantidad || ''} onChange={e => setRenglon(r.id, { cantidad: parseMonto(e.target.value) })} className="w-20 px-2 py-1.5 rounded-lg text-sm text-[#0b1d4a] outline-none text-right" style={inputSt} placeholder="0" /></td>
                      <td className="px-2 py-1.5"><input inputMode="decimal" value={fmtMonto(r.costo_unitario)} onChange={e => setRenglon(r.id, { costo_unitario: parseMonto(e.target.value) })} className="w-28 px-2 py-1.5 rounded-lg text-sm text-[#0b1d4a] outline-none text-right font-semibold" style={inputSt} placeholder="0" /></td>
                      <td className="px-2 py-1.5"><input inputMode="decimal" value={r.margen || ''} onChange={e => setRenglon(r.id, { margen: parseMonto(e.target.value) })} className="w-20 px-2 py-1.5 rounded-lg text-sm outline-none text-right font-bold" style={{ background: '#fff7ed', border: '1px solid #fdba74', color: '#9a3412' }} title="Margen de este renglón — puedes subirlo o bajarlo aquí" placeholder="0" /></td>
                      <td className="px-2 py-1.5"><input inputMode="decimal" value={fmtMonto(precioUnit(r))} onChange={e => setPrecioVenta(r.id, parseMonto(e.target.value))} className="w-28 px-2 py-1.5 rounded-lg text-sm outline-none text-right font-semibold" style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#065f46' }} title="Precio de Venta — al editarlo se recalcula el % de utilidad" placeholder="0" /></td>
                      <td className="px-2 py-1.5 text-right text-[#0b1d4a] font-bold whitespace-nowrap">{money(montoVenta(r))}</td>
                      {removeCell}
                    </tr>
                    {subtotalTr}
                    </Fragment>
                  )
                  })
                })()}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f5f7fb' }}><td colSpan={9} className="px-2 py-1.5 text-right font-bold text-[#374151]">Costo Directo{tituloVisible ? ` («${tituloVisible}»)` : ''}</td><td className="px-2 py-1.5 text-right font-bold text-[#374151]">{money(costoDirecto(ofertaVisible))}</td><td></td></tr>
                <tr style={{ background: '#f5f7fb' }}><td colSpan={9} className="px-2 py-1.5 text-right font-bold text-[#374151]">Subtotal (Venta)</td><td className="px-2 py-1.5 text-right font-bold text-[#374151]">{money(subtotal(ofertaVisible))}</td><td></td></tr>
                <tr style={{ background: '#f5f7fb' }}><td colSpan={9} className="px-2 py-1.5 text-right font-bold text-[#374151]">Impuesto ({form.pct_impuesto || 0}%)</td><td className="px-2 py-1.5 text-right font-bold text-[#374151]">{money(impuesto(ofertaVisible))}</td><td></td></tr>
                <tr style={{ background: '#eef3ff' }}><td colSpan={9} className="px-2 py-2 text-right font-extrabold text-[#0b1d4a]">{tituloVisible ? `TOTAL «${tituloVisible}»` : 'TOTAL PRESUPUESTO'}{form.moneda ? ` (${form.moneda})` : ''}</td><td className="px-2 py-2 text-right font-extrabold text-[#0b1d4a] whitespace-nowrap">{money(total(ofertaVisible))}</td><td></td></tr>
                {verDesglose && <tr style={{ background: '#fff7ed', borderTop: '2px solid #b45309' }}><td colSpan={9} className="px-2 py-2 text-right font-extrabold" style={{ color: '#000000' }}>{tituloVisible ? `MARGEN «${tituloVisible}»` : 'MARGEN GENERAL DEL PRESUPUESTO'} · Costo {money(costoDirecto(ofertaVisible))} → Venta {money(subtotal(ofertaVisible))} · Utilidad {money(subtotal(ofertaVisible) - costoDirecto(ofertaVisible))}</td><td className="px-2 py-2 text-right font-extrabold whitespace-nowrap" style={{ color: '#000000', background: '#fdba74' }}>{pctMargen(costoDirecto(ofertaVisible), subtotal(ofertaVisible))}%</td><td></td></tr>}
              </tfoot>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => addRenglon('T1')} className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: '#1e3a8a' }}>+ Título (T1)</button>
            <button type="button" onClick={() => addRenglon('T2')} className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: '#3b5fd4' }}>+ Subtítulo (T2)</button>
            <button type="button" onClick={() => addRenglon('D1')} className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: '#0b1d4a' }}>+ Detalle (D1–D6)</button>
            <button type="button" onClick={reordenarRecodificar} className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: '#b45309' }}>🔀 Reordenar y Recodificar</button>
          </div>

          {/* Totales por concepto — 2 líneas: Costos y Precios (Venta). Refleja la vista (toda o un título). */}
          {(() => {
            if (!verDesglose) return null
            const tc = totalesPorConcepto(ofertaVisible)
            const conceptos = CONCEPTOS_ORDEN.filter(c => tc[c])
            if (!conceptos.length) return null
            const etiqueta = tituloVisible ? `«${tituloVisible}»` : 'GENERALES'
            return (
              <div className="rounded-xl overflow-hidden" style={{ border: '2px solid #1e3a8a' }}>
                <div className="px-3 py-2 flex flex-wrap items-center gap-2" style={{ background: '#dbe4fb' }}>
                  <span className="font-extrabold text-[#0b1d4a]">TOTALES {etiqueta} · COSTOS</span>
                  {conceptos.map(c => <span key={c} className="po-concepto px-2 py-0.5 rounded text-xs font-bold" style={conceptoStyle(c)}>{conceptoCorto[c]}: {money(tc[c].costo)}</span>)}
                  <span className="ml-auto font-extrabold text-[#0b1d4a]">Total Costo: {money(costoDirecto(ofertaVisible))}</span>
                </div>
                <div className="px-3 py-2 flex flex-wrap items-center gap-2" style={{ background: '#c7d7f5' }}>
                  <span className="font-extrabold text-[#0b1d4a]">TOTALES {etiqueta} · PRECIOS (Venta)</span>
                  {conceptos.map(c => <span key={c} className="po-concepto px-2 py-0.5 rounded text-xs font-bold" style={conceptoStyle(c)}>{conceptoCorto[c]}: {money(tc[c].venta)}</span>)}
                  <span className="ml-auto font-extrabold text-[#0b1d4a]">Total Venta: {money(subtotal(ofertaVisible))}</span>
                </div>
                <div className="px-3 py-2 flex flex-wrap items-center gap-2" style={{ background: '#fff7ed' }}>
                  <span className="font-extrabold" style={{ color: '#9a3412' }}>MARGEN {etiqueta}</span>
                  <span className="text-sm font-bold" style={{ color: '#000000' }}>Venta {money(subtotal(ofertaVisible))} − Costo {money(costoDirecto(ofertaVisible))} = Utilidad {money(subtotal(ofertaVisible) - costoDirecto(ofertaVisible))}</span>
                  <span className="ml-auto px-3 py-1 rounded font-extrabold" style={{ background: '#fdba74', color: '#000000' }}>{pctMargen(costoDirecto(ofertaVisible), subtotal(ofertaVisible))}%</span>
                </div>
              </div>
            )
          })()}

          {verDesglose && resumenVertical(ofertaVisible)}

          <div className="flex gap-3 pt-2">
            <button type="submit" className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #2d3f66, #5c80be)' }}>{form.id ? 'Actualizar' : 'Guardar'}</button>
            <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-[#6b7280] bg-[#f8fafc]">Cancelar</button>
          </div>
        </form>
      )}

      {/* Lista */}
      <div className="rounded-2xl border border-white/10 overflow-x-auto" style={{ background: '#ffffff' }}>
        <table className="w-full text-left text-sm text-[#374151]">
          <thead className="text-white text-xs uppercase bg-[#1e3a8a]">
            <tr>
              <th className="px-6 py-4 font-semibold text-white">Consecutivo</th>
              <th className="px-6 py-4 font-semibold text-white">Cliente</th>
              <th className="px-6 py-4 font-semibold text-white">País</th>
              <th className="px-6 py-4 font-semibold text-white">Fecha</th>
              <th className="px-6 py-4 font-semibold text-white text-center">Renglones</th>
              <th className="px-6 py-4 font-semibold text-white text-right">Total</th>
              <th className="px-6 py-4 font-semibold text-white">Situación</th>
              <th className="px-6 py-4 font-semibold text-white">Creado Por</th>
              <th className="px-6 py-4 font-semibold text-white text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={9} className="px-6 py-12 text-center text-[#111827]">No hay ofertas registradas.</td></tr>}
            {filtered.map((o) => (
              <tr key={o.id} className="border-b border-white/5 hover:bg-[#f1f5f9] transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-[#111827]">{o.consecutivo}</td>
                <td className="px-6 py-4">{o.cliente || o.proyecto || '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{etiquetaPais(o.pais)}</td>
                <td className="px-6 py-4">{fDate(o.fecha_emision)}</td>
                <td className="px-6 py-4 text-center">{o.renglones.length}</td>
                <td className="px-6 py-4 text-right font-bold text-[#0b1d4a]">{money(total(o))}</td>
                <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-full text-xs font-bold" style={sitStyle(o.situacion)}>{o.situacion}</span></td>
                <td className="px-5 py-4"><CreadoPorCell r={o} /></td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => abrirVer(o)} className="font-medium px-3 py-1 rounded-lg text-xs" style={{ background: '#ea580c', color: '#fff', border: '1px solid #ea580c' }}>Ver</button>
                    <button onClick={() => abrirEditar(o)} className="font-medium px-3 py-1 rounded-lg text-xs" style={{ background: '#15803d', color: '#fff', border: '1px solid #15803d' }}>Editar</button>
                    <a href={`/reporte-oferta-oficial?id=${o.id}`} target="_blank" rel="noopener noreferrer" className="font-medium px-3 py-1 rounded-lg text-xs inline-flex items-center" style={{ background: '#0369a1', color: '#fff', border: '1px solid #0369a1' }}>📄 Oficial</a>
                    <a href={`/reporte-oferta?id=${o.id}`} target="_blank" rel="noopener noreferrer" className="font-medium px-3 py-1 rounded-lg text-xs inline-flex items-center" style={{ background: '#0b1d4a', color: '#fff', border: '1px solid #0b1d4a' }}>🖨 APU</a>
                    <a href={`/reporte-resumen-grafico?id=${o.id}`} target="_blank" rel="noopener noreferrer" className="font-medium px-3 py-1 rounded-lg text-xs inline-flex items-center" style={{ background: '#7c3aed', color: '#fff', border: '1px solid #7c3aed' }}>📊 Gráfico</a>
                    <button onClick={() => handleDelete(o.id)} className="font-medium px-3 py-1 rounded-lg text-xs" style={{ background: '#dc2626', color: '#fff', border: '1px solid #dc2626' }}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ver modal */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(11,29,74,0.45)' }} onClick={() => setViewItem(null)}>
          <div className="w-full max-w-6xl rounded-2xl max-h-[92vh] overflow-y-auto" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 rounded-t-2xl" style={{ background: '#1e3a8a' }}>
              <h2 className="text-lg font-bold text-white">{viewItem.consecutivo} · {viewItem.cliente || viewItem.proyecto || "Oferta"}</h2>
              <button onClick={() => setViewItem(null)} className="text-white text-xl w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { l: 'Cliente', v: viewItem.cliente || viewItem.proyecto },
                  { l: 'Código GTM Oferta', v: viewItem.codigo_gtm },
                  { l: 'Comercial Oferta', v: viewItem.comercial },
                  { l: 'Responsable Técnico', v: viewItem.responsable_tecnico },
                  { l: 'Unidad de Negocio', v: viewItem.unidad_negocio },
                  { l: 'Lugar Ejecución', v: viewItem.lugar_ejecucion },
                  { l: 'Fecha Comienzo Elaboración', v: fDate(viewItem.fecha_emision) }, { l: 'Moneda', v: viewItem.moneda },
                  { l: 'Monto Calculado Oferta', v: money(total(viewItem)) },
                  { l: 'Situación Oferta', v: viewItem.situacion }, { l: 'Renglones', v: String(viewItem.renglones.length) },
                ].map(({ l, v }) => (
                  <div key={l}><p className="text-xs uppercase tracking-wider text-[#0b1d4a]">{l}</p><p className="text-black font-bold mt-1 border-2 border-black rounded-md px-2.5 py-1.5">{v || '—'}</p></div>
                ))}
              </div>
              {viewItem.alcance && <div><p className="text-xs uppercase tracking-wider text-[#0b1d4a] mb-1 font-bold">Alcance de la Oferta</p><p className="text-sm text-[#374151] whitespace-pre-wrap border rounded-lg p-3" style={{ borderColor: '#e5e7eb', background: '#fafbfe' }}>{viewItem.alcance}</p></div>}
              {/* Selector de vista */}
              <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl" style={{ background: '#eef3ff', border: '1px solid #c7d7f5' }}>
                <span className="font-extrabold text-[#0b1d4a]">👁 Ver:</span>
                <button type="button" onClick={() => setVista('todo')} className="px-4 py-2 rounded-lg text-sm font-bold" style={vista === 'todo' ? { background: '#1e3a8a', color: '#fff' } : { background: '#fff', color: '#1e3a8a', border: '1px solid #93c5fd' }}>Todo el presupuesto</button>
                <select value={vista === 'todo' ? '' : vista} onChange={e => setVista(e.target.value || 'todo')} className="px-3 py-2 rounded-lg text-base outline-none" style={inputSt}>
                  <option value="">Un título y sus componentes…</option>
                  {viewItem.renglones.filter(r => r.tipo === 'T1').map(t => <option key={t.id} value={t.id}>{t.codigo ? `${t.codigo} · ` : ''}{t.descripcion || '(título sin nombre)'}</option>)}
                </select>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-sm font-bold text-[#0b1d4a]">¿Ver Costos / Ventas / Utilidad?</span>
                  <button type="button" onClick={() => setVerDesglose(false)} className="px-3 py-1.5 rounded-lg text-sm font-bold" style={!verDesglose ? { background: '#1e3a8a', color: '#fff' } : { background: '#fff', color: '#1e3a8a', border: '1px solid #93c5fd' }}>No</button>
                  <button type="button" onClick={() => setVerDesglose(true)} className="px-3 py-1.5 rounded-lg text-sm font-bold" style={verDesglose ? { background: '#15803d', color: '#fff' } : { background: '#fff', color: '#15803d', border: '1px solid #86efac' }}>Sí</button>
                </div>
              </div>
              {/* Editor de Porcentaje de Utilidad — general o por capítulo */}
              <div className="p-3 rounded-xl" style={{ background: '#fff7ed', border: '1px solid #fdba74' }}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-extrabold" style={{ color: '#9a3412' }}>💰 Porcentaje de Utilidad</span>
                  <button type="button" onClick={() => { setShowUtil(v => !v); setUtilMsg('') }} className="px-3 py-1.5 rounded-lg text-sm font-bold text-white" style={{ background: '#ea580c' }}>{showUtil ? 'Ocultar' : 'Cambiar %'}</button>
                  {!showUtil && <span className="text-sm" style={{ color: '#9a3412' }}>Utilidad general actual: <b>{viewItem.margen_general || 0}%</b></span>}
                </div>
                {showUtil && (
                  <div className="flex flex-wrap items-end gap-3 mt-3">
                    <div>
                      <label className="block text-xs font-bold mb-1" style={{ color: '#9a3412' }}>Utilidad (%)</label>
                      <input inputMode="decimal" value={utilPct || ''} onChange={e => setUtilPct(parseMonto(e.target.value))} className="w-28 px-3 py-2 rounded-lg text-right font-bold outline-none" style={{ background: '#fff', border: '1px solid #fdba74', color: '#7c2d12' }} placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1" style={{ color: '#9a3412' }}>Aplicar a</label>
                      <select value={utilScope} onChange={e => { setUtilScope(e.target.value); setUtilMsg('') }} className="px-3 py-2 rounded-lg outline-none" style={{ background: '#fff', border: '1px solid #fdba74', color: '#7c2d12', minWidth: '280px' }}>
                        <option value="general">General — todo el presupuesto</option>
                        {viewItem.renglones.filter(r => r.tipo === 'T1').map(t => <option key={t.id} value={t.id}>Solo capítulo: {t.codigo ? `${t.codigo} · ` : ''}{t.descripcion || '(sin nombre)'}</option>)}
                      </select>
                    </div>
                    <button type="button" onClick={aplicarUtilidad} className="px-5 py-2 rounded-lg font-bold text-white" style={{ background: '#15803d' }}>Aplicar</button>
                    {utilMsg && <span className="text-sm font-bold" style={{ color: '#15803d' }}>{utilMsg}</span>}
                  </div>
                )}
              </div>
              <div className="rounded-xl overflow-x-auto" style={{ border: '1px solid #e5e7eb' }}>
                <table className="w-full text-sm text-left">
                  <thead style={{ background: '#1e3a8a' }}><tr>{['Nro Item', 'Concepto', 'Descripción', 'Unid', 'Cantidad', 'Costo Unit.', 'Margen', 'Precio Unit.', 'Monto'].map(h => <th key={h} className="px-3 py-2 text-xs font-semibold text-white whitespace-nowrap">{h}</th>)}</tr></thead>
                  <tbody>
                    {(() => {
                      const rens = filtrarPorVista(ordenarSoloTipo(viewItem.renglones), vista)
                      const subT = subtotalesPorTitulo(rens)
                      return rens.map(r => {
                        const sub = subT[r.id]
                        const subtotalTr = (sub && verDesglose) ? (
                          <>
                          <tr style={{ background: '#dbe4fb', borderTop: '2px solid #1e3a8a' }}>
                            <td colSpan={9} className="px-3 py-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-extrabold text-[#0b1d4a]">Σ «{sub.titulo}» · COSTOS</span>
                                {CONCEPTOS_ORDEN.filter(c => sub.porConcepto[c]).map(c => (
                                  <span key={c} className="po-concepto px-2 py-0.5 rounded text-xs font-bold" style={conceptoStyle(c)}>{conceptoCorto[c]}: {money(sub.porConcepto[c].costo)}</span>
                                ))}
                                <span className="ml-auto font-extrabold text-[#0b1d4a]">Total Costo: {money(sub.costo)}</span>
                              </div>
                            </td>
                          </tr>
                          <tr style={{ background: '#c7d7f5' }}>
                            <td colSpan={9} className="px-3 py-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-extrabold text-[#0b1d4a]">«{sub.titulo}» · PRECIOS (Venta)</span>
                                {CONCEPTOS_ORDEN.filter(c => sub.porConcepto[c]).map(c => (
                                  <span key={c} className="po-concepto px-2 py-0.5 rounded text-xs font-bold" style={conceptoStyle(c)}>{conceptoCorto[c]}: {money(sub.porConcepto[c].venta)}</span>
                                ))}
                                <span className="ml-auto font-extrabold text-[#0b1d4a]">Total Venta: {money(sub.venta)}</span>
                              </div>
                            </td>
                          </tr>
                          <tr style={{ background: '#fff7ed', borderBottom: '2px solid #1e3a8a' }}>
                            <td colSpan={9} className="px-3 py-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold" style={{ color: '#9a3412' }}>Margen «{sub.titulo}»</span>
                                <span className="px-2 py-0.5 rounded font-extrabold" style={{ background: '#fdba74', color: '#7c2d12' }}>{pctMargen(sub.costo, sub.venta)}%</span>
                                <span className="text-xs" style={{ color: '#9a3412' }}>(Utilidad {money(sub.venta - sub.costo)})</span>
                              </div>
                            </td>
                          </tr>
                          </>
                        ) : null
                        if (r.tipo === 'T1' || r.tipo === 'T2') return (
                          <Fragment key={r.id}>
                          <tr style={{ borderTop: '1px solid #e5e7eb', background: r.tipo === 'T1' ? '#dbe4fb' : '#eef3ff' }}>
                            <td className="px-3 py-1.5 text-black font-bold">{r.codigo}</td>
                            <td colSpan={8} className="px-3 py-1.5 font-extrabold text-[#0b1d4a]" style={{ fontSize: r.tipo === 'T1' ? '14px' : '12.5px', paddingLeft: r.tipo === 'T2' ? '26px' : '12px' }}>{r.descripcion}</td>
                          </tr>
                          {subtotalTr}
                          </Fragment>
                        )
                        return (
                          <Fragment key={r.id}>
                          <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                            <td className="px-3 py-2 text-black font-mono">{r.codigo || '—'}</td>
                            <td className="px-3 py-2"><span className="po-concepto px-2 py-0.5 rounded text-xs font-bold" style={conceptoStyle(r.concepto)}>{r.concepto}</span></td>
                            <td className="px-3 py-2 text-black font-semibold">{r.descripcion}</td>
                            <td className="px-3 py-2 text-black">{r.unidad || '—'}</td>
                            <td className="px-3 py-2 text-black text-right">{r.cantidad}</td>
                            <td className="px-3 py-2 text-black text-right">{money(r.costo_unitario)}</td>
                            <td className="px-3 py-2 text-right" style={{ color: '#b45309' }}>{r.margen || 0}%</td>
                            <td className="px-3 py-2 text-black text-right">{money(precioUnit(r))}</td>
                            <td className="px-3 py-2 text-black font-bold text-right">{money(montoVenta(r))}</td>
                          </tr>
                          {subtotalTr}
                          </Fragment>
                        )
                      })
                    })()}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f5f7fb' }}><td colSpan={8} className="px-3 py-1.5 text-right font-bold text-[#374151]">Subtotal (Venta){tituloVisibleVer ? ` («${tituloVisibleVer}»)` : ''}</td><td className="px-3 py-1.5 text-right font-bold text-[#374151]">{money(subtotal(verVisible!))}</td></tr>
                    <tr style={{ background: '#f5f7fb' }}><td colSpan={8} className="px-3 py-1.5 text-right font-bold text-[#374151]">Impuesto ({viewItem.pct_impuesto || 0}%)</td><td className="px-3 py-1.5 text-right font-bold text-[#374151]">{money(impuesto(verVisible!))}</td></tr>
                    <tr style={{ background: '#eef3ff' }}><td colSpan={8} className="px-3 py-2 text-right font-extrabold text-[#0b1d4a]">{tituloVisibleVer ? `TOTAL «${tituloVisibleVer}»` : 'TOTAL PRESUPUESTO'}{viewItem.moneda ? ` (${viewItem.moneda})` : ''}</td><td className="px-3 py-2 text-right font-extrabold text-[#0b1d4a]">{money(total(verVisible!))}</td></tr>
                    {verDesglose && <tr style={{ background: '#fff7ed', borderTop: '2px solid #b45309' }}><td colSpan={8} className="px-3 py-2 text-right font-extrabold" style={{ color: '#000000' }}>{tituloVisibleVer ? `MARGEN «${tituloVisibleVer}»` : 'MARGEN GENERAL DEL PRESUPUESTO'} · Costo {money(costoDirecto(verVisible!))} → Venta {money(subtotal(verVisible!))} · Utilidad {money(subtotal(verVisible!) - costoDirecto(verVisible!))}</td><td className="px-3 py-2 text-right font-extrabold" style={{ color: '#000000', background: '#fdba74' }}>{pctMargen(costoDirecto(verVisible!), subtotal(verVisible!))}%</td></tr>}
                  </tfoot>
                </table>
              </div>
              {(() => {
                if (!verDesglose) return null
                const tc = totalesPorConcepto(verVisible!)
                const conceptos = CONCEPTOS_ORDEN.filter(c => tc[c])
                if (!conceptos.length) return null
                const etiqueta = tituloVisibleVer ? `«${tituloVisibleVer}»` : 'GENERALES'
                return (
                  <div className="rounded-xl overflow-hidden" style={{ border: '2px solid #1e3a8a' }}>
                    <div className="px-3 py-2 flex flex-wrap items-center gap-2" style={{ background: '#dbe4fb' }}>
                      <span className="font-extrabold text-[#0b1d4a]">TOTALES {etiqueta} · COSTOS</span>
                      {conceptos.map(c => <span key={c} className="po-concepto px-2 py-0.5 rounded text-xs font-bold" style={conceptoStyle(c)}>{conceptoCorto[c]}: {money(tc[c].costo)}</span>)}
                      <span className="ml-auto font-extrabold text-[#0b1d4a]">Total Costo: {money(costoDirecto(verVisible!))}</span>
                    </div>
                    <div className="px-3 py-2 flex flex-wrap items-center gap-2" style={{ background: '#c7d7f5' }}>
                      <span className="font-extrabold text-[#0b1d4a]">TOTALES {etiqueta} · PRECIOS (Venta)</span>
                      {conceptos.map(c => <span key={c} className="po-concepto px-2 py-0.5 rounded text-xs font-bold" style={conceptoStyle(c)}>{conceptoCorto[c]}: {money(tc[c].venta)}</span>)}
                      <span className="ml-auto font-extrabold text-[#0b1d4a]">Total Venta: {money(subtotal(verVisible!))}</span>
                    </div>
                  </div>
                )
              })()}
              {verDesglose && resumenVertical(verVisible!)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
