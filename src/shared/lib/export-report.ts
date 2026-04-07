import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

type ReportColumn = { header: string; key: string; width?: number }
type ReportOptions = {
  title: string; subtitle?: string; columns: ReportColumn[]
  rows: Record<string, string | number>[]; filename?: string
}

export function exportToPDF(opts: ReportOptions) {
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFillColor(30, 27, 75)
  doc.rect(0, 0, 297, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.text(opts.title, 14, 14)
  if (opts.subtitle) { doc.setFontSize(10); doc.text(opts.subtitle, 14, 22) }
  doc.setTextColor(0, 0, 0)

  autoTable(doc, {
    startY: 34,
    head: [opts.columns.map(c => c.header)],
    body: opts.rows.map(r => opts.columns.map(c => String(r[c.key] ?? ''))),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [30, 27, 75], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  })

  doc.save(`${opts.filename || opts.title}.pdf`)
}

export function exportToExcel(opts: ReportOptions) {
  const headers = opts.columns.map(c => c.header)
  const data = opts.rows.map(r => opts.columns.map(c => r[c.key] ?? ''))
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte')
  XLSX.writeFile(wb, `${opts.filename || opts.title}.xlsx`)
}

export function printReport(opts: ReportOptions) {
  const rows = opts.rows.map((r, i) => `<tr style="background:${i % 2 === 0 ? '#f9fafb' : '#fff'}">${opts.columns.map(c => `<td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:12px">${r[c.key] ?? ''}</td>`).join('')}</tr>`).join('')
  const html = `<!DOCTYPE html><html><head><title>${opts.title}</title></head><body style="font-family:Arial;padding:20px">
    <h2 style="color:#1e1b4b">${opts.title}</h2>${opts.subtitle ? `<p style="color:#6b7280">${opts.subtitle}</p>` : ''}
    <table style="width:100%;border-collapse:collapse;margin-top:16px">
      <thead><tr>${opts.columns.map(c => `<th style="padding:8px 10px;background:#1e1b4b;color:#fff;font-size:11px;text-align:left">${c.header}</th>`).join('')}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin-top:16px;font-size:11px;color:#9ca3af">${opts.rows.length} registros | Generado: ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</p>
    <script>window.onload=()=>window.print()<\/script></body></html>`
  const win = window.open('', '_blank')
  if (win) { win.document.write(html); win.document.close() }
}
