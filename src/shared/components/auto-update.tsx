'use client'
import { useEffect, useRef } from 'react'

/**
 * Auto-actualización: cuando se publica una versión nueva del CRM, recarga
 * la página automáticamente (sin necesidad de Cmd+Shift+R).
 * Compara la versión del servidor con la que se cargó al abrir.
 */
export default function AutoUpdate() {
  const cargada = useRef<string | null>(null)

  useEffect(() => {
    let cancelado = false

    const revisar = async () => {
      try {
        const res = await fetch('/api/version', { cache: 'no-store' })
        if (!res.ok) return
        const { v } = await res.json()
        if (cancelado || !v) return
        if (cargada.current === null) {
          cargada.current = v // primera carga: guarda la versión actual
          return
        }
        if (v !== cargada.current) {
          // Hay versión nueva publicada → recargar para tomarla
          cargada.current = v
          window.location.reload()
        }
      } catch {
        /* sin conexión o error: ignorar */
      }
    }

    revisar()
    const onFocus = () => revisar()
    window.addEventListener('focus', onFocus)
    const id = setInterval(revisar, 60000) // cada 1 minuto

    return () => {
      cancelado = true
      window.removeEventListener('focus', onFocus)
      clearInterval(id)
    }
  }, [])

  return null
}
