export function fmtMoney(n?: number | null) {
  if (n === undefined || n === null) return '0.00'
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function monedaSimbolo(tipo?: string): string {
  const t = (tipo || '').toLowerCase().trim()
  if (t.includes('euro')) return '€'
  if (t.includes('dólar') || t.includes('dolar') || t.includes('usd')) return 'US$'
  return '$'
}
