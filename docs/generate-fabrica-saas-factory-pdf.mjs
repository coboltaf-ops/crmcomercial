import puppeteer from '/Users/josepalomares/aplicaciones/crmpalomaresconsultor/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js'
import fs from 'fs'
import path from 'path'

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUT_PDF = '/Users/josepalomares/aplicaciones/crmcomercial/docs/La-Fabrica-de-Desarrollo-SaaS-Factory.pdf'
const FECHA = '06 de septiembre de 2026'

const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><style>
  @page { size: Letter; margin: 0; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif; color:#1a2332; line-height:1.6; font-size:13px; }
  .page { width:8.5in; min-height:11in; padding:0.72in 0.8in 0.6in; page-break-after:always; position:relative; background:#fff; }
  .page:last-child { page-break-after:auto; }
  .cover { background:linear-gradient(150deg,#07162e 0%,#0e2f57 50%,#1e5aa8 100%); color:#fff; display:flex; flex-direction:column; justify-content:center; padding:0.9in 0.8in; }
  .cover .kicker { font-size:12px; letter-spacing:4px; text-transform:uppercase; color:#7fb2ff; margin-bottom:20px; }
  .cover h1 { font-size:44px; line-height:1.08; font-weight:800; margin-bottom:16px; }
  .cover .sub { font-size:16px; color:#cfe0f7; max-width:86%; }
  .cover .rule { width:70px; height:5px; background:#f2b705; border-radius:3px; margin:26px 0; }
  .cover .meta { margin-top:auto; font-size:13px; color:#b9cff0; }
  .cover .meta b { color:#fff; }
  .running { font-size:10px; letter-spacing:2px; text-transform:uppercase; color:#9fb2cc; margin-bottom:14px; border-bottom:1px solid #eef3fa; padding-bottom:7px; }
  h2 { font-size:21px; color:#0e2f57; font-weight:800; margin:4px 0 10px; }
  h3 { font-size:15px; color:#1e5aa8; font-weight:700; margin:14px 0 5px; }
  p { margin-bottom:9px; }
  .lead { font-size:14px; color:#2b3a52; }
  ul { margin:5px 0 10px 18px; } li { margin-bottom:5px; }
  .fig { background:#f6f9ff; border:1px solid #dce7f7; border-radius:12px; padding:14px; margin:14px 0; text-align:center; }
  .figcap { font-size:11px; color:#64748b; margin-top:8px; font-style:italic; }
  .cards { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:12px 0; }
  .card { background:#f6f9ff; border:1px solid #e2ebf7; border-radius:10px; padding:13px; }
  .card .ico { font-size:22px; margin-bottom:5px; }
  .card .t { font-weight:800; color:#0e2f57; font-size:13.5px; margin-bottom:3px; }
  .card .d { font-size:12px; color:#46566e; }
  .box { border-left:4px solid #f2b705; background:#fffbf0; padding:12px 16px; margin:12px 0; border-radius:0 8px 8px 0; }
  .footer { position:absolute; bottom:0.36in; left:0.8in; right:0.8in; display:flex; justify-content:space-between; font-size:10px; color:#9fb2cc; border-top:1px solid #eef3fa; padding-top:6px; }
  table { width:100%; border-collapse:collapse; margin:10px 0; font-size:12px; }
  th { background:#0e2f57; color:#fff; text-align:left; padding:8px 10px; }
  td { padding:8px 10px; border-bottom:1px solid #e2ebf7; vertical-align:top; }
  tr:nth-child(even) td { background:#f6f9ff; }
  td b { color:#0e2f57; }
  .badge { display:inline-block; background:#e8f0fe; color:#1e3a8a; border:1px solid #c7d9f7; border-radius:20px; padding:2px 10px; font-size:11px; font-weight:600; margin:2px 4px 2px 0; }
</style></head><body>

<!-- PORTADA -->
<div class="page cover">
  <div class="kicker">Documento Educativo · Ecosistema de Desarrollo</div>
  <h1>La Fábrica de Desarrollo<br><span style="color:#f2b705">SaaS Factory</span></h1>
  <div class="rule"></div>
  <div class="sub">Cómo está estructurada, cómo opera y qué herramientas la componen (Claude/IA, GitHub, Vercel, Supabase, KV, Blob y más) para construir y mantener sistemas hermosos, seguros y productivos.</div>
  <div class="meta">${FECHA}<br>Ing. <b>José E. Palomares</b> — Consultor de Desarrollo y Sistemas de Información · SaaS Factory</div>
</div>

<!-- 1. QUÉ ES -->
<div class="page">
  <div class="running">La Fábrica de Desarrollo SaaS Factory</div>
  <h2>1. ¿Qué es la Fábrica de Desarrollo?</h2>
  <p class="lead"><b>SaaS Factory</b> es una <b>fábrica de software</b>: no un taller artesanal, sino una línea de producción con herramientas profesionales, procesos estandarizados y control de calidad, capaz de entregar sistemas empresariales con <b>velocidad, calidad y consistencia</b>.</p>
  <p>La clave está en combinar un <b>consultor humano experto</b> (que entiende el negocio) con la <b>Inteligencia Artificial</b> y un <b>ecosistema de herramientas en la nube</b>. Cada pieza cumple una función específica y todas trabajan juntas — como las estaciones de una fábrica.</p>

  <div class="fig">
    <svg width="640" height="200" viewBox="0 0 640 200">
      <defs><linearGradient id="belt" x1="0" x2="1"><stop offset="0" stop-color="#0e2f57"/><stop offset="1" stop-color="#1e5aa8"/></linearGradient></defs>
      <!-- banda -->
      <rect x="30" y="150" width="580" height="14" rx="7" fill="url(#belt)"/>
      ${[0,1,2,3,4].map(i=>`<circle cx="${70+i*125}" cy="157" r="10" fill="#0b1f3a" stroke="#f2b705" stroke-width="2"/>`).join('')}
      <!-- estaciones -->
      ${[['💡','Idea /\\nNecesidad','#1e5aa8'],['🤖','Desarrollo\\ncon IA','#0e7490'],['🔀','Control\\n(GitHub)','#334155'],['▲','Despliegue\\n(Vercel)','#0e2f57'],['🌐','Sistema\\nen producción','#15803d']].map((s,i)=>{
        const x=70+i*125; return `<circle cx="${x}" cy="80" r="30" fill="#fff" stroke="${s[2]}" stroke-width="2.5"/><text x="${x}" y="90" text-anchor="middle" font-size="24">${s[0]}</text>${s[1].split('\\n').map((ln,k)=>`<text x="${x}" y="${128+k*13}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#0e2f57">${ln}</text>`).join('')}${i<4?`<path d="M${x+34} 80 L${x+88} 80" stroke="#94a3b8" stroke-width="2.5" marker-end="url(#ar)"/>`:''}`
      }).join('')}
      <defs><marker id="ar" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="#94a3b8"/></marker></defs>
    </svg>
    <div class="figcap">La línea de producción de la fábrica: de la idea al sistema en producción, con control de calidad en cada estación.</div>
  </div>

  <div class="box"><b>La idea central:</b> lo que antes tomaba meses y un equipo grande, hoy se logra en una fracción del tiempo y del costo — porque la fábrica automatiza, estandariza y aprovecha la IA en cada paso, sin sacrificar calidad ni seguridad.</div>
  <div class="footer"><span>SaaS Factory · Ing. José E. Palomares</span><span>Página 2</span></div>
</div>

<!-- 2. ECOSISTEMA -->
<div class="page">
  <div class="running">La Fábrica de Desarrollo SaaS Factory</div>
  <h2>2. El Ecosistema Tecnológico</h2>
  <p>Estas son las herramientas que operan conmigo, cada una con su rol dentro de la fábrica:</p>
  <div class="fig">
    <svg width="640" height="360" viewBox="0 0 640 360">
      <!-- centro: consultor + IA -->
      <circle cx="320" cy="180" r="58" fill="#0e2f57"/>
      <text x="320" y="170" text-anchor="middle" font-size="26">🤖</text>
      <text x="320" y="192" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">Consultor</text>
      <text x="320" y="206" text-anchor="middle" font-size="11" font-weight="800" fill="#f2b705">+ IA</text>
      ${[
        ['⌨️','Claude Code','Editor con IA','#0e7490',320,40],
        ['⚛️','Next.js','Framework web','#1e5aa8',540,110],
        ['▲','Vercel','Nube / Deploy','#0b1f3a',560,250],
        ['🗄️','KV · Blob · Supabase','Bases de datos','#15803d',360,325],
        ['🔀','GitHub','Control de versiones','#334155',110,300],
        ['🌐','Neubox / DNS','Dominios','#b45309',80,150],
        ['✉️','SMTP','Correos','#7c3aed',150,60],
      ].map(n=>{
        const [ic,ti,de,co,x,y]=n
        return `<line x1="320" y1="180" x2="${x}" y2="${y}" stroke="#cbd5e1" stroke-width="1.5"/>
        <g><rect x="${x-58}" y="${y-24}" width="116" height="48" rx="10" fill="#fff" stroke="${co}" stroke-width="2"/>
        <text x="${x-42}" y="${y+2}" font-size="17">${ic}</text>
        <text x="${x-22}" y="${y-4}" font-size="11" font-weight="800" fill="${co}">${ti}</text>
        <text x="${x-22}" y="${y+11}" font-size="9" fill="#64748b">${de}</text></g>`
      }).join('')}
    </svg>
    <div class="figcap">En el centro, el consultor + la IA; alrededor, las herramientas especializadas. Todas conectadas y trabajando en conjunto.</div>
  </div>
  <p style="font-size:12px;color:#46566e">Cada herramienta es un producto comercial líder en su categoría, contratado y operativo dentro de la fábrica — no experimentos, sino infraestructura profesional.</p>
  <div class="footer"><span>SaaS Factory · Ing. José E. Palomares</span><span>Página 3</span></div>
</div>

<!-- 3. HERRAMIENTAS UNA POR UNA -->
<div class="page">
  <div class="running">La Fábrica de Desarrollo SaaS Factory</div>
  <h2>3. Las herramientas, una por una</h2>
  <div class="cards">
    <div class="card"><div class="ico">🤖⌨️</div><div class="t">Claude Code (IA) — el desarrollador</div><div class="d">La Inteligencia Artificial que diseña la arquitectura, escribe el código, corrige errores y despliega. Es el corazón productivo: convierte una necesidad en un sistema funcionando, guiada por el consultor.</div></div>
    <div class="card"><div class="ico">⚛️</div><div class="t">Next.js — el framework</div><div class="d">La base sobre la que se construyen los sistemas (React). Da páginas rápidas, seguras y modernas, y una estructura ordenada de módulos.</div></div>
    <div class="card"><div class="ico">🔀</div><div class="t">GitHub — el control de versiones</div><div class="d">Guarda todo el historial del código. Cada cambio queda registrado y es reversible; nada se pierde y se puede volver a cualquier versión anterior.</div></div>
    <div class="card"><div class="ico">▲</div><div class="t">Vercel — la nube y el despliegue</div><div class="d">Publica los sistemas en internet con red global, HTTPS automático y despliegue continuo: cada cambio sube solo, en segundos, sin apagar el sistema.</div></div>
    <div class="card"><div class="ico">🗄️</div><div class="t">Bases de datos — KV, Blob, Supabase</div><div class="d">Donde vive la información. <b>Vercel KV</b> (Redis, ultrarrápida), <b>Vercel Blob</b> (archivos/datos por clave) y <b>Supabase</b> (PostgreSQL con Auth y seguridad por fila). Cada sistema usa la que mejor le conviene.</div></div>
    <div class="card"><div class="ico">🌐</div><div class="t">Neubox / DNS — los dominios</div><div class="d">El nombre público del sitio (ej. nortoneilatam.com). Se apunta el dominio a la nube y queda accesible con su propia dirección y candado de seguridad.</div></div>
    <div class="card"><div class="ico">✉️</div><div class="t">SMTP — el correo</div><div class="d">Envía cotizaciones, tareas, respaldos y notificaciones automáticas desde el propio sistema, con el correo corporativo.</div></div>
    <div class="card"><div class="ico">🧠</div><div class="t">Modelos de IA — el músculo</div><div class="d">Claude, GPT y Gemini: razonamiento, redacción, análisis de imágenes y reportes. Trabajan detrás para funciones inteligentes dentro de los sistemas.</div></div>
  </div>
  <div class="footer"><span>SaaS Factory · Ing. José E. Palomares</span><span>Página 4</span></div>
</div>

<!-- 4. FLUJO DE DESARROLLO -->
<div class="page">
  <div class="running">La Fábrica de Desarrollo SaaS Factory</div>
  <h2>4. El flujo de desarrollo (cómo opera día a día)</h2>
  <p>Así viaja un cambio, desde que se pide hasta que el cliente lo ve funcionando:</p>
  <div class="fig">
    <svg width="640" height="270" viewBox="0 0 640 270">
      ${[
        ['1','Se define la necesidad','El consultor traduce lo que el negocio necesita.','#1e5aa8'],
        ['2','La IA construye','Claude Code escribe/ajusta el código en el editor.','#0e7490'],
        ['3','Prueba local','Se valida en el computador antes de publicar.','#7c3aed'],
        ['4','Guarda en GitHub','El cambio queda versionado y reversible.','#334155'],
        ['5','Vercel despliega','Compila y publica automáticamente en la nube.','#0e2f57'],
        ['6','En producción','El cliente lo usa, con HTTPS y alta disponibilidad.','#15803d'],
      ].map((s,i)=>{
        const y=20+i*40
        return `<circle cx="40" cy="${y+10}" r="15" fill="${s[3]}"/><text x="40" y="${y+15}" text-anchor="middle" font-size="13" font-weight="800" fill="#fff">${s[0]}</text>
        <text x="68" y="${y+7}" font-size="13" font-weight="800" fill="#0e2f57">${s[1]}</text>
        <text x="68" y="${y+23}" font-size="11" fill="#64748b">${s[2]}</text>
        ${i<5?`<line x1="40" y1="${y+25} " x2="40" y2="${y+45}" stroke="#cbd5e1" stroke-width="2"/>`:''}`
      }).join('')}
    </svg>
    <div class="figcap">El ciclo completo puede repetirse muchas veces al día: mejoras continuas, seguras y sin interrupciones.</div>
  </div>
  <div class="box"><b>Regla de oro:</b> nunca se prueba directamente en producción. Todo cambio se valida antes (local y/o vista previa) para que el cliente solo reciba lo que ya funciona.</div>
  <div class="footer"><span>SaaS Factory · Ing. José E. Palomares</span><span>Página 5</span></div>
</div>

<!-- 5. ENTORNOS + DATOS -->
<div class="page">
  <div class="running">La Fábrica de Desarrollo SaaS Factory</div>
  <h2>5. Los tres entornos</h2>
  <div class="fig">
    <svg width="640" height="150" viewBox="0 0 640 150">
      ${[['💻','Local','En el computador. Se desarrolla y prueba sin afectar nada.','#7c3aed',110],
         ['🔎','Vista previa','En la nube, para validar/QA sin tocar el sitio en vivo.','#b45309',320],
         ['🌐','Producción','El sistema real que usan los clientes.','#15803d',530]].map((s,i)=>{
        const x=s[4]; return `<rect x="${x-95}" y="20" width="190" height="100" rx="12" fill="#fff" stroke="${s[3]}" stroke-width="2.5"/>
        <text x="${x}" y="58" text-anchor="middle" font-size="26">${s[0]}</text>
        <text x="${x}" y="82" text-anchor="middle" font-size="13" font-weight="800" fill="${s[3]}">${s[1]}</text>
        <foreignObject x="${x-88}" y="88" width="176" height="30"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:9.5px;color:#64748b;text-align:center;line-height:1.3">${s[2]}</div></foreignObject>
        ${i<2?`<path d="M${x+96} 70 L${x+114} 70" stroke="#94a3b8" stroke-width="2.5" marker-end="url(#ar2)"/>`:''}`
      }).join('')}
      <defs><marker id="ar2" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="#94a3b8"/></marker></defs>
    </svg>
    <div class="figcap">El cambio avanza de izquierda a derecha; solo llega a Producción lo que ya se validó.</div>
  </div>

  <h2 style="margin-top:14px;">6. ¿Dónde se guardan los datos?</h2>
  <table>
    <tr><th>Base de datos</th><th>Ideal para</th><th>Ejemplo real</th></tr>
    <tr><td><b>Vercel KV (Redis)</b></td><td>Datos rápidos por clave, respaldos automáticos</td><td>CRM Comercial, CRM Perú</td></tr>
    <tr><td><b>Vercel Blob</b></td><td>Datos y archivos por clave, aislados por sistema</td><td>CRM GTM</td></tr>
    <tr><td><b>Supabase (PostgreSQL)</b></td><td>Datos relacionales, autenticación y seguridad por fila (RLS)</td><td>Sistemas de gestión de operaciones</td></tr>
  </table>
  <p style="font-size:12px;color:#46566e"><b>Aislamiento:</b> cada sistema tiene su propia base de datos separada. Un incidente en uno nunca afecta a los demás — parte del control absoluto de la fábrica.</p>
  <div class="footer"><span>SaaS Factory · Ing. José E. Palomares</span><span>Página 6</span></div>
</div>

<!-- 7. CALIDAD + CIERRE -->
<div class="page">
  <div class="running">La Fábrica de Desarrollo SaaS Factory</div>
  <h2>7. Por qué los sistemas son hermosos y productivos</h2>
  <div class="cards">
    <div class="card"><div class="ico">🎨</div><div class="t">Diseño cuidado</div><div class="d">Interfaces limpias, con identidad corporativa (logo, colores), responsivas y bilingües (Español / Inglés).</div></div>
    <div class="card"><div class="ico">⚡</div><div class="t">Rápidos</div><div class="d">Red global, bases de datos veloces y despliegue en la nube: cargan al instante desde cualquier lugar.</div></div>
    <div class="card"><div class="ico">🛡️</div><div class="t">Seguros</div><div class="d">HTTPS, claves cifradas, accesos por rol y país, y cumplimiento de protección de datos (Habeas Data).</div></div>
    <div class="card"><div class="ico">💾</div><div class="t">Respaldados</div><div class="d">Copias automáticas periódicas con historial; restauración probada ante cualquier eventualidad.</div></div>
    <div class="card"><div class="ico">📈</div><div class="t">Escalables</div><div class="d">Sumar un país, un módulo o un sistema nuevo se hace por configuración, reutilizando la base probada.</div></div>
    <div class="card"><div class="ico">🔁</div><div class="t">Mejora continua</div><div class="d">Lo aprendido en un sistema fortalece a todos los demás — la fábrica evoluciona con cada proyecto.</div></div>
  </div>

  <h2 style="margin-top:16px;">En una frase</h2>
  <div class="box" style="border-left-color:#1e5aa8;background:#f3f8ff;">
    La <b>Fábrica de Desarrollo SaaS Factory</b> une a un <b>consultor experto</b>, la <b>Inteligencia Artificial</b> y un <b>ecosistema de herramientas líderes</b> (Next.js, GitHub, Vercel, Supabase, KV, Blob, Neubox…) en una línea de producción ordenada, segura y veloz — capaz de crear y mantener sistemas empresariales <b>hermosos, confiables y productivos</b>.
  </div>
  <div style="margin-top:12px;">
    <span class="badge">Claude / IA</span><span class="badge">Next.js</span><span class="badge">GitHub</span><span class="badge">Vercel</span><span class="badge">Supabase</span><span class="badge">Vercel KV</span><span class="badge">Vercel Blob</span><span class="badge">Neubox / DNS</span><span class="badge">SMTP</span><span class="badge">HTTPS / Nube global</span>
  </div>
  <p style="margin-top:16px; font-style:italic; color:#24405f;">Elaborado por el Ing. José E. Palomares — SaaS Factory · La Fábrica de Desarrollo.</p>
  <div class="footer"><span>SaaS Factory · Ing. José E. Palomares</span><span>Página 7</span></div>
</div>

</body></html>`

async function gen(){
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless:'new', args:['--no-sandbox','--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil:'networkidle0' })
  fs.mkdirSync(path.dirname(OUT_PDF), { recursive:true })
  await page.pdf({ path:OUT_PDF, format:'Letter', printBackground:true, margin:{top:'0',right:'0',bottom:'0',left:'0'}, preferCSSPageSize:true })
  await browser.close()
  console.log('OK PDF:', OUT_PDF, (fs.statSync(OUT_PDF).size/1024).toFixed(1)+' KB')
}
gen().catch(e=>{console.error('ERR',e); process.exit(1)})
