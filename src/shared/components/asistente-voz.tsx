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

// Asistente con IA real (Claude): responde preguntas sobre los datos del CRM
// y las dice en voz alta. La navegación ("abre clientes") se resuelve local.
export default function AsistenteVoz() {
  const [open, setOpen] = useState(false)
  const [pregunta, setPregunta] = useState('')
  const [respuesta, setRespuesta] = useState('')
  const [escuchando, setEscuchando] = useState(false)
  const [cargando, setCargando] = useState(false)
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

  // Resumen compacto de los datos del CRM que se envía a la IA como contexto.
  const construirContexto = () => {
    const porCiudad: Record<string, number> = {}
    clientes.forEach(c => { const ci = (c.ciudad || '').trim() || 'Sin ciudad'; porCiudad[ci] = (porCiudad[ci] || 0) + 1 })
    const pipelineAbierto = oportunidades
      .filter(o => o.situacion === 'Abierta' || o.situacion === 'En Negociación')
      .reduce((s, o) => s + (o.valor_estimado || o.monto_estimado || 0), 0)
    const cotPorSituacion: Record<string, number> = {}
    cotizaciones.forEach(c => { const s = c.situacion || 'Sin situación'; cotPorSituacion[s] = (cotPorSituacion[s] || 0) + 1 })
    return {
      clientes: {
        total: clientes.length,
        activos: clientes.filter(c => (c.situacion || '').toLowerCase() === 'activo').length,
        porCiudad,
        nombres: clientes.slice(0, 150).map(c => c.razon_social),
      },
      contactos: {
        total: contactos.length,
        nombres: contactos.slice(0, 100).map(c => `${c.nombre} ${c.apellido}`),
      },
      oportunidades: {
        total: oportunidades.length,
        ganadas: oportunidades.filter(o => o.situacion === 'Ganada').length,
        abiertas: oportunidades.filter(o => o.situacion === 'Abierta' || o.situacion === 'En Negociación').length,
        pipelineAbierto,
      },
      cotizaciones: { total: cotizaciones.length, porSituacion: cotPorSituacion },
      productos: {
        total: productos.length,
        lista: productos.slice(0, 150).map(p => ({ codigo: p.codigo, descripcion: p.descripcion, categoria: p.categoria, precio: p.precio_unitario })),
      },
      tareas: { total: tareas.length, pendientes: tareas.filter(tk => tk.situacion === 'Pendiente').length },
      pqrs: { total: pqrs.length, sinCerrar: pqrs.filter(p => p.situacion !== 'Cerrada').length },
    }
  }

  const responder = async (q: string) => {
    const t = q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    if (!t.trim()) return

    // Navegación: gratis e instantánea, sin llamar a la IA.
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
    if (/(abre|abrir|ir a|ve a|vamos a|llevame|navega)/.test(t)) {
      const ruta = rutas.find(x => x.k.test(t))
      if (ruta) {
        const r = `Abriendo ${ruta.nombre}.`
        setRespuesta(r); hablar(r)
        setTimeout(() => router.push(ruta.href), 600)
        return
      }
    }

    // Pregunta real → IA (Claude).
    setCargando(true)
    setRespuesta('Pensando…')
    try {
      const res = await fetch('/api/asistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta: q, contexto: construirContexto() }),
      })
      const data = await res.json()
      const r = (data?.respuesta || 'No pude responder en este momento.').toString()
      setRespuesta(r); hablar(r)
    } catch {
      const r = 'No pude conectarme con el asistente. Revisa tu conexión e intenta de nuevo.'
      setRespuesta(r); hablar(r)
    } finally {
      setCargando(false)
    }
  }

  const onEnviar = () => { if (!cargando) responder(pregunta) }

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
          position: 'fixed', top: 168, left: 'calc(50% + 100px)', transform: 'translateX(-50%)', width: 56, height: 56, borderRadius: '50%',
          background: '#1e3a8a', color: '#fff', border: '2px solid #60a5fa', fontSize: 24,
          cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.35)', zIndex: 1500,
        }}>🤖</button>

      {/* Panel */}
      {open && (
        <div style={{
          position: 'fixed', top: 232, left: 'calc(50% + 100px)', transform: 'translateX(-50%)', width: 340, maxWidth: 'calc(100vw - 48px)',
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
            <button onClick={onEnviar} title="Enviar" disabled={cargando}
              style={{ padding: '9px 12px', borderRadius: 8, background: '#2563eb', color: '#fff', border: 'none', cursor: cargando ? 'wait' : 'pointer', opacity: cargando ? 0.6 : 1, fontSize: 14 }}>➤</button>
            <button onClick={escuchar} title="Hablar"
              style={{ padding: '9px 12px', borderRadius: 8, background: escuchando ? '#dc2626' : '#16a34a', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14 }}>🎤</button>
          </div>
        </div>
      )}
    </>
  )
}
