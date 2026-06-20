'use client'
import { useState } from 'react'
import ModuleHeader from '@/shared/components/module-header'
import { SECCIONES, Seccion } from '@/features/manual/content'
import { REFERENCE_TABLES } from '@/features/referencias/types'
import { useModulosStore } from '@/features/modulos/store/modulos-store'

const GRUPOS: { id: Seccion['grupo']; titulo: string }[] = [
  { id: 'general', titulo: 'General' },
  { id: 'modulo', titulo: 'Módulos' },
  { id: 'config', titulo: 'Configuración' },
]

export default function ManualPage() {
  const [activa, setActiva] = useState<string>(SECCIONES[0].id)
  const modulos = useModulosStore(s => s.modulos)
  const sec = SECCIONES.find(s => s.id === activa) || SECCIONES[0]

  // Datos dinámicos (se actualizan solos con el sistema)
  const modulosActivos = modulos.filter(m => m.activo && m.grupo === 'principal').map(m => m.label)
  const tablasRef = [...REFERENCE_TABLES].map(t => t.label).sort((a, b) => a.localeCompare(b, 'es'))

  const card: React.CSSProperties = { background: '#ffffff', borderRadius: 14, padding: 24, border: '1px solid #1e3a8a' }
  const h: React.CSSProperties = { color: '#013978', fontWeight: 800 }

  const exportarPDF = () => {
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const bloque = (s: Seccion) => `
      <h2>${esc(s.icono + ' ' + s.titulo)}</h2>
      <p>${esc(s.intro)}</p>
      ${s.campos ? `<table><tr><th>Campo</th><th>Descripción</th></tr>${s.campos.map(c => `<tr><td><b>${esc(c.nombre)}</b></td><td>${esc(c.desc)}</td></tr>`).join('')}</table>` : ''}
      ${s.comoUsar ? `<p><b>Cómo se usa:</b></p><ul>${s.comoUsar.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      ${s.especiales ? `<p><b>Importante:</b></p><ul>${s.especiales.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      <hr/>`
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Manual CRM Comercial</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;max-width:820px;margin:24px auto;padding:0 16px;}
        h1{color:#1e3a8a;} h2{color:#1e3a8a;margin-top:26px;border-bottom:2px solid #1e3a8a;padding-bottom:4px;}
        table{border-collapse:collapse;width:100%;margin:8px 0;} td,th{border:1px solid #cbd5e1;padding:6px 10px;text-align:left;font-size:13px;}
        th{background:#1e3a8a;color:#fff;} ul{margin:6px 0 14px;} li{margin:3px 0;font-size:14px;} p{font-size:14px;line-height:1.5;}
        hr{border:none;border-top:1px solid #e2e8f0;margin:18px 0;}
      </style></head><body>
      <h1>📘 Manual de Usuario — CRM Comercial</h1>
      <p>Generado el ${new Date().toLocaleString('es-CO')}</p>
      ${SECCIONES.map(bloque).join('')}
      </body></html>`
    const w = window.open('', '_blank')
    if (!w) { alert('Permite las ventanas emergentes para exportar el PDF.'); return }
    w.document.write(html); w.document.close()
    setTimeout(() => w.print(), 400)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <ModuleHeader title="📘 Manual de Usuario" subtitle="Guía del CRM Comercial por módulo" />
        <button onClick={exportarPDF} style={{ padding: '10px 20px', borderRadius: 8, background: '#b91c1c', color: '#fff', border: '1px solid #dc2626', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
          ⬇️ Exportar PDF (al día)
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, marginTop: 8, alignItems: 'start' }}>
        {/* Navegación */}
        <div style={{ ...card, padding: 14, position: 'sticky', top: 8 }}>
          {GRUPOS.map(g => (
            <div key={g.id} style={{ marginBottom: 12 }}>
              <p style={{ color: '#64748b', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', margin: '4px 0 6px' }}>{g.titulo}</p>
              {SECCIONES.filter(s => s.grupo === g.id).map(s => (
                <button key={s.id} onClick={() => setActiva(s.id)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', marginBottom: 3,
                    borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activa === s.id ? 800 : 600,
                    background: activa === s.id ? '#1e3a8a' : 'transparent', color: activa === s.id ? '#fff' : '#013978',
                  }}>
                  {s.icono} {s.titulo}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Contenido */}
        <div style={card}>
          <h2 style={{ ...h, fontSize: 22, marginBottom: 8 }}>{sec.icono} {sec.titulo}</h2>
          <p style={{ color: '#0f172a', fontSize: 15, lineHeight: 1.6, marginBottom: 16 }}>{sec.intro}</p>

          {sec.campos && (
            <>
              <p style={{ ...h, fontSize: 15, margin: '8px 0' }}>Campos que graba</p>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['Campo', 'Descripción'].map(x => <th key={x} style={{ background: '#1e3a8a', color: '#fff', textAlign: 'left', padding: '8px 12px', fontSize: 12 }}>{x}</th>)}</tr></thead>
                  <tbody>
                    {sec.campos.map((c, i) => (
                      <tr key={c.nombre} style={{ background: i % 2 ? '#f8fafc' : '#fff' }}>
                        <td style={{ padding: '8px 12px', color: '#013978', fontSize: 13, fontWeight: 700, borderBottom: '1px solid #e2e8f0' }}>{c.nombre}</td>
                        <td style={{ padding: '8px 12px', color: '#0f172a', fontSize: 13, borderBottom: '1px solid #e2e8f0' }}>{c.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {sec.comoUsar && (
            <>
              <p style={{ ...h, fontSize: 15, margin: '8px 0' }}>Cómo se usa</p>
              <ul style={{ margin: '0 0 16px', paddingLeft: 20 }}>
                {sec.comoUsar.map((x, i) => <li key={i} style={{ color: '#0f172a', fontSize: 14, lineHeight: 1.6, marginBottom: 4 }}>{x}</li>)}
              </ul>
            </>
          )}

          {sec.especiales && (
            <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 10, padding: 14, marginBottom: 8 }}>
              <p style={{ ...h, fontSize: 14, margin: '0 0 6px' }}>💡 Importante</p>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {sec.especiales.map((x, i) => <li key={i} style={{ color: '#0f172a', fontSize: 14, lineHeight: 1.6, marginBottom: 4 }}>{x}</li>)}
              </ul>
            </div>
          )}

          {/* Datos dinámicos (se actualizan solos con el sistema) */}
          {sec.id === 'introduccion' && (
            <div style={{ marginTop: 8 }}>
              <p style={{ ...h, fontSize: 15, margin: '8px 0' }}>Módulos activos hoy ({modulosActivos.length})</p>
              <p style={{ color: '#0f172a', fontSize: 14 }}>{modulosActivos.join(' · ')}</p>
            </div>
          )}
          {sec.id === 'referencias' && (
            <div style={{ marginTop: 8 }}>
              <p style={{ ...h, fontSize: 15, margin: '8px 0' }}>Tablas disponibles hoy ({tablasRef.length})</p>
              <p style={{ color: '#0f172a', fontSize: 14 }}>{tablasRef.join(' · ')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
