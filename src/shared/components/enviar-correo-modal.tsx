'use client'
import { useState, useRef } from 'react'

interface Props {
  destinatario?: string
  asuntoInicial?: string
  modulo?: string
  referencia?: string
  onClose: () => void
}

interface Adjunto { filename: string; content: string }

// Modal reutilizable para enviar correos desde cualquier módulo (con adjuntos y enlace).
export default function EnviarCorreoModal({ destinatario = '', asuntoInicial = '', modulo, referencia, onClose }: Props) {
  const [to, setTo] = useState(destinatario)
  const [asunto, setAsunto] = useState(asuntoInicial)
  const [mensaje, setMensaje] = useState('')
  const [url, setUrl] = useState('')
  const [archivos, setArchivos] = useState<Adjunto[]>([])
  const [enviando, setEnviando] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(f => {
      const reader = new FileReader()
      reader.onload = ev => setArchivos(prev => [...prev, { filename: f.name, content: ev.target?.result as string }])
      reader.readAsDataURL(f)
    })
    if (fileRef.current) fileRef.current.value = ''
  }

  const enviar = async () => {
    if (!to.trim() || !asunto.trim()) { setResult({ ok: false, msg: 'Completa el destinatario y el asunto.' }); return }
    setEnviando(true); setResult(null)
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, asunto, mensaje, url, modulo, referencia, attachments: archivos }),
      })
      const data = await res.json()
      if (res.ok) setResult({ ok: true, msg: 'Correo enviado correctamente ✅' })
      else setResult({ ok: false, msg: data.error || 'Error al enviar.' })
    } catch {
      setResult({ ok: false, msg: 'Error de conexión.' })
    } finally { setEnviando(false) }
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, background: '#ffffff', border: '1px solid #1e3a8a', color: '#000000', fontSize: 14, outline: 'none' }
  const labelStyle: React.CSSProperties = { color: '#013978', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: 16, border: '2px solid #1e3a8a', padding: 24, width: 480, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ color: '#013978', fontSize: 18, fontWeight: 800, margin: 0 }}>📧 Enviar Correo</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#013978', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={labelStyle}>Para *</label>
            <input value={to} onChange={e => setTo(e.target.value)} placeholder="correo@ejemplo.com" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Asunto *</label>
            <input value={asunto} onChange={e => setAsunto(e.target.value)} placeholder="Asunto del correo" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Mensaje</label>
            <textarea value={mensaje} onChange={e => setMensaje(e.target.value)} rows={5} placeholder="Escribe tu mensaje..." style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div>
            <label style={labelStyle}>Enlace / URL (opcional)</label>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://... (acceso para el cliente)" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Documentos adjuntos (opcional)</label>
            <input ref={fileRef} type="file" multiple onChange={onFiles} style={{ display: 'none' }} />
            <button type="button" onClick={() => fileRef.current?.click()} style={{ padding: '8px 16px', borderRadius: 8, background: '#15803d', color: '#ffffff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>+ Adjuntar archivo</button>
            {archivos.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {archivos.map((a, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', borderRadius: 6, padding: '4px 10px' }}>
                    <span style={{ color: '#013978', fontSize: 12 }}>📎 {a.filename}</span>
                    <button onClick={() => setArchivos(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 14 }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {result && (
            <p style={{ color: result.ok ? '#15803d' : '#dc2626', fontSize: 13, fontWeight: 600, textAlign: 'center', margin: 0 }}>{result.msg}</p>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={enviar} disabled={enviando} style={{ flex: 1, padding: '10px', borderRadius: 8, background: enviando ? '#94a3b8' : '#1e3a8a', color: '#ffffff', border: 'none', cursor: enviando ? 'default' : 'pointer', fontSize: 14, fontWeight: 700 }}>
              {enviando ? 'Enviando...' : 'Enviar correo'}
            </button>
            <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 8, background: '#64748b', color: '#ffffff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  )
}
