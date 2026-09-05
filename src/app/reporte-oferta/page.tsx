'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { PRESUPUESTO_CSS } from '@/shared/lib/presupuesto-css'
import { useSearchParams } from 'next/navigation'
import { useOfertasStore } from '@/features/ofertas/store/ofertas-store'
import { type Oferta, type RenglonOferta, esDetalle, costoTotal, montoVenta, precioUnit } from '@/features/ofertas/types'

// ---------- helpers ----------
const money = (n: number) => 'S/ ' + Math.round(n || 0).toLocaleString('en-US')
const money0 = (n: number) => Math.round(n || 0).toLocaleString('en-US')
const fecha = (iso: string) => { if (!iso) return '—'; const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}` }
const fechaHoy = () => { const d = new Date(); const p = (n: number) => String(n).padStart(2, '0'); return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}` }
const pct = (costo: number, venta: number) => costo > 0 ? (Math.round(((venta - costo) / costo) * 1000) / 10) : 0
const pctVenta = (parte: number, total: number) => total > 0 ? (Math.round((parte / total) * 1000) / 10) : 0

const CONCEPTOS = ['MOD', 'MOI', 'Materiales', 'Maquinaria y Vehículos', 'Subcontrato', 'Otro'] as const
const conceptoColor: Record<string, string> = {
  'MOD': '#ea580c', 'MOI': '#0369a1', 'Materiales': '#7c3aed',
  'Maquinaria y Vehículos': '#16a34a', 'Subcontrato': '#a16207', 'Otro': '#6b7280',
}
const conceptoLabel: Record<string, string> = {
  'MOD': 'Mano de Obra Directa', 'MOI': 'Mano de Obra Indirecta', 'Materiales': 'Materiales',
  'Maquinaria y Vehículos': 'Utilización de Maquinaria y Vehículos', 'Subcontrato': 'Subcontratos (llave en mano)', 'Otro': 'Otros · Transporte · Viajes',
}
const conceptoBadge: Record<string, string> = {
  'MOD': 'MOD', 'MOI': 'MOI', 'Materiales': 'MAT', 'Maquinaria y Vehículos': 'MAQ', 'Subcontrato': 'SUBC', 'Otro': 'OTRO',
}
const conceptoCorto: Record<string, string> = {
  'MOD': 'M.O.D', 'MOI': 'M.O.I', 'Materiales': 'Materiales', 'Maquinaria y Vehículos': 'Maquinaria', 'Subcontrato': 'Subcontr.', 'Otro': 'Otros',
}

type Grupo = { titulo: RenglonOferta | null; rows: RenglonOferta[] }
const agruparActividades = (rens: RenglonOferta[]): Grupo[] => {
  const acts: Grupo[] = []
  let cur: Grupo | null = null
  rens.forEach(r => {
    if (r.tipo === 'T1') { cur = { titulo: r, rows: [] }; acts.push(cur) }
    else { if (!cur) { cur = { titulo: null, rows: [] }; acts.push(cur) } cur.rows.push(r) }
  })
  return acts
}

// bloque de un solo título (T1 + sus renglones hasta el siguiente T1)
const bloqueDeTitulo = (rens: RenglonOferta[], tituloId: string): RenglonOferta[] => {
  const out: RenglonOferta[] = []
  let cap = false
  for (const r of rens) {
    if (r.tipo === 'T1') { if (r.id === tituloId) { cap = true; out.push(r); continue } if (cap) break; cap = false }
    else if (cap) out.push(r)
  }
  return out
}

// ---------- Gráfico de barras (SVG inline, vertical) ----------
function BarChart({ data, moneda }: { data: { label: string; value: number; color: string }[], moneda: string }) {
  const W = 760, H = 300, padL = 104, padR = 20, padT = 30, padB = 56
  const plotW = W - padL - padR, plotH = H - padT - padB
  const max = Math.max(1, ...data.map(d => d.value))
  const step = Math.ceil(max / 5 / 1000) * 1000 || 1000
  const top = Math.ceil(max / step) * step
  const bw = plotW / data.length * 0.6, gap = plotW / data.length
  const y = (v: number) => padT + plotH - (v / top) * plotH
  const ticks = []
  for (let v = 0; v <= top; v += step) ticks.push(v)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
      {ticks.map(v => (
        <g key={v}>
          <line x1={padL} y1={y(v)} x2={W - padR} y2={y(v)} stroke="#e5e7eb" strokeWidth={1} />
          <text x={padL - 8} y={y(v) + 4} textAnchor="end" fontSize={11} fill="#9ca3af">{'S/ ' + money0(v)}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const x = padL + gap * i + (gap - bw) / 2
        const h = (d.value / top) * plotH
        return (
          <g key={i}>
            <rect x={x} y={padT + plotH - h} width={bw} height={h} rx={3} fill={d.color} />
            <text x={x + bw / 2} y={padT + plotH - h - 8} textAnchor="middle" fontSize={12} fontWeight={700} fill="#0b1d4a">{money(d.value)}</text>
            <circle cx={x + bw / 2} cy={padT + plotH + 16} r={4} fill={d.color} />
            {d.label.split('\n').map((ln, k) => (
              <text key={k} x={x + bw / 2} y={padT + plotH + 32 + k * 12} textAnchor="middle" fontSize={11} fill="#374151">{ln}</text>
            ))}
          </g>
        )
      })}
    </svg>
  )
}

// ---------- Reporte ----------
function Reporte() {
  const params = useSearchParams()
  const ofertas = useOfertasStore(s => s.ofertas)
  const [mounted, setMounted] = useState(false)
  const [ofertaId, setOfertaId] = useState('')
  const [vista, setVista] = useState('todo') // 'todo' | id de T1
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { const q = params.get('id'); if (q) setOfertaId(q) }, [params])
  useEffect(() => { useOfertasStore.getState().loadOfertas() }, [])

  const oferta = useMemo(() => ofertas.find(o => o.id === ofertaId) || null, [ofertas, ofertaId])
  useEffect(() => {
    if (oferta) document.title = `${oferta.consecutivo}${oferta.proyecto ? ' - ' + oferta.proyecto : ''}`
  }, [oferta])
  const titulos = useMemo(() => oferta ? (oferta.renglones || []).filter(r => r.tipo === 'T1') : [], [oferta])

  // renglones según la vista (toda o un título)
  const rens = useMemo(() => {
    if (!oferta) return []
    const todos = oferta.renglones || []
    return vista === 'todo' ? todos : bloqueDeTitulo(todos, vista)
  }, [oferta, vista])

  const acts = useMemo(() => agruparActividades(rens).map(g => {
    const dets = g.rows.filter(r => esDetalle(r.tipo))
    const subtitulos = g.rows.filter(r => r.tipo === 'T2')
    const porConcepto: Record<string, { rows: RenglonOferta[]; costo: number; venta: number }> = {}
    CONCEPTOS.forEach(c => {
      const rows = dets.filter(r => (r.concepto || 'Otro') === c)
      if (rows.length) porConcepto[c] = { rows, costo: rows.reduce((s, r) => s + costoTotal(r), 0), venta: rows.reduce((s, r) => s + montoVenta(r), 0) }
    })
    return { titulo: g.titulo, subtitulos, porConcepto, costo: dets.reduce((s, r) => s + costoTotal(r), 0), venta: dets.reduce((s, r) => s + montoVenta(r), 0) }
  }), [rens])

  const allDets = useMemo(() => rens.filter(r => esDetalle(r.tipo)), [rens])
  const totCosto = allDets.reduce((s, r) => s + costoTotal(r), 0)
  const totVenta = allDets.reduce((s, r) => s + montoVenta(r), 0)
  const totPorConcepto = useMemo(() => {
    const m: Record<string, { costo: number; venta: number }> = {}
    allDets.forEach(r => { const c = r.concepto || 'Otro'; if (!m[c]) m[c] = { costo: 0, venta: 0 }; m[c].costo += costoTotal(r); m[c].venta += montoVenta(r) })
    return m
  }, [allDets])
  const conceptosPresentes = CONCEPTOS.filter(c => totPorConcepto[c])
  const impuesto = totVenta * ((oferta?.pct_impuesto || 0) / 100)

  const chartData = conceptosPresentes.map(c => ({ label: conceptoCorto[c].replace(' ', '\n'), value: totPorConcepto[c].costo, color: conceptoColor[c] }))

  // Impresión Safari-proof: clona la hoja en una ventana limpia y la imprime desde ahí.
  const printReport = () => {
    const el = document.querySelector('.sheet')
    if (!el) { window.print(); return }
    const w = window.open('', '_blank', 'width=900,height=1200')
    if (!w) { window.print(); return }
    const titulo = document.title || 'Reporte'
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${titulo}</title>
      <style>
        @page { size: A4 portrait; margin: 9mm; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
        html, body { margin: 0; background: #fff; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; }
        .sheet { max-width: none !important; width: 100% !important; box-shadow: none !important; margin: 0 !important; }
        table { width: 100%; border-collapse: collapse; }
        tr, thead, tfoot { break-inside: avoid; }
        thead { display: table-header-group; }
      </style></head><body>${el.outerHTML}</body></html>`)
    w.document.close()
    w.focus()
    setTimeout(() => { try { w.print() } catch { /* usuario cancela */ } }, 500)
  }

  if (!mounted) return <div style={{ padding: 40, fontFamily: 'system-ui' }}>Cargando…</div>

  const numAct = (i: number, t: RenglonOferta | null) => t?.codigo || String(i + 1)

  return (
    <div className="po-root report-root" style={{ background: '#f3f4f6', minHeight: '100vh', padding: '18px 0', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as React.CSSProperties}><style dangerouslySetInnerHTML={{ __html: PRESUPUESTO_CSS }} />
      <style>{`
        @page { size: A4 portrait; margin: 9mm; }
        @media print {
          .no-print { display: none !important; }
          html, body { background: #fff !important; height: auto !important; }
          .report-root { min-height: 0 !important; background: #fff !important; padding: 0 !important; }
          .sheet { box-shadow: none !important; margin: 0 !important; max-width: none !important; width: 100% !important; }
          table { break-inside: auto; }
          tr, tfoot, thead { break-inside: avoid; }
          thead { display: table-header-group; }
        }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      `}</style>

      {/* Barra de control (no imprime) */}
      <div className="no-print" style={{ maxWidth: 820, margin: '0 auto 16px', background: '#0b1d4a', borderRadius: 12, padding: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end', color: '#fff', fontFamily: 'system-ui' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, color: '#c7d7f5' }}>PROYECTO</div>
          <select value={ofertaId} onChange={e => { setOfertaId(e.target.value); setVista('todo') }} style={{ height: 40, minWidth: 320, borderRadius: 8, padding: '0 10px', color: '#000', fontWeight: 600 }}>
            <option value="">— Selecciona un proyecto —</option>
            {ofertas.map(o => <option key={o.id} value={o.id}>{o.consecutivo} — {o.proyecto || 'Sin proyecto'}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, color: '#c7d7f5' }}>ALCANCE DEL REPORTE</div>
          <select value={vista} onChange={e => setVista(e.target.value)} disabled={!oferta} style={{ height: 40, minWidth: 260, borderRadius: 8, padding: '0 10px', color: '#000', fontWeight: 600 }}>
            <option value="todo">Todo el proyecto</option>
            {titulos.map(t => <option key={t.id} value={t.id}>Solo: {t.codigo ? t.codigo + ' · ' : ''}{t.descripcion || 'Título'}</option>)}
          </select>
        </div>
        <button onClick={printReport} disabled={!oferta} style={{ height: 40, padding: '0 20px', borderRadius: 8, background: '#dc2626', color: '#fff', fontWeight: 800, border: 'none', cursor: oferta ? 'pointer' : 'not-allowed', opacity: oferta ? 1 : 0.5 }}>📄 Guardar PDF</button>
        <button onClick={printReport} disabled={!oferta} style={{ height: 40, padding: '0 20px', borderRadius: 8, background: '#ea580c', color: '#fff', fontWeight: 800, border: 'none', cursor: oferta ? 'pointer' : 'not-allowed', opacity: oferta ? 1 : 0.5 }}>🖨 Imprimir</button>
        <a href="/ofertas-clientes" style={{ height: 40, padding: '0 16px', borderRadius: 8, background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>← Volver</a>
      </div>

      {!oferta ? (
        <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center', padding: 60, color: '#6b7280', fontFamily: 'system-ui' }}>Selecciona un proyecto para generar el reporte.</div>
      ) : (
        <div className="sheet" style={{ maxWidth: 820, margin: '0 auto', background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', padding: '0', fontFamily: 'system-ui', color: '#111827', fontSize: 12 }}>
          {/* Encabezado */}
          <div style={{ background: '#0b1d4a', color: '#fff', padding: '20px 26px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderTop: '5px solid #ea580c' }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: 3, fontWeight: 700, color: '#f6a96b' }}>GRUPO TAMOIN</div>
              <div style={{ fontSize: 24, fontWeight: 800, margin: '2px 0' }}>{oferta.proyecto || 'Presupuesto de Obra'}</div>
              <div style={{ fontSize: 12, color: '#c7d7f5' }}>Análisis de Precios Unitarios (APU) · Mano de Obra, Materiales, Maquinaria y Subcontratos</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>PROYECTO N° {oferta.consecutivo}</div>
              <div style={{ fontSize: 11, color: '#c7d7f5', marginTop: 4 }}>Fecha: {fechaHoy()}</div>
              <div style={{ fontSize: 11, color: '#c7d7f5' }}>Situación: {oferta.situacion || 'Borrador'}</div>
              {vista !== 'todo' && <div style={{ fontSize: 11, color: '#f6a96b', marginTop: 4, fontWeight: 700 }}>Reporte parcial · 1 partida</div>}
            </div>
          </div>

          {/* Cliente / Proyecto / Moneda */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e5e7eb' }}>
            {[['PROYECTO / CENTRO DE COSTO', oferta.proyecto || '—'], ['MONEDA', oferta.moneda || '—']].map(([k, v], i) => (
              <div key={i} style={{ flex: i === 1 ? '0 0 130px' : 1, padding: '12px 20px', borderLeft: i ? '1px solid #e5e7eb' : 'none' }}>
                <div style={{ fontSize: 10, letterSpacing: 1, color: '#9ca3af', fontWeight: 700 }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0b1d4a' }}>{v}</div>
              </div>
            ))}
          </div>
          {oferta.alcance && (
            <div style={{ padding: '10px 20px', background: '#f9fafb', fontSize: 12, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>
              <span style={{ fontWeight: 700, color: '#0b1d4a' }}>Alcance: </span>{oferta.alcance}
            </div>
          )}

          {/* Tabla APU */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#0b1d4a', color: '#fff' }}>
                {['CÓD.', 'RECURSO — DESCRIPCIÓN', 'UND', 'CANT.', 'COSTO UNIT.', 'MARGEN', 'PRECIO UNIT.', 'COSTO TOTAL', 'MONTO (VENTA)'].map((h, i) => (
                  <th key={h} style={{ padding: '7px 6px', textAlign: i < 2 ? 'left' : 'right', fontSize: 9.5, letterSpacing: 0.3, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {acts.map((act, ai) => (
                <ActividadBlock key={act.titulo?.id || ai} act={act} num={numAct(ai, act.titulo)} />
              ))}
              {/* Totales generales */}
              <tr style={{ background: '#ea580c', color: '#fff' }}>
                <td colSpan={7} style={{ padding: '9px 8px', textAlign: 'right', fontWeight: 800, fontSize: 12 }}>TOTALES GENERALES</td>
                <td style={{ padding: '9px 6px', textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap' }}>{money(totCosto)}</td>
                <td style={{ padding: '9px 6px', textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap' }}>{money(totVenta)}</td>
              </tr>
            </tbody>
          </table>

          {/* KPI cards */}
          <div style={{ display: 'flex', gap: 10, padding: '16px 20px' }}>
            {[
              { l: 'COSTO DIRECTO TOTAL', v: money(totCosto), bg: '#1f2d52' },
              { l: 'VALOR PROYECTO (VENTA)', v: money(totVenta), bg: '#0b1d4a' },
              { l: 'UTILIDAD', v: money(totVenta - totCosto), bg: '#15803d' },
              { l: 'MARGEN S/COSTO', v: pct(totCosto, totVenta) + '%', bg: '#b45309' },
            ].map(k => (
              <div key={k.l} style={{ flex: 1, background: k.bg, color: '#fff', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 9.5, letterSpacing: 0.5, opacity: 0.85, fontWeight: 700 }}>{k.l}</div>
                <div style={{ fontSize: 19, fontWeight: 800, marginTop: 4 }}>{k.v}</div>
              </div>
            ))}
          </div>

          {oferta.pct_impuesto ? (
            <div style={{ padding: '0 20px 8px', fontSize: 12, color: '#374151' }}>
              <span style={{ fontWeight: 700 }}>Impuesto ({oferta.pct_impuesto}%): </span>{money(impuesto)} &nbsp;·&nbsp;
              <span style={{ fontWeight: 800, color: '#0b1d4a' }}>TOTAL CON IMPUESTO: {money(totVenta + impuesto)}</span>
            </div>
          ) : null}

          {/* Resumen de actividades */}
          {acts.length > 1 && (
            <div style={{ padding: '8px 20px 4px' }}>
              <div style={{ background: '#0b1d4a', color: '#fff', padding: '7px 12px', fontWeight: 800, fontSize: 12, borderRadius: '6px 6px 0 0' }}>RESUMEN DE ACTIVIDADES — MONTO DE VENTA POR CONCEPTO</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5 }}>
                <thead>
                  <tr style={{ background: '#eef3ff', color: '#0b1d4a' }}>
                    <th style={{ padding: '6px', textAlign: 'left' }}>ACTIVIDAD</th>
                    {conceptosPresentes.map(c => <th key={c} style={{ padding: '6px', textAlign: 'right' }}>{conceptoCorto[c]}</th>)}
                    <th style={{ padding: '6px', textAlign: 'right' }}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {acts.map((act, ai) => (
                    <tr key={ai} style={{ borderBottom: '1px solid #eef1f6' }}>
                      <td style={{ padding: '5px 6px', fontWeight: 600 }}>{numAct(ai, act.titulo)} · {act.titulo?.descripcion || 'Sin título'}</td>
                      {conceptosPresentes.map(c => <td key={c} style={{ padding: '5px 6px', textAlign: 'right' }}>{act.porConcepto[c] ? money(act.porConcepto[c].venta) : '—'}</td>)}
                      <td style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 700 }}>{money(act.venta)}</td>
                    </tr>
                  ))}
                  <tr style={{ background: '#dbe4fb', color: '#0b1d4a', fontWeight: 800 }}>
                    <td style={{ padding: '6px' }}>TOTAL POR CONCEPTO</td>
                    {conceptosPresentes.map(c => <td key={c} style={{ padding: '6px', textAlign: 'right' }}>{money(totPorConcepto[c].venta)}</td>)}
                    <td style={{ padding: '6px', textAlign: 'right' }}>{money(totVenta)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Totales por tipo de recurso */}
          <div style={{ padding: '8px 20px 4px' }}>
            <div style={{ background: '#0b1d4a', color: '#fff', padding: '7px 12px', fontWeight: 800, fontSize: 12, borderRadius: '6px 6px 0 0' }}>TOTALES POR TIPO DE RECURSO</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#eef3ff', color: '#0b1d4a' }}>
                  <th style={{ padding: '6px', textAlign: 'left' }}>CONCEPTO</th>
                  <th style={{ padding: '6px', textAlign: 'right' }}>COSTO TOTAL</th>
                  <th style={{ padding: '6px', textAlign: 'right' }}>MONTO (VENTA)</th>
                  <th style={{ padding: '6px', textAlign: 'right' }}>% S/VENTA</th>
                </tr>
              </thead>
              <tbody>
                {conceptosPresentes.map(c => (
                  <tr key={c} style={{ borderBottom: '1px solid #eef1f6' }}>
                    <td style={{ padding: '6px' }}><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 2, background: conceptoColor[c], marginRight: 7 }} />{conceptoLabel[c]}</td>
                    <td style={{ padding: '6px', textAlign: 'right' }}>{money(totPorConcepto[c].costo)}</td>
                    <td style={{ padding: '6px', textAlign: 'right', fontWeight: 700 }}>{money(totPorConcepto[c].venta)}</td>
                    <td style={{ padding: '6px', textAlign: 'right', color: '#b45309', fontWeight: 700 }}>{pctVenta(totPorConcepto[c].venta, totVenta)}%</td>
                  </tr>
                ))}
                <tr style={{ background: '#0b1d4a', color: '#fff', fontWeight: 800 }}>
                  <td style={{ padding: '7px' }}>TOTAL PROYECTO</td>
                  <td style={{ padding: '7px', textAlign: 'right' }}>{money(totCosto)}</td>
                  <td style={{ padding: '7px', textAlign: 'right' }}>{money(totVenta)}</td>
                  <td style={{ padding: '7px', textAlign: 'right' }}>100.0%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Detalle de Maquinaria y Equipos */}
          {(() => {
            const maq = allDets.filter(r => r.concepto === 'Maquinaria y Vehículos')
            if (maq.length === 0) return null
            const cT = maq.reduce((s, r) => s + costoTotal(r), 0)
            const vT = maq.reduce((s, r) => s + montoVenta(r), 0)
            return (
              <div style={{ padding: '8px 20px 4px' }}>
                <div style={{ background: '#16a34a', color: '#fff', padding: '7px 12px', fontWeight: 800, fontSize: 12, borderRadius: '6px 6px 0 0' }}>DETALLE DE MAQUINARIA Y EQUIPOS</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5 }}>
                  <thead>
                    <tr style={{ background: '#eaf7ee', color: '#0b1d4a' }}>
                      <th style={{ padding: '6px', textAlign: 'left' }}>MAQUINARIA / EQUIPO</th>
                      <th style={{ padding: '6px', textAlign: 'right' }}>UND</th>
                      <th style={{ padding: '6px', textAlign: 'right' }}>CANT.</th>
                      <th style={{ padding: '6px', textAlign: 'right' }}>COSTO UNIT / MEDIDA</th>
                      <th style={{ padding: '6px', textAlign: 'right' }}>VENTA</th>
                      <th style={{ padding: '6px', textAlign: 'right' }}>MARGEN %</th>
                      <th style={{ padding: '6px', textAlign: 'right' }}>UTILIDAD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maq.map(r => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #eef1f6' }}>
                        <td style={{ padding: '5px 6px', fontWeight: 600 }}>{r.descripcion || '—'}</td>
                        <td style={{ padding: '5px 6px', textAlign: 'right' }}>{r.unidad || '—'}</td>
                        <td style={{ padding: '5px 6px', textAlign: 'right' }}>{(r.cantidad || 0).toLocaleString('en-US')}</td>
                        <td style={{ padding: '5px 6px', textAlign: 'right' }}>{money(r.costo_unitario)}{r.unidad ? ` / ${r.unidad}` : ''}</td>
                        <td style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 700 }}>{money(montoVenta(r))}</td>
                        <td style={{ padding: '5px 6px', textAlign: 'right', color: '#b45309', fontWeight: 700 }}>{r.margen || 0}%</td>
                        <td style={{ padding: '5px 6px', textAlign: 'right', color: '#15803d', fontWeight: 700 }}>{money(montoVenta(r) - costoTotal(r))}</td>
                      </tr>
                    ))}
                    <tr style={{ background: '#16a34a', color: '#fff', fontWeight: 800 }}>
                      <td colSpan={4} style={{ padding: '6px', textAlign: 'right' }}>TOTAL MAQUINARIA Y EQUIPOS</td>
                      <td style={{ padding: '6px', textAlign: 'right' }}>{money(vT)}</td>
                      <td style={{ padding: '6px', textAlign: 'right' }}>{pct(cT, vT)}%</td>
                      <td style={{ padding: '6px', textAlign: 'right' }}>{money(vT - cT)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )
          })()}

          {/* Gráfico */}
          {chartData.length > 0 && (
            <div style={{ padding: '8px 20px 16px' }}>
              <div style={{ background: '#ea580c', color: '#fff', padding: '7px 12px', fontWeight: 800, fontSize: 12, borderRadius: '6px 6px 0 0' }}>GRÁFICO — COSTOS POR TIPO DE RECURSO ({oferta.moneda || 'moneda'})</div>
              <div style={{ border: '1px solid #e5e7eb', borderTop: 'none', padding: '14px 10px', borderRadius: '0 0 6px 6px' }}>
                <BarChart data={chartData} moneda={oferta.moneda} />
              </div>
            </div>
          )}

          {/* Nota */}
          <div style={{ padding: '4px 20px 20px', fontSize: 9.5, color: '#9ca3af', lineHeight: 1.5 }}>
            <b>Cómo se lee:</b> cada actividad muestra un <b>Subtotal por concepto</b> (M.O.D, M.O.I, Materiales, Maquinaria, Subcontratos, Otros) y su <b>SUBTOTAL de actividad</b> con su margen. Precio Unit. = Costo Unit. × (1 + Margen); Monto = Precio Unit. × Cantidad; Utilidad = Venta − Costo. Valor Proyecto (Venta) = {money(totVenta)} · Margen s/costo {pct(totCosto, totVenta)}%.
            <div style={{ marginTop: 6, color: '#c0c4cc' }}>Grupo Tamoin · Sistema de Ofertas · Oferta {oferta.consecutivo} · Generado el {fechaHoy()}.</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------- Bloque de una actividad ----------
function ActividadBlock({ act, num }: { act: { titulo: RenglonOferta | null; subtitulos: RenglonOferta[]; porConcepto: Record<string, { rows: RenglonOferta[]; costo: number; venta: number }>; costo: number; venta: number }, num: string }) {
  return (
    <>
      {act.titulo && (
        <tr style={{ background: '#1e3a8a', color: '#fff' }}>
          <td colSpan={9} style={{ padding: '7px 8px', fontWeight: 800, fontSize: 11.5, letterSpacing: 0.3 }}>{num} · {(act.titulo.descripcion || 'ACTIVIDAD').toUpperCase()}</td>
        </tr>
      )}
      {act.subtitulos.map(st => (
        <tr key={st.id} style={{ background: '#eef3ff' }}>
          <td colSpan={9} style={{ padding: '4px 8px 4px 18px', fontWeight: 700, fontSize: 11, color: '#0b1d4a', fontStyle: 'italic' }}>{st.descripcion}</td>
        </tr>
      ))}
      {CONCEPTOS.filter(c => act.porConcepto[c]).map(c => {
        const g = act.porConcepto[c]
        return (
          <ConceptoGroup key={c} concepto={c} rows={g.rows} costo={g.costo} venta={g.venta} />
        )
      })}
      {act.titulo && (
        <tr style={{ background: '#f0f3fa', borderTop: '2px solid #1e3a8a', borderBottom: '2px solid #1e3a8a' }}>
          <td colSpan={7} style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800, color: '#0b1d4a' }}>SUBTOTAL {num} · Margen {pct(act.costo, act.venta)}%</td>
          <td style={{ padding: '6px 6px', textAlign: 'right', fontWeight: 800, color: '#0b1d4a', whiteSpace: 'nowrap' }}>{money(act.costo)}</td>
          <td style={{ padding: '6px 6px', textAlign: 'right', fontWeight: 800, color: '#0b1d4a', whiteSpace: 'nowrap' }}>{money(act.venta)}</td>
        </tr>
      )}
    </>
  )
}

function ConceptoGroup({ concepto, rows, costo, venta }: { concepto: string; rows: RenglonOferta[]; costo: number; venta: number }) {
  return (
    <>
      <tr>
        <td colSpan={9} style={{ padding: '4px 8px', fontSize: 10.5, fontWeight: 700, color: conceptoColor[concepto] }}>▸ {conceptoLabel[concepto]}</td>
      </tr>
      {rows.map(r => (
        <tr key={r.id} style={{ borderBottom: '1px solid #f1f2f5' }}>
          <td style={{ padding: '4px 6px', color: '#6b7280', fontWeight: 600, whiteSpace: 'nowrap' }}>{r.codigo}</td>
          <td style={{ padding: '4px 6px' }}>
            <span style={{ display: 'inline-block', background: conceptoColor[concepto], color: '#fff', fontSize: 8, fontWeight: 800, padding: '1px 4px', borderRadius: 3, marginRight: 6, verticalAlign: 'middle' }}>{conceptoBadge[concepto]}</span>
            {r.descripcion || '—'}
          </td>
          <td style={{ padding: '4px 6px', textAlign: 'right', color: '#6b7280' }}>{r.unidad || '—'}</td>
          <td style={{ padding: '4px 6px', textAlign: 'right' }}>{(r.cantidad || 0).toLocaleString('en-US')}</td>
          <td style={{ padding: '4px 6px', textAlign: 'right' }}>{money(r.costo_unitario)}</td>
          <td style={{ padding: '4px 6px', textAlign: 'right', color: '#b45309', fontWeight: 700 }}>{r.margen || 0}%</td>
          <td style={{ padding: '4px 6px', textAlign: 'right' }}>{money(precioUnit(r))}</td>
          <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 600 }}>{money(costoTotal(r))}</td>
          <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700, color: '#0b1d4a' }}>{money(montoVenta(r))}</td>
        </tr>
      ))}
      <tr>
        <td colSpan={7} style={{ padding: '3px 8px', textAlign: 'right', fontStyle: 'italic', fontSize: 10.5, color: '#6b7280' }}>Subtotal {conceptoLabel[concepto]}</td>
        <td style={{ padding: '3px 6px', textAlign: 'right', fontStyle: 'italic', fontSize: 10.5, color: '#6b7280' }}>{money(costo)}</td>
        <td style={{ padding: '3px 6px', textAlign: 'right', fontStyle: 'italic', fontSize: 10.5, color: '#6b7280' }}>{money(venta)}</td>
      </tr>
    </>
  )
}

export default function ReporteOfertaPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, fontFamily: 'system-ui' }}>Cargando…</div>}>
      <Reporte />
    </Suspense>
  )
}
