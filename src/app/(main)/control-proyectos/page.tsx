'use client'
import { useEffect } from 'react'
import { useControlProyectosStore } from '@/features/control-proyectos/store/control-proyectos-store'

// 🚧 MÓDULO EN CONSTRUCCIÓN (Fase 0 — esqueleto)
// Módulo NUEVO, independiente del módulo "Proyectos" actual (ese NO se toca).
// Todo el contenido va envuelto en .po-root para quedar excluido de las reglas
// !important globales de globals.css y poder usar los colores naranja de obra.

const FASES: { n: string; titulo: string; estado: 'listo' | 'pendiente' }[] = [
  { n: 'Fase 0', titulo: 'Esqueleto del módulo (menú, página, store, API)', estado: 'listo' },
  { n: 'Fase 1', titulo: 'Ficha del proyecto + datos base', estado: 'pendiente' },
  { n: 'Fase 2', titulo: 'WBS / partidas jerárquicas con peso (import Excel)', estado: 'pendiente' },
  { n: 'Fase 3', titulo: 'Cortes de avance (histórico inmutable)', estado: 'pendiente' },
  { n: 'Fase 4', titulo: 'Curva S (física y financiera) + KPIs', estado: 'pendiente' },
  { n: 'Fase 5', titulo: 'Portafolio + semáforos + cartera', estado: 'pendiente' },
  { n: 'Fase 6', titulo: 'Alertas + exportación (PDF/PPT/Excel)', estado: 'pendiente' },
]

export default function ControlProyectosPage() {
  const items = useControlProyectosStore(s => s.items)
  const loaded = useControlProyectosStore(s => s.loaded)
  const loadItems = useControlProyectosStore(s => s.loadItems)
  useEffect(() => { loadItems() }, [loadItems])

  return (
    <div className="po-root" style={{ padding: 24, maxWidth: 1100, margin: '0 auto', color: '#1e293b' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <span style={{ fontSize: 30 }}>📈</span>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0f172a' }}>Control de Proyectos</h1>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#ffffff', background: '#ea580c', padding: '4px 10px', borderRadius: 8, letterSpacing: 0.3 }}>
          🚧 EN CONSTRUCCIÓN
        </span>
      </div>

      {/* Banner de obra */}
      <div style={{
        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        color: '#ffffff', borderRadius: 14, padding: '18px 22px', marginBottom: 22,
        boxShadow: '0 6px 18px rgba(234,88,12,0.25)',
      }}>
        <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>🚧 Módulo nuevo en desarrollo — Dashboard Gerencial</div>
        <div style={{ fontSize: 14, lineHeight: 1.5, opacity: 0.97 }}>
          Este es un módulo <b>independiente</b> del módulo <b>Proyectos</b> actual (ese sigue funcionando igual y NO se toca).
          Aquí construiremos por fases el <b>control de obra</b>: Curva S, avance físico/financiero, facturación y cartera.
          Mientras dice <b>EN CONSTRUCCIÓN</b>, no lo tomes como oficial.
        </div>
      </div>

      {/* Smoke test de conexión (Fase 0) */}
      <div style={{
        background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12,
        padding: '12px 16px', marginBottom: 22, fontSize: 13, color: '#475569',
      }}>
        Estado de conexión de datos:{' '}
        {!loaded
          ? <b style={{ color: '#ea580c' }}>cargando…</b>
          : <b style={{ color: '#16a34a' }}>OK ✓ ({items.length} registros en control-proyectos-datos)</b>}
      </div>

      {/* Hoja de ruta de fases */}
      <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>Hoja de ruta</h2>
      <div style={{ display: 'grid', gap: 10 }}>
        {FASES.map(f => {
          const listo = f.estado === 'listo'
          return (
            <div key={f.n} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: '#ffffff', border: '1px solid #e2e8f0',
              borderLeft: `4px solid ${listo ? '#16a34a' : '#f59e0b'}`,
              borderRadius: 10, padding: '12px 16px',
            }}>
              <span style={{ fontSize: 18 }}>{listo ? '✅' : '🕓'}</span>
              <b style={{ color: listo ? '#16a34a' : '#b45309', minWidth: 58 }}>{f.n}</b>
              <span style={{ color: '#334155', fontSize: 14 }}>{f.titulo}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
