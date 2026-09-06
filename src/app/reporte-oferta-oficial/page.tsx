'use client'

import { Fragment, Suspense, useEffect, useMemo, useState } from 'react'
import { PRESUPUESTO_CSS } from '@/shared/lib/presupuesto-css'
import { useSearchParams } from 'next/navigation'
import { useOfertasStore } from '@/features/ofertas/store/ofertas-store'
import { type RenglonOferta, esDetalle, precioUnit, montoVenta } from '@/features/ofertas/types'
import { simboloMoneda } from '@/shared/lib/paises'

// ---------- helpers ----------
let SIM_R = 'S/'   // símbolo de moneda según el país de la oferta (se fija al cargar)
const money = (n: number) => SIM_R + ' ' + Math.round(n || 0).toLocaleString('en-US')
const fecha = (iso: string) => { if (!iso) return '—'; const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}` }
const fechaHoy = () => { const d = new Date(); const p = (n: number) => String(n).padStart(2, '0'); return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}` }

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
const bloqueDeTitulo = (rens: RenglonOferta[], tituloId: string): RenglonOferta[] => {
  const out: RenglonOferta[] = []
  let cap = false
  for (const r of rens) {
    if (r.tipo === 'T1') { if (r.id === tituloId) { cap = true; out.push(r); continue } if (cap) break; cap = false }
    else if (cap) out.push(r)
  }
  return out
}

function Oficial() {
  const params = useSearchParams()
  const ofertas = useOfertasStore(s => s.ofertas)
  const [mounted, setMounted] = useState(false)
  const [ofertaId, setOfertaId] = useState('')
  const [vista, setVista] = useState('todo')
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { const q = params.get('id'); if (q) setOfertaId(q) }, [params])
  // Traer las ofertas frescas del servidor (esta página no tiene ServerSyncProvider)
  useEffect(() => { useOfertasStore.getState().loadOfertas() }, [])

  const oferta = useMemo(() => ofertas.find(o => o.id === ofertaId) || null, [ofertas, ofertaId])
  SIM_R = simboloMoneda(oferta?.pais)
  // Nombre del documento = Proyecto → el PDF se guarda con ese nombre
  useEffect(() => {
    if (oferta) document.title = `${oferta.consecutivo}${oferta.proyecto ? ' - ' + oferta.proyecto : ''}`
  }, [oferta])
  const titulos = useMemo(() => oferta ? (oferta.renglones || []).filter(r => r.tipo === 'T1') : [], [oferta])
  const rens = useMemo(() => {
    if (!oferta) return []
    const todos = oferta.renglones || []
    return vista === 'todo' ? todos : bloqueDeTitulo(todos, vista)
  }, [oferta, vista])

  const acts = useMemo(() => agruparActividades(rens).map(g => {
    const dets = g.rows.filter(r => esDetalle(r.tipo))
    return { titulo: g.titulo, subtitulos: g.rows.filter(r => r.tipo === 'T2'), dets, subtotal: dets.reduce((s, r) => s + montoVenta(r), 0) }
  }), [rens])

  const totVenta = useMemo(() => rens.filter(r => esDetalle(r.tipo)).reduce((s, r) => s + montoVenta(r), 0), [rens])
  const impuesto = totVenta * ((oferta?.pct_impuesto || 0) / 100)
  const tituloSel = vista !== 'todo' ? (titulos.find(t => t.id === vista)?.descripcion || 'título') : ''

  // Impresión Safari-proof: clona la hoja en una ventana limpia y la imprime desde ahí.
  // (Safari a veces guarda en blanco al imprimir la SPA directamente.)
  const printReport = () => {
    const el = document.querySelector('.sheet')
    if (!el) { window.print(); return }
    const w = window.open('', '_blank', 'width=900,height=1200')
    if (!w) { window.print(); return }
    const titulo = document.title || 'Reporte'
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${titulo}</title>
      <style>
        @page { size: A4 portrait; margin: 12mm; }
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
        @page { size: A4 portrait; margin: 12mm; }
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
        <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center', padding: 60, color: '#6b7280', fontFamily: 'system-ui' }}>Selecciona un proyecto para generar el presupuesto oficial.</div>
      ) : (
        <div className="sheet" style={{ maxWidth: 820, margin: '0 auto', background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontFamily: 'system-ui', color: '#111827', fontSize: 12 }}>
          {/* Encabezado */}
          <div style={{ background: '#0b1d4a', color: '#fff', padding: '22px 26px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderTop: '5px solid #ea580c' }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: 3, fontWeight: 700, color: '#f6a96b' }}>GRUPO TAMOIN · OFERTA PARA EL CLIENTE</div>
              <div style={{ fontSize: 24, fontWeight: 800, margin: '2px 0' }}>{oferta.proyecto || 'Presupuesto de Obra'}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#ffd9a8', letterSpacing: 1 }}>OFERTA PARA EL CLIENTE</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 800 }}>PROYECTO N° {oferta.consecutivo}</div>
              <div style={{ fontSize: 11, color: '#c7d7f5', marginTop: 6 }}>Fecha: {fechaHoy()}</div>
              <div style={{ fontSize: 11, color: '#c7d7f5' }}>Moneda: {oferta.moneda || '—'}</div>
              {oferta.situacion && <div style={{ fontSize: 11, color: '#c7d7f5' }}>Situación: {oferta.situacion}</div>}
            </div>
          </div>

          {/* Cabecera: Proyecto, Fecha de emisión, Cliente */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
            {[['PROYECTO', oferta.proyecto || '—'], ['FECHA DE EMISIÓN', fecha(oferta.fecha_emision)]].map(([k, v], i) => (
              <div key={i} style={{ flex: i === 1 ? '0 0 170px' : 1, padding: '13px 20px', borderLeft: i ? '1px solid #e5e7eb' : 'none' }}>
                <div style={{ fontSize: 10, letterSpacing: 1, color: '#9ca3af', fontWeight: 700 }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0b1d4a' }}>{v}</div>
              </div>
            ))}
          </div>
          {/* Alcance */}
          <div style={{ padding: '13px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: 10, letterSpacing: 1, color: '#9ca3af', fontWeight: 700, marginBottom: 3 }}>ALCANCE DEL PROYECTO</div>
            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{oferta.alcance || '—'}</div>
          </div>

          {/* Tabla oficial: Concepto · Cantidad · Precio Unit · Subtotal */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
            <thead>
              <tr style={{ background: '#0b1d4a', color: '#fff' }}>
                <th style={{ padding: '9px 8px', textAlign: 'left', width: 54 }}>ÍTEM</th>
                <th style={{ padding: '9px 8px', textAlign: 'left' }}>CONCEPTO / DESCRIPCIÓN</th>
                <th style={{ padding: '9px 8px', textAlign: 'center', width: 52 }}>UND</th>
                <th style={{ padding: '9px 8px', textAlign: 'right', width: 74 }}>CANTIDAD</th>
                <th style={{ padding: '9px 8px', textAlign: 'right', width: 118 }}>PRECIO UNIT.</th>
                <th style={{ padding: '9px 8px', textAlign: 'right', width: 130 }}>SUBTOTAL</th>
              </tr>
            </thead>
            <tbody>
              {acts.map((act, ai) => (
                <Fragment key={act.titulo?.id || 'g' + ai}>
                  {act.titulo && (
                    <tr style={{ background: '#1e3a8a', color: '#fff' }}>
                      <td colSpan={6} style={{ padding: '7px 8px', fontWeight: 800, fontSize: 11.5, letterSpacing: 0.3 }}>{numAct(ai, act.titulo)} · {(act.titulo.descripcion || 'ACTIVIDAD').toUpperCase()}</td>
                    </tr>
                  )}
                  {act.subtitulos.map(st => (
                    <tr key={st.id} style={{ background: '#eef3ff' }}>
                      <td colSpan={6} style={{ padding: '4px 8px 4px 18px', fontWeight: 700, fontSize: 11, color: '#0b1d4a', fontStyle: 'italic' }}>{st.descripcion}</td>
                    </tr>
                  ))}
                  {act.dets.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f2f5' }}>
                      <td style={{ padding: '6px 8px', color: '#6b7280', fontWeight: 600, whiteSpace: 'nowrap' }}>{r.codigo}</td>
                      <td style={{ padding: '6px 8px' }}>{r.descripcion || '—'}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', color: '#6b7280' }}>{r.unidad || '—'}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{(r.cantidad || 0).toLocaleString('en-US')}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{money(precioUnit(r))}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: '#0b1d4a', whiteSpace: 'nowrap' }}>{money(montoVenta(r))}</td>
                    </tr>
                  ))}
                  {act.titulo && (
                    <tr style={{ background: '#f0f3fa', borderTop: '2px solid #1e3a8a', borderBottom: '2px solid #1e3a8a' }}>
                      <td colSpan={5} style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 800, color: '#0b1d4a' }}>SUBTOTAL {numAct(ai, act.titulo)} · {act.titulo.descripcion || ''}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 800, color: '#0b1d4a', whiteSpace: 'nowrap' }}>{money(act.subtotal)}</td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {acts.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 28, textAlign: 'center', color: '#9ca3af' }}>
                    Esta oferta aún no tiene renglones cargados. Agrégalos en <b>Presupuesto Ofertas</b>.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f5f7fb' }}>
                <td colSpan={5} style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: '#374151' }}>SUBTOTAL{tituloSel ? ` «${tituloSel}»` : ''}</td>
                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>{money(totVenta)}</td>
              </tr>
              {oferta.pct_impuesto ? (
                <tr style={{ background: '#f5f7fb' }}>
                  <td colSpan={5} style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: '#374151' }}>IMPUESTO ({oferta.pct_impuesto}%)</td>
                  <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>{money(impuesto)}</td>
                </tr>
              ) : null}
              <tr style={{ background: '#ea580c', color: '#fff' }}>
                <td colSpan={5} style={{ padding: '11px 8px', textAlign: 'right', fontWeight: 800, fontSize: 14 }}>VALOR TOTAL DEL PROYECTO{oferta.moneda ? ` (${oferta.moneda})` : ''}</td>
                <td style={{ padding: '11px 8px', textAlign: 'right', fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap' }}>{money(totVenta + impuesto)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Observaciones / pie / firmas — bloque que no se debe partir entre páginas */}
          <div style={{ padding: '12px 20px 6px', breakInside: 'avoid', pageBreakInside: 'avoid' } as React.CSSProperties}>
            {oferta.observaciones && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, letterSpacing: 1, color: '#9ca3af', fontWeight: 700, marginBottom: 3 }}>OBSERVACIONES</div>
                <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{oferta.observaciones}</div>
              </div>
            )}
            <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.55, borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
              Los precios están expresados en {oferta.moneda || 'la moneda indicada'} e incluyen mano de obra, materiales y equipos según el alcance descrito.
              {oferta.pct_impuesto ? ` El valor total incluye impuesto del ${oferta.pct_impuesto}%.` : ''} Oferta válida sujeta a las condiciones comerciales acordadas.
            </div>
            {/* Firma */}
            <div style={{ display: 'flex', gap: 40, padding: '26px 6px 10px' }}>
              {['Elaborado por', 'Aceptado por (Cliente)'].map(l => (
                <div key={l} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ borderTop: '1px solid #9ca3af', paddingTop: 6, fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 9.5, color: '#c0c4cc' }}>Grupo Tamoin · Oferta {oferta.consecutivo} · Emitida {fecha(oferta.fecha_emision)} · Documento generado el {fechaHoy()}.</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ReporteOfertaOficialPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, fontFamily: 'system-ui' }}>Cargando…</div>}>
      <Oficial />
    </Suspense>
  )
}
