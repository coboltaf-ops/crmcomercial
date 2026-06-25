export function fmtMoney(n: number) {
  // Montos sin decimales, con separador de miles (ej. 1,234,567)
  return Math.round(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// Prefijo de moneda que va ANTES del valor (ej. "COP 1,000.00", "US$ 50.00", "Euro 30.00").
export function monedaSimbolo(tipo?: string): string {
  switch ((tipo || '').toLowerCase()) {
    case 'dólares':
    case 'dolares':
    case 'dólar':
    case 'dolar':
    case 'usd':
    case 'us$':
      return 'US$ '
    case 'euros':
    case 'euro':
    case 'eur':
    case '€':
      return 'Euro '
    case 'pesos colombianos':
    case 'pesos':
    case 'peso':
    case 'cop':
    case '$':
      return 'COP '
    default:
      return 'COP '
  }
}
