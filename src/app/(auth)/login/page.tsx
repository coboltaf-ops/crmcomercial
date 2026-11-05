'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUserStore } from '@/features/usuarios-gestion/store/current-user-store'
import { useEmpresaStore } from '@/features/empresa/store/empresa-store'

// Este despliegue ES el CRM de Norton. Cada CRM valida SOLO a sus propios
// usuarios; no hay salto automático entre apps. El otro CRM se abre desde su
// propia dirección.
const CRM_ACTUAL: 'tamoin' | 'norton' = 'norton'

export default function LoginPage() {
  const router = useRouter()
  const setUser = useCurrentUserStore(s => s.setUser)
  const loadEmpresas = useEmpresaStore(s => s.loadEmpresas)
  const [crmSel, setCrmSel] = useState<'tamoin' | 'norton' | null>(null)
  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { loadEmpresas() }, [loadEmpresas])

  // Elegir CRM: solo muestra el panel correspondiente. Sin redirección entre apps.
  const elegirCRM = (crm: 'tamoin' | 'norton') => {
    setError('')
    setCrmSel(crm)
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
            {CRM_ACTUAL === 'tamoin' && (
            <button onClick={() => elegirCRM('tamoin')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, background: '#1e3a8a', border: '1px solid #3b5fd4', color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ fontSize: 22 }}>🟦</span> CRM Tamoin (GTM)
            </button>
            )}
            {CRM_ACTUAL === 'norton' && (
            <button onClick={() => elegirCRM('norton')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, background: '#7f1d1d', border: '1px solid #b91c1c', color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ fontSize: 22 }}>🟥</span> CRM Norton
            </button>
            )}
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', marginTop: 6 }}>Tu acceso se valida con tu usuario en este CRM. El otro CRM se abre desde su propia dirección.</p>
          </div>
        )}

        {/* ── Eligió el OTRO CRM: no se salta entre apps, se abre por su dirección ── */}
        {crmSel && crmSel !== CRM_ACTUAL && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '14px 16px' }}>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 6 }}>📍 Estás en el {nombreCRM(CRM_ACTUAL)}</p>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>El {nombreCRM(crmSel)} funciona en su propia dirección. Ábrelo desde ahí; aquí solo puedes ingresar al {nombreCRM(CRM_ACTUAL)}.</p>
            </div>
            <button type="button" onClick={() => setCrmSel(null)} style={{ padding: '12px', borderRadius: 10, background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>← Volver a elegir</button>
          </div>
        )}

        {/* ── PASO 2: login del CRM de esta app ── */}
        {crmSel === CRM_ACTUAL && (
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
