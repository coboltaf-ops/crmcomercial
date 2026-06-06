'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useClientesStore } from '@/features/clientes/store/clientes-store'
import { useOportunidadesStore } from '@/features/oportunidades/store/oportunidades-store'
import { useCotizacionesStore } from '@/features/cotizaciones/store/cotizaciones-store'
import { useTareasStore } from '@/features/tareas/store/tareas-store'
import { usePQRSStore } from '@/features/pqrs/store/pqrs-store'
import { useProductosStore } from '@/features/productos/store/productos-store'
import { useContactosStore } from '@/features/contactos/store/contactos-store'
import { fmtMoney } from '@/shared/lib/format-number'

// Asistente gratuito: responde preguntas sobre los datos del CRM y las dice en voz alta.
export default function AsistenteVoz() {
  const [open, setOpen] = useState(false)
  const [pregunta, setPregunta] = useState('')
  const [respuesta, setRespuesta] = useState('')
  const [escuchando, setEscuchando] = useState(false)
  const recRef = useRef<unknown>(null)
  const router = useRouter()

  const clientes = useClientesStore(s => s.clientes)
  const oportunidades = useOportunidadesStore(s => s.oportunidades)
  const cotizaciones = useCotizacionesStore(s => s.cotizaciones)
  const tareas = useTareasStore(s => s.tareas)
  const pqrs = usePQRSStore(s => s.pqrs)
  const productos = useProductosStore(s => s.productos)
  const contactos = useContactosStore(s => s.contactos)

  const hablar = (texto: string) => {
    try {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(texto)
      u.lang = 'es-ES'
      u.rate = 1
      window.speechSynthesis.speak(u)
    } catch { /* sin voz */ }
  }

  const responder = (q: string) => {
    const t = q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    if (!t.trim()) return
    let r = ''

    const pipeline = oportunidades
      .filter(o => o.situacion === 'Abierta' || o.situacion === 'En Negociación')
      .reduce((s, o) => s + (o.valor_estimado || o.monto_estimado || 0), 0)

    // Navegación
    const rutas: { k: RegExp; href: string; nombre: string }[] = [
      { k: /cliente|empresa/, href: '/clientes', nombre: 'Clientes' },
      { k: /cotizac/, href: '/cotizaciones', nombre: 'Cotizaciones' },
      { k: /oportunidad|negocio/, href: '/oportunidades', nombre: 'Oportunidades' },
      { k: /tarea/, href: '/tareas', nombre: 'Tareas' },
      { k: /pqrs|queja|reclamo/, href: '/pqrs', nombre: 'PQRS' },
      { k: /producto/, href: '/productos', nombre: 'Productos' },
      { k: /contacto/, href: '/contactos', nombre: 'Contactos' },
      { k: /prospecto/, href: '/prospectos', nombre: 'Prospectos' },
      { k: /dashboard|inicio|tablero/, href: '/dashboard', nombre: 'Dashboard' },
    ]

    if (/(hola|buenas|buenos dias|buenas tardes|saludos|hey)/.test(t)) {
      r = '¡Hola! Soy tu asistente del CRM. Puedes preguntarme cuántos clientes, oportunidades, cotizaciones, tareas o PQRS tienes, el valor del pipeline, o pedirme que abra un módulo.'
    } else if (/(abre|abrir|ir a|ve a|vamos a|muestrame|muestra|llevame)/.test(t)) {
      const ruta = rutas.find(x => x.k.test(t))
      if (ruta) { r = `Abriendo ${ruta.nombre}.`; setTimeout(() => router.push(ruta.href), 600) }
      else r = 'No reconocí a qué módulo quieres ir. Prueba: abre clientes, abre cotizaciones, abre tareas.'
    } else if (/cliente|empresa/.test(t)) {
      const activos = clientes.filter(c => (c.situacion || '').toLowerCase() === 'activo').length
      // ciudad con más clientes
      const cc: Record<string, number> = {}
      clientes.forEach(c => { const ci = (c.ciudad || '').trim() || 'Sin ciudad'; cc[ci] = (cc[ci] || 0) + 1 })
      const top = Object.entries(cc).sort((a, b) => b[1] - a[1])[0]
      if (/ciudad/.test(t) && top) r = `La ciudad con más clientes es ${top[0]} con ${top[1]} clientes.`
      else r = `Tienes ${clientes.length} clientes en total, ${activos} activos.`
    } else if (/oportunidad|negocio|pipeline|venta/.test(t)) {
      const ganadas = oportunidades.filter(o => o.situacion === 'Ganada').length
      if (/ganada/.test(t)) r = `Tienes ${ganadas} oportunidades ganadas.`
      else if (/pipeline|valor|monto|cuanto/.test(t)) r = `El pipeline de ventas suma ${fmtMoney(pipeline)} en oportunidades abiertas.`
      else r = `Tienes ${oportunidades.length} oportunidades. El pipeline abierto suma ${fmtMoney(pipeline)}.`
    } else if (/cotizac/.test(t)) {
      const pend = cotizaciones.filter(c => c.situacion === 'Borrador' || c.situacion === 'Enviada').length
      r = `Tienes ${cotizaciones.length} cotizaciones, ${pend} pendientes.`
    } else if (/tarea/.test(t)) {
      const pend = tareas.filter(t2 => t2.situacion === 'Pendiente').length
      r = `Tienes ${tareas.length} tareas, ${pend} pendientes.`
    } else if (/pqrs|queja|reclamo/.test(t)) {
      const abiertas = pqrs.filter(p => p.situacion !== 'Cerrada').length
      r = `Tienes ${pqrs.length} PQRS, ${abiertas} sin cerrar.`
    } else if (/producto/.test(t)) {
      r = `Tienes ${productos.length} productos registrados.`
    } else if (/contacto/.test(t)) {
      r = `Tienes ${contactos.length} contactos.`
    } else if (/gracias/.test(t)) {
      r = '¡Con gusto! Aquí estoy para ayudarte.'
    } else {
      r = 'No entendí bien. Puedes preguntarme: cuántos clientes tengo, el valor del pipeline, cuántas cotizaciones o tareas hay, o decir "abre clientes".'
    }

    setRespuesta(r)
    hablar(r)
  }

  const onEnviar = () => { responder(pregunta) }

  const escuchar = () => {
    const w = window as unknown as Record<string, unknown>
    const SR = (w.SpeechRecognition || w.webkitSpeechRecognition) as (new () => {
      lang: string; interimResults: boolean; onresult: ((e: { results: { transcript: string }[][] }) => void) | null
      onerror: (() => void) | null; onend: (() => void) | null; start: () => void
    }) | undefined
    if (!SR) { setRespuesta('Tu navegador no soporta reconocimiento de voz. Usa Chrome.'); return }
    const rec = new SR()
    rec.lang = 'es-CO'
    rec.interimResults = false
    rec.onresult = (e) => { const txt = e.results[0][0].transcript; setPregunta(txt); setEscuchando(false); responder(txt) }
    rec.onerror = () => setEscuchando(false)
    rec.onend = () => setEscuchando(false)
    recRef.current = rec
    setEscuchando(true)
    rec.start()
  }

  return (
    <>
      {/* Botón flotante */}
      <button onClick={() => setOpen(!open)} title="Asistente"
        style={{
          position: 'fixed', bottom: 24, right: 24, width: 60, height: 60, borderRadius: '50%',
          background: '#1e3a8a', color: '#fff', border: '2px solid #60a5fa', fontSize: 26,
          cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.35)', zIndex: 1500,
        }}>🤖</button>

      {/* Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 96, right: 24, width: 340, maxWidth: 'calc(100vw - 48px)',
          background: '#0f1b3d', borderRadius: 16, border: '2px solid #1e3a8a',
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)', zIndex: 1500, padding: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>🤖 Asistente CRM</span>
            <button onClick={() => { setOpen(false); window.speechSynthesis?.cancel() }}
              style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}>✕</button>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 12, minHeight: 70, marginBottom: 10 }}>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
              {respuesta || 'Escribe o habla una pregunta sobre tu CRM. Ej: "¿Cuántos clientes tengo?" o "abre cotizaciones".'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={pregunta}
              onChange={e => setPregunta(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onEnviar()}
              placeholder="Escribe tu pregunta..."
              style={{ flex: 1, padding: '9px 12px', borderRadius: 8, background: '#fff', color: '#000', border: '1px solid #1e3a8a', fontSize: 13, outline: 'none' }} />
            <button onClick={onEnviar} title="Enviar"
              style={{ padding: '9px 12px', borderRadius: 8, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14 }}>➤</button>
            <button onClick={escuchar} title="Hablar"
              style={{ padding: '9px 12px', borderRadius: 8, background: escuchando ? '#dc2626' : '#16a34a', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14 }}>🎤</button>
          </div>
        </div>
      )}
    </>
  )
}
