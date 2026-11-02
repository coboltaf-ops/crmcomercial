'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUserStore } from '@/features/usuarios-gestion/store/current-user-store'
import { useEmpresaStore } from '@/features/empresa/store/empresa-store'

// Este despliegue ES el CRM de Norton. El de Tamoin (GTM) vive en otra URL.
const CRM_ACTUAL: 'tamoin' | 'norton' = 'norton'
const URL_TAMOIN = process.env.NEXT_PUBLIC_CRM_TAMOIN_URL || 'http://localhost:3014'
const URL_NORTON = process.env.NEXT_PUBLIC_CRM_NORTON_URL || 'http://localhost:3013'

export default function LoginPage() {
  const router = useRouter()
  const setUser = useCurrentUserStore(s => s.setUser)
  const loadEmpresas = useEmpresaStore(s => s.loadEmpresas)
  const [crmSel, setCrmSel] = useState<'tamoin' | 'norton' | null>(null)
  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { loadEmpresas() }, [loadEmpresas])

  // Elegir CRM: si es el de esta app, muestra el formulario; si es el otro, redirige.
  const elegirCRM = (crm: 'tamoin' | 'norton') => {
    setError('')
    if (crm === CRM_ACTUAL) { setCrmSel(crm); return }
    window.location.href = crm === 'tamoin' ? URL_TAMOIN : URL_NORTON
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, clave }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) { setError(data.error || 'Usuario o clave incorrectos'); return }
      setUser(data.user)
      router.push('/dashboard')
    } catch {
      setError('Error de conexión')
    }
  }

  const nombreCRM = (c: 'tamoin' | 'norton') => c === 'tamoin' ? 'CRM Tamoin (GTM)' : 'CRM Norton'

  return (
    <div className="login-screen" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e3a8a' }}>
      <div className="login-card" style={{ background: '#0f1b3d', border: '3px solid #1e3a8a', borderRadius: 20, padding: 40, width: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ marginBottom: 18 }}>
            <img src="/logo-norton.jpeg" alt="GRUPO TAMOIN LATAM" style={{ width: '100%', maxWidth: 320, height: 140, borderRadius: 16, objectFit: 'contain', background: '#ffffff', padding: 14, margin: '0 auto', display: 'block' }} />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#ffffff', marginBottom: 4 }}>Grupo Tamoin Latam</h1>
          <p style={{ color: '#f6a96b', fontSize: 15, fontWeight: 700 }}>Acceso al CRM</p>
        </div>

        {/* ── PASO 1: elegir CRM ── */}
        {!crmSel && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, textAlign: 'center', marginBottom: 4 }}>¿Con qué CRM deseas trabajar?</p>
            <button onClick={() => elegirCRM('tamoin')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, background: '#1e3a8a', border: '1px solid #3b5fd4', color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ fontSize: 22 }}>🟦</span> CRM Tamoin (GTM)
            </button>
            <button onClick={() => elegirCRM('norton')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, background: '#7f1d1d', border: '1px solid #b91c1c', color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ fontSize: 22 }}>🟥</span> CRM Norton
            </button>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', marginTop: 6 }}>Tu acceso depende de tu usuario en el CRM elegido. Un usuario Global puede entrar a ambos.</p>
          </div>
        )}

        {/* ── PASO 2: login del CRM elegido (esta app) ── */}
        {crmSel && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 12px' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>📍 {nombreCRM(crmSel)}</span>
              <button type="button" onClick={() => setCrmSel(null)} style={{ background: 'none', border: 'none', color: '#93c5fd', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>cambiar CRM</button>
            </div>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 4, display: 'block' }}>Usuario</label>
              <input value={usuario} onChange={e => setUsuario(e.target.value)} placeholder="admin" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', fontSize: 14, outline: 'none' }} />
            </div>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 4, display: 'block' }}>Clave</label>
              <input type="password" value={clave} onChange={e => setClave(e.target.value)} placeholder="••••••••" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', fontSize: 14, outline: 'none' }} />
            </div>
            {error && <p style={{ color: '#f87171', fontSize: 13, textAlign: 'center' }}>{error}</p>}
            <button type="submit" style={{ padding: '12px', borderRadius: 10, background: '#2563eb', color: '#ffffff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', marginTop: 4 }}>
              Ingresar al {nombreCRM(crmSel)}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
