'use client'
// Manual de Procedimientos y Uso — Sistema Control de Proyectos.
// Se muestra DENTRO del sistema (primera opción del menú). El contenido vive en
// /public/manuales/control-proyectos.html (fuente única: misma base del PDF de docs/).
// Se embebe por iframe para aislarlo de las reglas CSS globales del CRM.

const HTML_SRC = '/manuales/control-proyectos.html'
const PDF_SRC = '/manuales/Manual-Procedimientos-Control-Proyectos.pdf'

export default function ManualControlProyectosPage() {
  return (
    <div className="po-root" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <span style={{ fontSize: 24 }}>📘</span>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#ea580c' }}>Manual de Procedimientos y Uso · Sistema Control de Proyectos</h1>
        <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: '#16a34a', padding: '3px 8px', borderRadius: 8 }}>v1.0 · Fases 0–2a</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <a href={HTML_SRC} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', background: '#1e3a8a', color: '#fff', fontSize: 12, fontWeight: 700, padding: '7px 12px', borderRadius: 8 }}>🖨️ Imprimir</a>
          <a href={PDF_SRC} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', background: '#ea580c', color: '#fff', fontSize: 12, fontWeight: 700, padding: '7px 12px', borderRadius: 8 }}>⬇ Descargar PDF</a>
        </div>
      </div>
      <iframe
        src={HTML_SRC}
        title="Manual Control de Proyectos"
        style={{ flex: 1, width: '100%', border: '1px solid #fdba74', borderRadius: 12, background: '#fff', minHeight: 480 }}
      />
    </div>
  )
}
