import * as XLSX from 'xlsx'

export interface PartidaImport {
  codigo: string
  item: string
  unidad: string
  cantidad: number
  valor_unitario: number
  total_presupuesto: number
}

const toNum = (v: unknown): number => {
  if (typeof v === 'number') return isFinite(v) ? v : 0
  const n = parseFloat(String(v ?? '').replace(/[^0-9.\-]/g, ''))
  return isNaN(n) ? 0 : n
}

const norm = (v: unknown) => String(v ?? '').trim().toLowerCase()

// Código WBS válido: 1 · 1.1 · 1.1.1 · 1.2. (admite punto final)
const esCodigoWBS = (c: string) => /^\d+(\.\d+)*\.?$/.test(String(c).trim())

/**
 * Lee un Excel de control de obra (formato Norton CLE) y extrae el WBS con
 * presupuesto. Busca, en cualquier hoja, la fila de encabezados que tenga
 * "Código" + "ITEM" y mapea las columnas por nombre (tolerante a posición).
 * Devuelve solo filas cuyo código sea jerárquico (1, 1.1, 1.1.1…).
 */
export function parseWbsFromArrayBuffer(buf: ArrayBuffer): { partidas: PartidaImport[]; hoja: string } {
  const wb = XLSX.read(buf, { type: 'array' })
  for (const hoja of wb.SheetNames) {
    const ws = wb.Sheets[hoja]
    if (!ws) continue
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false, defval: '' })

    // localizar la fila de encabezados
    let hIdx = -1
    const col = { codigo: -1, item: -1, cantidad: -1, unidad: -1, vu: -1, total: -1 }
    for (let i = 0; i < rows.length; i++) {
      const r = (rows[i] || []).map(norm)
      const ci = r.findIndex(x => x === 'código' || x === 'codigo')
      const ii = r.findIndex(x => x === 'item')
      if (ci >= 0 && ii >= 0) {
        hIdx = i
        col.codigo = ci
        col.item = ii
        col.cantidad = r.findIndex(x => x.startsWith('cantidad'))
        col.unidad = r.findIndex(x => x.includes('unidad'))
        col.vu = r.findIndex(x => x.includes('valor unitario'))
        col.total = r.findIndex(x => x.includes('total presupuesto'))
        break
      }
    }
    if (hIdx < 0) continue

    const partidas: PartidaImport[] = []
    for (let i = hIdx + 1; i < rows.length; i++) {
      const r = rows[i] || []
      const codigo = String(r[col.codigo] ?? '').trim()
      const item = String(r[col.item] ?? '').trim()
      if (!codigo || !item || !esCodigoWBS(codigo)) continue
      const cantidad = col.cantidad >= 0 ? toNum(r[col.cantidad]) : 0
      const valor_unitario = col.vu >= 0 ? toNum(r[col.vu]) : 0
      let total = col.total >= 0 ? toNum(r[col.total]) : 0
      if (!total && cantidad && valor_unitario) total = cantidad * valor_unitario
      partidas.push({
        codigo: codigo.replace(/\.+$/, ''),
        item,
        unidad: col.unidad >= 0 ? String(r[col.unidad] ?? '').trim() : '',
        cantidad,
        valor_unitario,
        total_presupuesto: total,
      })
    }
    if (partidas.length) return { partidas, hoja }
  }
  return { partidas: [], hoja: '' }
}
