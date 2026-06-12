'use client'
import { useEffect, useState } from 'react'
import { fmtMoney } from '@/shared/lib/format-number'

// Formatea mientras se escribe: "," para miles, "." para decimales (máx 2).
function formatTyping(raw: string): string {
  let s = raw.replace(/[^\d.]/g, '')
  const i = s.indexOf('.')
  if (i !== -1) s = s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, '') // un solo punto
  const [intp, decp] = s.split('.')
  const intFmt = intp ? Number(intp).toLocaleString('en-US') : ''
  if (s.includes('.')) return `${intFmt || '0'}.${(decp || '').slice(0, 2)}`
  return intFmt
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
