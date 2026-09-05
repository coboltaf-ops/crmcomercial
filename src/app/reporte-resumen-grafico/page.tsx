'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { PRESUPUESTO_CSS } from '@/shared/lib/presupuesto-css'
import { useSearchParams } from 'next/navigation'
import { useOfertasStore } from '@/features/ofertas/store/ofertas-store'
import { type RenglonOferta, esDetalle, costoTotal, montoVenta } from '@/features/ofertas/types'

// ---------- helpers ----------
const money = (n: number) => 'S/ ' + Math.round(n || 0).toLocaleString('en-US')
const money0 = (n: number) => Math.round(n || 0).toLocaleString('en-US')
const money2 = (n: number) => 'S/ ' + (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const qty = (n: number) => (n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })
const fecha = (iso: string) => { if (!iso) return '—'; const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}` }
const fechaHoy = () => { const d = new Date(); const p = (n: number) => String(n).padStart(2, '0'); return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}` }
const pct = (costo: number, venta: number) => costo > 0 ? (Math.round(((venta - costo) / costo) * 1000) / 10) : 0

const CONCEPTOS = ['MOD', 'MOI', 'Materiales', 'Maquinaria y Vehículos', 'Subcontrato', 'Otro'] as const
const conceptoColor: Record<string, string> = {
  'MOD': '#ea580c', 'MOI': '#0369a1', 'Materiales': '#7c3aed',
  'Maquinaria y Vehículos': '#16a34a', 'Subcontrato': '#a16207', 'Otro': '#6b7280',
}
const conceptoLabel: Record<string, string> = {
  'MOD': 'Mano de Obra Directa', 'MOI': 'Mano de Obra Indirecta', 'Materiales': 'Materiales',
  'Maquinaria y Vehículos': 'Maquinaria y Vehículos', 'Subcontrato': 'Subcontratos', 'Otro': 'Otros',
}

const bloqueDeTitulo = (rens: RenglonOferta[], tituloId: string): RenglonOferta[] => {
  const out: RenglonOferta[] = []
  let cap = false
  for (const r of rens) {
    if (r.tipo === 'T1') { if (r.id === tituloId) { cap = true; out.push(r); continue } if (cap) break; cap = false }
    else if (cap) out.push(r)
  }
  return out
}

// ---------- Gráfico de barras horizontales agrupadas (Costo vs Venta) ----------
function BarrasHorizontales({ rows }: { rows: { concepto: string; costo: number; venta: number }[] }) {
  const L = 206           // ancho columna de etiquetas (izquierda)
  const R = 132           // espacio derecho para el monto
  const W = 860
  const barH = 22, innerGap = 6, groupGap = 20, padT = 12, padB = 8
  const plotW = W - L - R
  const max = Math.max(1, ...rows.flatMap(r => [r.costo, r.venta]))
  const groupH = barH * 2 + innerGap + groupGap
  const H = padT + padB + rows.length * groupH
  const scale = (v: number) => (v / max) * plotW

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
      {/* líneas guía verticales (recesivas) */}
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={L + plotW * f} y1={padT} x2={L + plotW * f} y2={H - padB} stroke="#eef1f6" strokeWidth={1} />
      ))}
      <line x1={L} y1={padT} x2={L} y2={H - padB} stroke="#d1d5db" strokeWidth={1} />
      {rows.map((r, i) => {
        const color = conceptoColor[r.concepto] || '#6b7280'
        const gy = padT + i * groupH
        const wC = scale(r.costo), wV = scale(r.venta)
        return (
          <g key={r.concepto}>
            {/* etiqueta concepto */}
            <circle cx={10} cy={gy + barH + innerGap / 2} r={5} fill={color} />
            <text x={22} y={gy + barH + innerGap / 2 + 4} fontSize={12} fontWeight={800} fill="#0b1d4a">{conceptoLabel[r.concepto]}</text>
            {/* barra COSTO (tono claro) */}
            <rect x={L} y={gy} width={Math.max(wC, 1)} height={barH} rx={4} fill={color} fillOpacity={0.4} />
            <text x={L + 6} y={gy + barH - 7} fontSize={9.5} fontWeight={700} fill="#374151">COSTO</text>
            <text x={L + wC + 8} y={gy + barH - 6} fontSize={11.5} fontWeight={700} fill="#4b5563">{money(r.costo)}</text>
            {/* barra VENTA (sólido) */}
            <rect x={L} y={gy + barH + innerGap} width={Math.max(wV, 1)} height={barH} rx={4} fill={color} />
            <text x={L + 6} y={gy + barH + innerGap + barH - 7} fontSize={9.5} fontWeight={800} fill="#fff">VENTA</text>
            <text x={L + wV + 8} y={gy + barH + innerGap + barH - 6} fontSize={12} fontWeight={800} fill="#0b1d4a">{money(r.venta)}</text>
          </g>
        )
      })}
    </svg>
  )
}

// ---------- Reporte ----------
function ReporteResumen() {
  const params = useSearchParams()
  const ofertas = useOfertasStore(s => s.ofertas)
  const [mounted, setMounted] = useState(false)
  const [ofertaId, setOfertaId] = useState('')
  const [vista, setVista] = useState('todo')
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { const q = params.get('id'); if (q) setOfertaId(q) }, [params])
  useEffect(() => { useOfertasStore.getState().loadOfertas() }, [])

  const oferta = useMemo(() => ofertas.find(o => o.id === ofertaId) || null, [ofertas, ofertaId])
  useEffect(() => {
    if (oferta) document.title = `${oferta.consecutivo}${oferta.proyecto ? ' - ' + oferta.proyecto : ''}`
  }, [oferta])
  const titulos = useMemo(() => oferta ? (oferta.renglones || []).filter(r => r.tipo === 'T1') : [], [oferta])

  const rens = useMemo(() => {
    if (!oferta) return []
    const todos = oferta.renglones || []
    return vista === 'todo' ? todos : bloqueDeTitulo(todos, vista)
  }, [oferta, vista])

  const dets = useMemo(() => rens.filter(r => esDetalle(r.tipo)), [rens])

  // Agrupa renglones de detalle por descripción/unidad/concepto, sumando cantidades y montos.
  type Grupo = { descripcion: string; unidad: string; concepto: string; cantidad: number; costo: number; venta: number }
  const agrupa = (items: RenglonOferta[]): Grupo[] => {
    const m = new Map<string, Grupo>()
    for (const r of items) {
      const key = `${r.concepto}||${(r.descripcion || '').trim().toLowerCase()}||${(r.unidad || '').trim().toLowerCase()}`
      const cur = m.get(key) || { descripcion: r.descripcion || '—', unidad: r.unidad || '', concepto: r.concepto, cantidad: 0, costo: 0, venta: 0 }
      cur.cantidad += r.cantidad || 0
      cur.costo += costoTotal(r)
      cur.venta += montoVenta(r)
      m.set(key, cur)
    }
    return [...m.values()].sort((a, b) => b.costo - a.costo)
  }
  const materiales = useMemo(() => agrupa(dets.filter(r => r.concepto === 'Materiales')), [dets])
  const manoObra = useMemo(() => agrupa(dets.filter(r => r.concepto === 'MOD' || r.concepto === 'MOI')), [dets])
  const maquinaria = useMemo(() => agrupa(dets.filter(r => r.concepto === 'Maquinaria y Vehículos')), [dets])
  const totMat = useMemo(() => materiales.reduce((s, g) => ({ costo: s.costo + g.costo, venta: s.venta + g.venta }), { costo: 0, venta: 0 }), [materiales])
  const totMO = useMemo(() => manoObra.reduce((s, g) => ({ costo: s.costo + g.costo, venta: s.venta + g.venta }), { costo: 0, venta: 0 }), [manoObra])
  const totMOD = useMemo(() => manoObra.filter(g => g.concepto === 'MOD').reduce((s, g) => ({ costo: s.costo + g.costo, venta: s.venta + g.venta }), { costo: 0, venta: 0 }), [manoObra])
  const totMOI = useMemo(() => manoObra.filter(g => g.concepto === 'MOI').reduce((s, g) => ({ costo: s.costo + g.costo, venta: s.venta + g.venta }), { costo: 0, venta: 0 }), [manoObra])
  const totMaq = useMemo(() => maquinaria.reduce((s, g) => ({ costo: s.costo + g.costo, venta: s.venta + g.venta }), { costo: 0, venta: 0 }), [maquinaria])
  const subcontratos = useMemo(() => agrupa(dets.filter(r => r.concepto === 'Subcontrato')), [dets])
  const otros = useMemo(() => agrupa(dets.filter(r => r.concepto === 'Otro')), [dets])
  const totSub = useMemo(() => subcontratos.reduce((s, g) => ({ costo: s.costo + g.costo, venta: s.venta + g.venta }), { costo: 0, venta: 0 }), [subcontratos])
  const totOtro = useMemo(() => otros.reduce((s, g) => ({ costo: s.costo + g.costo, venta: s.venta + g.venta }), { costo: 0, venta: 0 }), [otros])

  const porConcepto = useMemo(() => {
    const m: Record<string, { costo: number; venta: number }> = {}
    dets.forEach(r => { const c = r.concepto || 'Otro'; if (!m[c]) m[c] = { costo: 0, venta: 0 }; m[c].costo += costoTotal(r); m[c].venta += montoVenta(r) })
    return m
  }, [dets])
  const rows = CONCEPTOS.filter(c => porConcepto[c]).map(c => ({ concepto: c, costo: porConcepto[c].costo, venta: porConcepto[c].venta }))
  const totCosto = rows.reduce((s, r) => s + r.costo, 0)
  const totVenta = rows.reduce((s, r) => s + r.venta, 0)
  const tituloSel = vista !== 'todo' ? (titulos.find(t => t.id === vista)?.descripcion || 'título') : ''

  // Impresión Safari-proof: clona la hoja en una ventana limpia y la imprime desde ahí.
  const printReport = () => {
    const el = document.querySelector('.sheet')
    if (!el) { window.print(); return }
    const w = window.open('', '_blank', 'width=900,height=1200')
    if (!w) { window.print(); return }
    const titulo = document.title || 'Reporte'
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${titulo}</title>
      <style>
        @page { size: A4 portrait; margin: 10mm; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
        html, body { margin: 0; background: #fff; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; }
        .sheet { max-width: none !important; width: 100% !important; box-shadow: none !important; margin: 0 !important; }
        table { width: 100%; border-collapse: collapse; }
        tr, thead, tfoot { break-inside: avoid; }
        svg { max-width: 100%; }
      </style></head><body>${el.outerHTML}</body></html>`)
    w.document.close()
    w.focus()
    setTimeout(() => { try { w.print() } catch { /* usuario cancela */ } }, 500)
  }

  if (!mounted) return <div style={{ padding: 40, fontFamily: 'system-ui' }}>Cargando…</div>

  return (
    <div className="po-root report-root" style={{ background: '#f3f4f6', minHeight: '100vh', padding: '18px 0', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as React.CSSProperties}><style dangerouslySetInnerHTML={{ __html: PRESUPUESTO_CSS }} />
      <style>{`
        @page { size: A4 portrait; margin: 10mm; }
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
        <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center', padding: 60, color: '#6b7280', fontFamily: 'system-ui' }}>Selecciona un proyecto para ver el gráfico resumen.</div>
      ) : (
        <div className="sheet" style={{ maxWidth: 820, margin: '0 auto', background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontFamily: 'system-ui', color: '#111827', fontSize: 12 }}>
          {/* Encabezado */}
          <div style={{ background: '#0b1d4a', color: '#fff', padding: '20px 26px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderTop: '5px solid #ea580c' }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: 3, fontWeight: 700, color: '#f6a96b' }}>GRUPO TAMOIN</div>
              <div style={{ fontSize: 22, fontWeight: 800, margin: '2px 0' }}>{oferta.proyecto || 'Proyecto'}</div>
              <div style={{ fontSize: 12, color: '#c7d7f5' }}>Resumen Costos vs Ventas por concepto {tituloSel ? `· ${tituloSel}` : '· Todo el proyecto'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>PROYECTO N° {oferta.consecutivo}</div>
              <div style={{ fontSize: 11, color: '#c7d7f5', marginTop: 4 }}>Fecha: {fechaHoy()}</div>
              <div style={{ fontSize: 11, color: '#c7d7f5' }}>Moneda: {oferta.moneda || '—'}</div>
            </div>
          </div>

          {/* Cliente / Proyecto */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
            {[['PROYECTO / CENTRO DE COSTO', oferta.proyecto || '—']].map(([k, v], i) => (
              <div key={i} style={{ flex: 1, padding: '12px 20px', borderLeft: i ? '1px solid #e5e7eb' : 'none' }}>
                <div style={{ fontSize: 10, letterSpacing: 1, color: '#9ca3af', fontWeight: 700 }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0b1d4a' }}>{v}</div>
              </div>
            ))}
          </div>

          {/* KPIs */}
          <div style={{ display: 'flex', gap: 10, padding: '16px 20px 8px' }}>
            {[
              { l: 'COSTO TOTAL', v: money(totCosto), bg: '#1f2d52' },
              { l: 'VENTA TOTAL', v: money(totVenta), bg: '#0b1d4a' },
              { l: 'UTILIDAD', v: money(totVenta - totCosto), bg: '#15803d' },
              { l: 'MARGEN S/COSTO', v: pct(totCosto, totVenta) + '%', bg: '#b45309' },
            ].map(k => (
              <div key={k.l} style={{ flex: 1, background: k.bg, color: '#fff', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 9.5, letterSpacing: 0.5, opacity: 0.85, fontWeight: 700 }}>{k.l}</div>
                <div style={{ fontSize: 19, fontWeight: 800, marginTop: 4 }}>{k.v}</div>
              </div>
            ))}
          </div>

          {/* Leyenda */}
          <div style={{ display: 'flex', gap: 22, padding: '4px 22px 0', fontSize: 12, color: '#374151', fontWeight: 600 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><span style={{ width: 22, height: 12, borderRadius: 3, background: '#0b1d4a', opacity: 0.4, display: 'inline-block' }} /> Barra clara = COSTO</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><span style={{ width: 22, height: 12, borderRadius: 3, background: '#0b1d4a', display: 'inline-block' }} /> Barra sólida = VENTA (precio)</span>
          </div>

          {/* Gráfico */}
          <div style={{ padding: '10px 18px 6px' }}>
            <div style={{ background: '#ea580c', color: '#fff', padding: '7px 12px', fontWeight: 800, fontSize: 12, borderRadius: '6px 6px 0 0' }}>COSTO vs VENTA POR CONCEPTO ({oferta.moneda || 'moneda'})</div>
            <div style={{ border: '1px solid #e5e7eb', borderTop: 'none', padding: '14px 10px', borderRadius: '0 0 6px 6px' }}>
              {rows.length ? <BarrasHorizontales rows={rows} /> : <div style={{ textAlign: 'center', color: '#9ca3af', padding: 30 }}>Sin renglones para graficar.</div>}
            </div>
          </div>

          {/* Tabla detalle (vista de datos / accesibilidad) */}
          <div style={{ padding: '8px 20px 4px' }}>
            <div style={{ background: '#0b1d4a', color: '#fff', padding: '7px 12px', fontWeight: 800, fontSize: 12, borderRadius: '6px 6px 0 0' }}>DETALLE COSTO · VENTA · UTILIDAD POR CONCEPTO</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
              <thead>
                <tr style={{ background: '#eef3ff', color: '#0b1d4a' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>CONCEPTO</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>COSTO</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>VENTA</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>UTILIDAD</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right' }}>MARGEN</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.concepto} style={{ borderBottom: '1px solid #eef1f6' }}>
                    <td style={{ padding: '6px 8px' }}><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 2, background: conceptoColor[r.concepto], marginRight: 7 }} />{conceptoLabel[r.concepto]}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: '#4b5563' }}>{money(r.costo)}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: '#0b1d4a' }}>{money(r.venta)}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: '#15803d', fontWeight: 700 }}>{money(r.venta - r.costo)}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: '#b45309', fontWeight: 700 }}>{pct(r.costo, r.venta)}%</td>
                  </tr>
                ))}
                <tr style={{ background: '#0b1d4a', color: '#fff', fontWeight: 800 }}>
                  <td style={{ padding: '7px 8px' }}>TOTAL</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right' }}>{money(totCosto)}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right' }}>{money(totVenta)}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right' }}>{money(totVenta - totCosto)}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right' }}>{pct(totCosto, totVenta)}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── Resumen detallado de MATERIALES ── */}
          <div style={{ padding: '8px 20px 4px', breakInside: 'avoid' } as React.CSSProperties}>
            <div style={{ background: '#7c3aed', color: '#fff', padding: '7px 12px', fontWeight: 800, fontSize: 12, borderRadius: '6px 6px 0 0' }}>
              RESUMEN DETALLADO DE MATERIALES REQUERIDOS ({materiales.length})
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#f3edff', color: '#4c1d95' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>MATERIAL</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', width: 52 }}>UND</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', width: 80 }}>CANTIDAD</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', width: 92 }}>COSTO UNIT</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', width: 100 }}>COSTO TOTAL</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', width: 100 }}>VENTA TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {materiales.length ? materiales.map((g, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eef1f6' }}>
                    <td style={{ padding: '5px 8px' }}>{g.descripcion}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'center', color: '#6b7280' }}>{g.unidad || '—'}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right' }}>{qty(g.cantidad)}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', color: '#4b5563' }}>{money2(g.cantidad ? g.costo / g.cantidad : 0)}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', color: '#4b5563' }}>{money(g.costo)}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: '#0b1d4a' }}>{money(g.venta)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} style={{ padding: 16, textAlign: 'center', color: '#9ca3af' }}>Esta oferta no tiene materiales registrados.</td></tr>
                )}
                {materiales.length > 0 && (
                  <tr style={{ background: '#4c1d95', color: '#fff', fontWeight: 800 }}>
                    <td style={{ padding: '7px 8px' }} colSpan={4}>TOTAL MATERIALES</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right' }}>{money(totMat.costo)}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right' }}>{money(totMat.venta)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Resumen detallado de MANO DE OBRA ── */}
          <div style={{ padding: '8px 20px 4px', breakInside: 'avoid' } as React.CSSProperties}>
            <div style={{ background: '#ea580c', color: '#fff', padding: '7px 12px', fontWeight: 800, fontSize: 12, borderRadius: '6px 6px 0 0' }}>
              RESUMEN DETALLADO DE MANO DE OBRA ({manoObra.length})
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#fff1e8', color: '#9a3412' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', width: 50 }}>TIPO</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>MANO DE OBRA</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', width: 52 }}>UND</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', width: 80 }}>CANTIDAD</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', width: 92 }}>COSTO UNIT</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', width: 100 }}>COSTO TOTAL</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', width: 100 }}>VENTA TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {manoObra.length ? manoObra.map((g, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eef1f6' }}>
                    <td style={{ padding: '5px 8px' }}>
                      <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 800, color: '#fff', background: conceptoColor[g.concepto] || '#6b7280' }}>{g.concepto}</span>
                    </td>
                    <td style={{ padding: '5px 8px' }}>{g.descripcion}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'center', color: '#6b7280' }}>{g.unidad || '—'}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right' }}>{qty(g.cantidad)}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', color: '#4b5563' }}>{money2(g.cantidad ? g.costo / g.cantidad : 0)}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', color: '#4b5563' }}>{money(g.costo)}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: '#0b1d4a' }}>{money(g.venta)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={7} style={{ padding: 16, textAlign: 'center', color: '#9ca3af' }}>Esta oferta no tiene mano de obra registrada.</td></tr>
                )}
                {totMOD.costo > 0 && (
                  <tr style={{ background: '#fff1e8', color: '#9a3412', fontWeight: 700 }}>
                    <td style={{ padding: '6px 8px' }} colSpan={5}>
                      <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 800, color: '#fff', background: conceptoColor['MOD'], marginRight: 7 }}>MOD</span>
                      Subtotal Mano de Obra Directa
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{money(totMOD.costo)}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{money(totMOD.venta)}</td>
                  </tr>
                )}
                {totMOI.costo > 0 && (
                  <tr style={{ background: '#eef6fb', color: '#0369a1', fontWeight: 700 }}>
                    <td style={{ padding: '6px 8px' }} colSpan={5}>
                      <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 800, color: '#fff', background: conceptoColor['MOI'], marginRight: 7 }}>MOI</span>
                      Subtotal Mano de Obra Indirecta
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{money(totMOI.costo)}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{money(totMOI.venta)}</td>
                  </tr>
                )}
                {manoObra.length > 0 && (
                  <tr style={{ background: '#9a3412', color: '#fff', fontWeight: 800 }}>
                    <td style={{ padding: '7px 8px' }} colSpan={5}>TOTAL MANO DE OBRA (MOD + MOI)</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right' }}>{money(totMO.costo)}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right' }}>{money(totMO.venta)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Resumen detallado de MAQUINARIA Y EQUIPOS ── */}
          <div style={{ padding: '8px 20px 4px', breakInside: 'avoid' } as React.CSSProperties}>
            <div style={{ background: '#16a34a', color: '#fff', padding: '7px 12px', fontWeight: 800, fontSize: 12, borderRadius: '6px 6px 0 0' }}>
              RESUMEN DETALLADO DE MAQUINARIA Y EQUIPOS ({maquinaria.length})
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#e9f9ee', color: '#14532d' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>MAQUINARIA / EQUIPO</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', width: 52 }}>UND</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', width: 80 }}>CANTIDAD</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', width: 92 }}>COSTO UNIT</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', width: 100 }}>COSTO TOTAL</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', width: 100 }}>VENTA TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {maquinaria.length ? maquinaria.map((g, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eef1f6' }}>
                    <td style={{ padding: '5px 8px' }}>{g.descripcion}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'center', color: '#6b7280' }}>{g.unidad || '—'}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right' }}>{qty(g.cantidad)}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', color: '#4b5563' }}>{money2(g.cantidad ? g.costo / g.cantidad : 0)}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', color: '#4b5563' }}>{money(g.costo)}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: '#0b1d4a' }}>{money(g.venta)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} style={{ padding: 16, textAlign: 'center', color: '#9ca3af' }}>Esta oferta no tiene maquinaria ni equipos registrados.</td></tr>
                )}
                {maquinaria.length > 0 && (
                  <tr style={{ background: '#14532d', color: '#fff', fontWeight: 800 }}>
                    <td style={{ padding: '7px 8px' }} colSpan={4}>TOTAL MAQUINARIA Y EQUIPOS</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right' }}>{money(totMaq.costo)}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right' }}>{money(totMaq.venta)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Resumen detallado de SUBCONTRATOS ── */}
          <div style={{ padding: '8px 20px 4px', breakInside: 'avoid' } as React.CSSProperties}>
            <div style={{ background: '#a16207', color: '#fff', padding: '7px 12px', fontWeight: 800, fontSize: 12, borderRadius: '6px 6px 0 0' }}>
              RESUMEN DETALLADO DE SUBCONTRATOS ({subcontratos.length})
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#fbf3e2', color: '#78350f' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>SUBCONTRATO</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', width: 52 }}>UND</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', width: 80 }}>CANTIDAD</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', width: 92 }}>COSTO UNIT</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', width: 100 }}>COSTO TOTAL</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', width: 100 }}>VENTA TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {subcontratos.length ? subcontratos.map((g, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eef1f6' }}>
                    <td style={{ padding: '5px 8px' }}>{g.descripcion}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'center', color: '#6b7280' }}>{g.unidad || '—'}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right' }}>{qty(g.cantidad)}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', color: '#4b5563' }}>{money2(g.cantidad ? g.costo / g.cantidad : 0)}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', color: '#4b5563' }}>{money(g.costo)}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: '#0b1d4a' }}>{money(g.venta)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} style={{ padding: 16, textAlign: 'center', color: '#9ca3af' }}>Esta oferta no tiene subcontratos registrados.</td></tr>
                )}
                {subcontratos.length > 0 && (
                  <tr style={{ background: '#78350f', color: '#fff', fontWeight: 800 }}>
                    <td style={{ padding: '7px 8px' }} colSpan={4}>TOTAL SUBCONTRATOS</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right' }}>{money(totSub.costo)}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right' }}>{money(totSub.venta)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Resumen detallado de OTROS ── */}
          <div style={{ padding: '8px 20px 4px', breakInside: 'avoid' } as React.CSSProperties}>
            <div style={{ background: '#6b7280', color: '#fff', padding: '7px 12px', fontWeight: 800, fontSize: 12, borderRadius: '6px 6px 0 0' }}>
              RESUMEN DETALLADO DE OTROS ({otros.length})
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#f1f2f4', color: '#374151' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>CONCEPTO</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', width: 52 }}>UND</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', width: 80 }}>CANTIDAD</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', width: 92 }}>COSTO UNIT</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', width: 100 }}>COSTO TOTAL</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', width: 100 }}>VENTA TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {otros.length ? otros.map((g, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eef1f6' }}>
                    <td style={{ padding: '5px 8px' }}>{g.descripcion}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'center', color: '#6b7280' }}>{g.unidad || '—'}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right' }}>{qty(g.cantidad)}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', color: '#4b5563' }}>{money2(g.cantidad ? g.costo / g.cantidad : 0)}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', color: '#4b5563' }}>{money(g.costo)}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: '#0b1d4a' }}>{money(g.venta)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} style={{ padding: 16, textAlign: 'center', color: '#9ca3af' }}>Esta oferta no tiene otros conceptos registrados.</td></tr>
                )}
                {otros.length > 0 && (
                  <tr style={{ background: '#374151', color: '#fff', fontWeight: 800 }}>
                    <td style={{ padding: '7px 8px' }} colSpan={4}>TOTAL OTROS</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right' }}>{money(totOtro.costo)}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right' }}>{money(totOtro.venta)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '6px 20px 20px', fontSize: 9.5, color: '#9ca3af', lineHeight: 1.5 }}>
            <b>Cómo se lee:</b> por cada concepto, la barra clara es el <b>Costo</b> y la barra sólida es la <b>Venta</b> (precio con margen). Utilidad = Venta − Costo · Margen = Utilidad / Costo. Totales — Costo {money(totCosto)} · Venta {money(totVenta)} · Utilidad {money(totVenta - totCosto)} ({pct(totCosto, totVenta)}%).
            <div style={{ marginTop: 6, color: '#c0c4cc' }}>Grupo Tamoin · Sistema de Ofertas · Oferta {oferta.consecutivo} · Generado el {fechaHoy()}.</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ReporteResumenGraficoPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, fontFamily: 'system-ui' }}>Cargando…</div>}>
      <ReporteResumen />
    </Suspense>
  )
}
