'use client'
import { useEffect, useState } from 'react'
import { fmtMoney } from '@/shared/lib/format-number'

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
  const [text, setText] = useState(value ? fmtMoney(value) : '')

  // Cuando no se está editando, refleja el valor externo ya formateado.
  useEffect(() => {
    if (!focused) setText(value ? fmtMoney(value) : '')
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
      onBlur={() => { setFocused(false); setText(value ? fmtMoney(value) : '') }}
      onChange={e => {
        const formatted = formatTyping(e.target.value)
        setText(formatted)
        const n = parseFloat(formatted.replace(/,/g, ''))
        onChange(isNaN(n) ? 0 : n)
      }}
    />
  )
}
