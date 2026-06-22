'use client'
import { useEffect, useState } from 'react'

/**
 * Campo numérico que SÍ permite escribir decimales (ej. 0.92, 115.50).
 * Guarda un número; al salir del campo lo muestra con N decimales.
 */
export default function DecimalInput({
  value,
  onChange,
  decimals = 2,
  style,
  placeholder,
}: {
  value: number
  onChange: (n: number) => void
  decimals?: number
  style?: React.CSSProperties
  placeholder?: string
}) {
  const [focused, setFocused] = useState(false)
  const [text, setText] = useState(value ? String(value) : '')

  useEffect(() => {
    if (!focused) setText(value ? value.toFixed(decimals) : '')
  }, [value, focused, decimals])

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      placeholder={placeholder}
      style={style}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false)
        const n = parseFloat(text)
        setText(isNaN(n) ? '' : n.toFixed(decimals))
      }}
      onChange={e => {
        // permitir solo dígitos y un punto decimal
        let v = e.target.value.replace(/[^\d.]/g, '')
        const i = v.indexOf('.')
        if (i !== -1) v = v.slice(0, i + 1) + v.slice(i + 1).replace(/\./g, '')
        setText(v)
        const n = parseFloat(v)
        onChange(isNaN(n) ? 0 : n)
      }}
    />
  )
}
