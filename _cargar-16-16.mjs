// Carga la obra REAL "16-16" (Norton) al módulo Control de Proyectos, extrayendo
// WBS + cortes (Curva S) + finanzas desde docs/5396-CLE16-Control.xlsx
//
//   node _cargar-16-16.mjs           → DRY RUN (solo muestra qué cargaría, NO escribe)
//   node _cargar-16-16.mjs --write   → escribe en KV (tabla control-proyectos-datos)
//
// La tabla control-proyectos-datos está AISLADA: no afecta ningún otro módulo.
import fs from 'fs'
import XLSX from 'xlsx'
import { randomUUID } from 'crypto'

const WRITE = process.argv.includes('--write')
const FILE = 'docs/5396-CLE16-Control.xlsx'
const wb = XLSX.readFile(FILE)

// ── WBS ──
const toNum = v => { if (typeof v === 'number') return isFinite(v) ? v : 0; const n = parseFloat(String(v ?? '').replace(/[^0-9.\-]/g, '')); return isNaN(n) ? 0 : n }
const esCod = c => /^\d+(\.\d+)*\.?$/.test(String(c).trim())
function parseWBS() {
  for (const hoja of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[hoja], { header: 1, blankrows: false, defval: '' })
    let h = -1, col = {}
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i].map(x => String(x).trim().toLowerCase())
      const ci = r.findIndex(x => x === 'código' || x === 'codigo'), ii = r.findIndex(x => x === 'item')
      if (ci >= 0 && ii >= 0) { h = i; col = { codigo: ci, item: ii, cant: r.findIndex(x => x.startsWith('cantidad')), uni: r.findIndex(x => x.includes('unidad')), vu: r.findIndex(x => x.includes('valor unitario')), tot: r.findIndex(x => x.includes('total presupuesto')) }; break }
    }
    if (h < 0) continue
    const P = []
    for (let i = h + 1; i < rows.length; i++) {
      const r = rows[i]; const codigo = String(r[col.codigo] ?? '').trim(); const item = String(r[col.item] ?? '').trim()
      if (!codigo || !item || !esCod(codigo)) continue
      const cant = col.cant >= 0 ? toNum(r[col.cant]) : 0, vu = col.vu >= 0 ? toNum(r[col.vu]) : 0
      let tot = col.tot >= 0 ? toNum(r[col.tot]) : 0; if (!tot && cant && vu) tot = cant * vu
      P.push({ id: randomUUID(), codigo: codigo.replace(/\.+$/, ''), item, unidad: col.uni >= 0 ? String(r[col.uni] ?? '').trim() : '', cantidad: cant, valor_unitario: vu, total_presupuesto: tot })
    }
    if (P.length) return P
  }
  return []
}

// ── Cortes desde hoja CURVA S (Mes[1] Semana[3] Capítulos[4] Plan%[6] Hito[7] Real%[11]) ──
function parseCortes() {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets['CURVA S'], { header: 1, blankrows: false, defval: '' })
  const C = []
  for (const r of rows) {
    const sem = r[3]
    if (typeof sem !== 'number' || sem < 1) continue
    // Plan = "Curva S inicial" (col6). Llega a 100% en sem 12 y de ahí la celda
    // queda vacía → mantenemos 100%. Real = col11 (%acumulado real).
    const planRaw = String(r[6] ?? '').trim()
    const pct_plan = planRaw === '' ? 100 : Math.min(Math.round(toNum(r[6]) * 100 * 10) / 10, 100)
    C.push({
      id: randomUUID(),
      periodo: 'Sem ' + sem + (r[1] ? ' (' + String(r[1]).trim() + ')' : ''),
      fecha: '',
      pct_plan,
      pct_real: Math.round((toNum(r[11]) * 100) * 10) / 10,
      nota: String(r[7] ?? '').trim() || String(r[4] ?? '').trim(),
    })
  }
  return C
}

const partidas = parseWBS()
const cortes = parseCortes()

// ── Finanzas (snapshot del Resumen de la obra) ──
const presupuesto = 2670127485
const proyecto = {
  id: randomUUID(),
  codigo: 'CTP-0001',
  fecha_registro: '2026-09-10',
  nombre_proyecto: 'Edificio Industrial CLE 16-16',
  codigo_proyecto: '16-16',
  cliente_id: '',
  cliente_nombre: 'NORTON EDIFICIOS INDUSTRIALES COLOMBIA SAS',
  descripcion: 'Estructura metálica — obra 16-16. Proyecto DEMO cargado desde el Excel real de control de obra.',
  responsable: '',
  tipo_contrato: 'Precio Fijo',
  presupuesto_base: presupuesto,
  tipo_moneda: 'Pesos Colombianos',
  fecha_inicio_plan: '2026-05-01',
  fecha_fin_plan: '2026-10-31',
  fecha_inicio_real: '2026-05-01',
  frecuencia_corte: 'Semanal',
  costo_presupuestado: Math.round(presupuesto * 0.91),
  valor_proyectado: 2791884020,
  costo_proyectado: Math.round(2791884020 * 0.95),
  ingresos_real: 1102160154,
  egresos_real: 1149676252,
  facturado_acum: 1102160154,
  cartera_0_30: 0, cartera_31_60: 0, cartera_60mas: 0,
  situacion: 'En Ejecución',
  pais: 'Colombia',
  partidas,
  cortes,
  seguimientos: [],
  creado_por: 'Carga demo (Excel 16-16)', creado_por_usuario: 'sistema', creado_en: '2026-09-10',
}

const u = cortes[cortes.length - 1]
console.log('=== EXTRACCIÓN OBRA 16-16 ===')
console.log('Partidas (WBS):', partidas.length)
console.log('Cortes (Curva S):', cortes.length, u ? `→ último: ${u.periodo}  plan ${u.pct_plan}%  real ${u.pct_real}%` : '')
console.log('Presupuesto base:', presupuesto.toLocaleString('es-CO'))
console.log('Margen real a hoy:', (proyecto.ingresos_real - proyecto.egresos_real).toLocaleString('es-CO'))
console.log('Modo:', WRITE ? 'ESCRITURA EN KV' : 'DRY RUN (no escribe)')

if (WRITE) {
  const env = fs.readFileSync('.env.production.local', 'utf-8')
  for (const line of env.split('\n')) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m) { let v = m[2].trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); process.env[m[1]] = v } }
  const { kv } = await import('@vercel/kv')
  const actual = (await kv.get('control-proyectos-datos')) || []
  console.log('Registros actuales en KV:', Array.isArray(actual) ? actual.length : 0)
  await kv.set('control-proyectos-datos', [proyecto])
  console.log('✅ Escrito: 1 proyecto (16-16) en control-proyectos-datos')
}
