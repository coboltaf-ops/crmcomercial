export function fmtMoney(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
