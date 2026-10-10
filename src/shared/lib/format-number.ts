// Formato de números multipaís (fuente de verdad: paises.ts).
//   Colombia → es-CO → 1.000.000,50 (punto miles, coma decimal)
//   Perú     → es-PE → 1,000,000.50 (coma miles, punto decimal)
//   Ecuador  → es-EC → 1.000.000,50
//
// Cada página fija el locale una vez por render con setMonedaLocale(paisUsuario)
// (mismo patrón que el símbolo de moneda). Los helpers leen ese locale activo.
import { localeMoneda } from './paises'

let _locale = 'es-CO' // default = país del CRM (se reemplaza en cada página)

/** Fija el locale de formato según el país del usuario/vista. Llamar en el render. */
export function setMonedaLocale(pais: string | undefined | null) {
  _locale = localeMoneda(pais)
}
/** Locale de formato actualmente activo. */
export function getMonedaLocale() {
  return _locale
}

export function fmtMoney(n: number) {
  // Montos sin decimales, con separador de miles según el país activo (ej. 1.234.567 / 1,234,567)
  return Math.round(n || 0).toLocaleString(_locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

/** Entero (cantidades/unidades) con separador de miles según el país activo. */
export function fmtInt(n: number) {
  return (n || 0).toLocaleString(_locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
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
