export function fmtMoney(n: number) {
  // Montos sin decimales, con separador de miles (ej. 1,234,567)
  return Math.round(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function monedaSimbolo(tipo?: string): string {
  switch (tipo?.toLowerCase()) {
    case 'dólares':
    case 'usd':
    case 'us$':
      return '$'
    case 'euros':
    case 'eur':
    case '€':
      return '€'
    case 'pesos colombianos':
    case 'cop':
      return '$'
    default:
      return '$'
  }
}
