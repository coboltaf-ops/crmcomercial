'use client'
import { useEffect, useState } from 'react'

// Este input editable está acoplado a un parser en-US (coma miles: replace(/,/g,'')).
// Su display DEBE quedarse en 'en-US'; localizarlo (p. ej. es-CO con punto miles)
// desincronizaría el texto mostrado con el parseo y corrompería el dato.
const fmtEnUS = (n: number) => Math.round(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

// Formatea mientras se escribe: "," para miles, SIN decimales (montos enteros).
function formatTyping(raw: string): string {
  const s = raw.replace(/[^\d]/g, '') // solo dígitos
  return s ? Number(s).toLocaleString('en-US') : ''
}

/**
 * Campo de monto con separador de miles (,) y decimales (.).
 * Guarda un número; muestra el valor formateado. Respeta fieldset disabled.
 */
export default function MoneyInput({
  value,
  onChange,
  style,
  placeholder,
  required,
}: {
  value: number
  onChange: (n: number) => void
  style?: React.CSSProperties
  placeholder?: string
  required?: boolean
}) {
  const [focused, setFocused] = useState(false)
  const [text, setText] = useState(value ? fmtEnUS(value) : '')

  // Cuando no se está editando, refleja el valor externo ya formateado.
  useEffect(() => {
    if (!focused) setText(value ? fmtEnUS(value) : '')
  }, [value, focused])

  return (
    <input
      type="text"
      inputMode="decimal"
      required={required}
      value={text}
      placeholder={placeholder}
      style={style}
      onFocus={() => setFocused(true)}
      onBlur={() => { setFocused(false); setText(value ? fmtEnUS(value) : '') }}
      onChange={e => {
        const formatted = formatTyping(e.target.value)
        setText(formatted)
        const n = parseFloat(formatted.replace(/,/g, ''))
        onChange(isNaN(n) ? 0 : n)
      }}
    />
  )
}
