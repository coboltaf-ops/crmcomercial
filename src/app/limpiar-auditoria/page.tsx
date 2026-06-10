'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LimpiarAuditoriaPage() {
  const router = useRouter()
  const [paso, setPaso] = useState<'seleccionar' | 'procesando'>('seleccionar')
  const [opcion, setOpcion] = useState<'todo' | 'rango'>('todo')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFinal, setFechaFinal] = useState('')

  const procesarBorrado = async () => {
    if (opcion === 'rango' && (!fechaInicio || !fechaFinal)) {
      alert('❌ Por favor selecciona fecha inicial y final')
      return
    }

    const confirmacion = opcion === 'todo'
      ? '⚠️ ¿Borrar TODA la auditoría? No se puede deshacer.'
      : `⚠️ ¿Borrar registros del ${fechaInicio} al ${fechaFinal}? No se puede deshacer.`

    if (!confirm(confirmacion)) {
      return
    }

    setPaso('procesando')

    try {
      console.log('Iniciando borrado...', { opcion, fechaInicio, fechaFinal })

      const res = await fetch('/api/auditoria', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modo: opcion,
          fechaInicio: opcion === 'rango' ? fechaInicio : null,
          fechaFinal: opcion === 'rango' ? fechaFinal : null,
        }),
      })

      const respuesta = await res.json()
      console.log('Respuesta del servidor:', respuesta)

      if (res.ok) {
        alert(`✅ ÉXITO!\n\n${respuesta.mensaje}\n\nEl CRM está listo para el cliente.`)
        router.push('/dashboard')
      } else {
        alert(`❌ Error: ${respuesta.error || 'Error desconocido'}`)
        setPaso('seleccionar')
      }
    } catch (err) {
      console.error('Error:', err)
      alert(`❌ Error de conexión: ${err}`)
      setPaso('seleccionar')
    }
  }

  if (paso === 'procesando') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e3a8a' }}>
        <div style={{ textAlign: 'center', color: '#ffffff' }}>
          <h1 style={{ fontSize: 32, marginBottom: 16 }}>🧹 Borrando auditoría...</h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)' }}>Por favor espera...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e3a8a', padding: 20 }}>
      <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: 40, maxWidth: 500, width: '100%' }}>
        <h1 style={{ color: '#ffffff', fontSize: 28, marginBottom: 24, textAlign: 'center' }}>🧹 Limpiar Auditoría</h1>

        <div style={{ marginBottom: 24 }}>
          <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: 16, fontWeight: 600, cursor: 'pointer' }}>
            <input
              type="radio"
              checked={opcion === 'todo'}
              onChange={() => setOpcion('todo')}
              style={{ marginRight: 8 }}
            />
            🗓️ Borrar TODA la auditoría
          </label>

          <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: 12, fontWeight: 600, cursor: 'pointer' }}>
            <input
              type="radio"
              checked={opcion === 'rango'}
              onChange={() => setOpcion('rango')}
              style={{ marginRight: 8 }}
            />
            📅 Borrar rango de fechas
          </label>
        </div>

        {opcion === 'rango' && (
          <div style={{ marginBottom: 24, background: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 12 }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Fecha Inicial (DD/MM/YYYY)
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  fontSize: 14,
                }}
              />
            </div>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Fecha Final (DD/MM/YYYY)
              </label>
              <input
                type="date"
                value={fechaFinal}
                onChange={(e) => setFechaFinal(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  fontSize: 14,
                }}
              />
            </div>
          </div>
        )}

        <button
          onClick={procesarBorrado}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 10,
            background: '#dc2626',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: 16,
            border: '1px solid #b91c1c',
            cursor: 'pointer',
            marginBottom: 12,
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#991b1b')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#dc2626')}
        >
          🗑️ BORRAR AUDITORÍA
        </button>

        <button
          onClick={() => router.push('/dashboard')}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 10,
            background: 'rgba(255,255,255,0.1)',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: 14,
            border: '1px solid rgba(255,255,255,0.2)',
            cursor: 'pointer',
          }}
        >
          ← Volver al Dashboard
        </button>
      </div>
    </div>
  )
}
