import puppeteer from '/Users/josepalomares/aplicaciones/crmpalomaresconsultor/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js'
import fs from 'fs'
import path from 'path'

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUT_PDF = '/Users/josepalomares/aplicaciones/nortonlanding/docs/Proceso-Implementacion-TI-LATAM-Tamoin.pdf'
const FECHA = '06 de septiembre de 2026'

const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><style>
  @page { size: Letter; margin: 0; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif; color:#1a2332; line-height:1.6; font-size:13.5px; }
  .page { width:8.5in; min-height:11in; padding:0.8in 0.85in 0.7in; page-break-after:always; position:relative; background:#fff; }
  .page:last-child { page-break-after:auto; }
  .cover { background:linear-gradient(155deg,#0a1f44 0%,#123a6b 55%,#1e5aa8 100%); color:#fff; display:flex; flex-direction:column; justify-content:center; padding:0.95in 0.85in; }
  .cover .kicker { font-size:12px; letter-spacing:3px; text-transform:uppercase; color:#8fbaff; margin-bottom:20px; }
  .cover h1 { font-size:38px; line-height:1.12; font-weight:800; margin-bottom:16px; }
  .cover .sub { font-size:16px; color:#cfe0f7; max-width:88%; }
  .cover .rule { width:66px; height:5px; background:#4d9bff; border-radius:3px; margin:26px 0; }
  .cover .meta { margin-top:auto; font-size:13px; color:#b9cff0; }
  .cover .meta b { color:#fff; }
  .running { font-size:10.5px; letter-spacing:2px; text-transform:uppercase; color:#9fb2cc; margin-bottom:16px; border-bottom:1px solid #eef3fa; padding-bottom:8px; }
  h2 { font-size:20px; color:#123a6b; font-weight:800; margin:6px 0 12px; }
  h3 { font-size:15px; color:#1e5aa8; font-weight:700; margin:18px 0 6px; }
  p { margin-bottom:10px; }
  .lead { font-size:14.5px; color:#2b3a52; }
  ul { margin:6px 0 12px 18px; } li { margin-bottom:6px; }
  .cards { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:14px 0; }
  .card { background:#f6f9ff; border:1px solid #e2ebf7; border-radius:10px; padding:14px; }
  .card .ico { font-size:22px; margin-bottom:6px; }
  .card .t { font-weight:700; color:#123a6b; font-size:13.5px; margin-bottom:3px; }
  .card .d { font-size:12px; color:#46566e; }
  table { width:100%; border-collapse:collapse; margin:12px 0; font-size:12.5px; }
  th { background:#123a6b; color:#fff; text-align:left; padding:9px 11px; font-weight:600; }
  td { padding:9px 11px; border-bottom:1px solid #e2ebf7; vertical-align:top; }
  tr:nth-child(even) td { background:#f6f9ff; }
  td b { color:#123a6b; }
  .fase { border-left:4px solid #4d9bff; background:#f3f8ff; padding:12px 16px; margin:12px 0; border-radius:0 8px 8px 0; }
  .fase .n { font-size:11px; font-weight:800; color:#1e5aa8; letter-spacing:1px; text-transform:uppercase; }
  .fase .ti { font-size:15px; font-weight:700; color:#123a6b; margin:2px 0 6px; }
  .chk { color:#15803d; font-weight:700; }
  .footer { position:absolute; bottom:0.4in; left:0.85in; right:0.85in; display:flex; justify-content:space-between; font-size:10px; color:#9fb2cc; border-top:1px solid #eef3fa; padding-top:6px; }
  .badge { display:inline-block; background:#e8f0fe; color:#1e3a8a; border:1px solid #c7d9f7; border-radius:20px; padding:2px 10px; font-size:11px; font-weight:600; margin:2px 4px 2px 0; }
</style></head><body>

<div class="page cover">
  <div class="kicker">TI · LATAM · Grupo Tamoin</div>
  <h1>Ecosistema Digital<br>Norton / GTM LATAM</h1>
  <div class="rule"></div>
  <div class="sub">Proceso de implementación, publicación y control de las plataformas (CRM multipaís, CRM de obras y sitio corporativo). Arquitectura, paso a paso y gobernanza de nuestras APIs.</div>
  <div style="margin-top:26px; padding:14px 18px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.18); border-radius:10px; max-width:88%;">
    <div style="font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#8fbaff; margin-bottom:4px;">Dirigido a</div>
    <div style="font-size:17px; font-weight:800; color:#ffffff;">José Abreu</div>
    <div style="font-size:13px; color:#cfe0f7;">Responsable de Transformación Digital LATAM</div>
  </div>
  <div class="meta">Documento técnico-ejecutivo · ${FECHA}<br>Elaborado por <b>Ing. José E. Palomares</b> — Consultor de Desarrollo y Sistemas de Información</div>
</div>

<div class="page">
  <div class="running">Ecosistema Digital Norton / GTM LATAM</div>
  <h2>1. Objetivo del documento</h2>
  <p class="lead">Este documento explica, de forma clara y ordenada, <b>qué se construyó, cómo se hizo y bajo qué control</b> operan las plataformas digitales de Norton y GTM en la región LATAM. Su fin es dar al área de <b>TI de Grupo Tamoin</b> plena visibilidad y certeza sobre el alcance, la seguridad y el gobierno de estos sistemas.</p>
  <p>Se busca demostrar <b>profesionalismo y control absoluto</b> sobre la infraestructura: cada sistema tiene su propósito, su base de datos, sus respaldos y su modelo de acceso definidos y documentados.</p>

  <h2 style="margin-top:26px;">2. Visión general del ecosistema</h2>
  <p>El ecosistema se compone de tres plataformas independientes pero coherentes entre sí:</p>
  <div class="cards">
    <div class="card"><div class="ico">🏢</div><div class="t">CRM Comercial (Multipaís)</div><div class="d">Gestión comercial de Norton para varios países desde un solo sistema. Cada usuario ve solo su país; la dirección (HQ) ve todo.</div></div>
    <div class="card"><div class="ico">🏗️</div><div class="t">CRM GTM (Obras / Ofertas)</div><div class="d">Sistema para presupuestos de ofertas, capítulos de obra, contratistas y seguimiento de obras. Inicia operación en Perú.</div></div>
    <div class="card"><div class="ico">🌐</div><div class="t">Sitio Corporativo</div><div class="d">Landing de Norton Edificios Industriales, publicada bajo dominio propio para presencia y captación de contactos.</div></div>
    <div class="card"><div class="ico">🔐</div><div class="t">Control central</div><div class="d">Todo administrado desde una sola cuenta de plataforma, con entornos, respaldos y accesos gobernados.</div></div>
  </div>
  <div class="footer"><span>TI · LATAM · Grupo Tamoin</span><span>Página 2</span></div>
</div>

<div class="page">
  <div class="running">Ecosistema Digital Norton / GTM LATAM</div>
  <h2>3. Arquitectura técnica</h2>
  <p>Las plataformas usan tecnología moderna, estándar de la industria y de alta disponibilidad:</p>
  <table>
    <tr><th>Componente</th><th>Tecnología</th><th>Función</th></tr>
    <tr><td><b>Aplicación</b></td><td>Next.js (React)</td><td>Interfaz web y lógica de negocio, renderizado rápido y seguro.</td></tr>
    <tr><td><b>Infraestructura</b></td><td>Vercel (nube global)</td><td>Despliegue automático, red global (Edge), certificados SSL y escalado.</td></tr>
    <tr><td><b>Datos CRM Comercial</b></td><td>Vercel KV (Redis)</td><td>Base de datos rápida en la nube, con respaldos automáticos.</td></tr>
    <tr><td><b>Datos CRM GTM</b></td><td>Vercel Blob</td><td>Almacenamiento de datos por clave, propio y aislado del resto.</td></tr>
    <tr><td><b>Correo</b></td><td>SMTP corporativo</td><td>Envío de cotizaciones, tareas y notificaciones desde el sistema.</td></tr>
    <tr><td><b>Dominio</b></td><td>DNS (registrador)</td><td>Nombre público del sitio, apuntado a la infraestructura.</td></tr>
  </table>
  <h3>Principio clave: aislamiento por sistema</h3>
  <p>Cada sistema tiene su <b>propia base de datos separada</b>. Un incidente en uno no afecta a los demás. Esto es parte del control que ejercemos: los datos de cada operación están contenidos y protegidos de forma independiente.</p>
  <h3>Modelo multipaís "un sistema por empresa"</h3>
  <p>El CRM Comercial incorpora un modelo donde <b>cada usuario pertenece a un país</b> y solo ve la información de ese país; un rol especial <b>GLOBAL (HQ/Dirección)</b> ve y administra todos los países. El filtro se aplica en el servidor, garantizando que la separación de datos por país no dependa del navegador del usuario.</p>
  <div class="footer"><span>TI · LATAM · Grupo Tamoin</span><span>Página 3</span></div>
</div>

<div class="page">
  <div class="running">Ecosistema Digital Norton / GTM LATAM</div>
  <h2>4. El proceso paso a paso</h2>
  <p>Así se construyó y publicó el ecosistema, de principio a fin:</p>

  <div class="fase"><div class="n">Fase 1 · Base multipaís</div><div class="ti">Preparar el CRM para operar en varios países</div>
  Se habilitó el catálogo de países y la ubicación geográfica de cada uno (Colombia: Región/Departamento/Ciudad; <b>Perú: Departamento/Provincia/Distrito</b>; Ecuador: Provincia/Cantón/Parroquia), de modo que al registrar un cliente el sistema muestra la estructura correcta según el país.</div>

  <div class="fase"><div class="n">Fase 2 · Control de acceso por país</div><div class="ti">Cada quien ve lo que le corresponde</div>
  Se incorporó el campo <b>País</b> a cada usuario y el filtrado en el servidor: el equipo de cada país ve solo su información, y la Dirección (GLOBAL) ve el consolidado. <span class="chk">Verificado.</span></div>

  <div class="fase"><div class="n">Fase 3 · Despliegue en producción</div><div class="ti">Publicar las plataformas de forma segura</div>
  Cada sistema se compiló, se validó y se desplegó a producción en infraestructura de nube, con su base de datos y sus variables de entorno (secretos de sesión, correo, almacenamiento) configuradas por entorno. <span class="chk">CRM Comercial y CRM GTM en producción.</span></div>

  <div class="fase"><div class="n">Fase 4 · Usuarios y credenciales</div><div class="ti">Alta de equipos con acceso controlado</div>
  Se dieron de alta los usuarios de cada operación con sus roles y claves cifradas. Las contraseñas se guardan <b>cifradas</b> (algoritmo scrypt), nunca en texto plano; solo un administrador puede consultarlas dentro del sistema.</div>

  <div class="fase"><div class="n">Fase 5 · Sitio corporativo y dominio</div><div class="ti">Presencia pública bajo dominio propio</div>
  Se desplegó la landing de <b>Norton Edificios Industriales</b> y se vinculó el dominio corporativo, con certificado SSL automático, para que sea accesible públicamente y transmita imagen profesional.</div>

  <div class="fase"><div class="n">Fase 6 · Respaldos y continuidad</div><div class="ti">Nada se pierde</div>
  Cada sistema genera <b>respaldos automáticos periódicos</b> de toda su información, con historial de versiones, permitiendo restaurar el estado ante cualquier eventualidad. <span class="chk">Probado en un caso real de restauración.</span></div>
  <div class="footer"><span>TI · LATAM · Grupo Tamoin</span><span>Página 4</span></div>
</div>

<div class="page">
  <div class="running">Ecosistema Digital Norton / GTM LATAM</div>
  <h2>5. Control y gobernanza de las APIs</h2>
  <p>El "control absoluto" no es una frase: se sostiene en prácticas concretas de gobierno técnico:</p>
  <ul>
    <li><b>Cuenta única de administración:</b> todos los proyectos viven bajo una sola cuenta de plataforma, con visibilidad total de despliegues, dominios y bases de datos.</li>
    <li><b>Entornos separados:</b> Producción, Vista previa (Preview) y Desarrollo, para probar sin afectar lo que está en vivo.</li>
    <li><b>Secretos protegidos:</b> las claves sensibles (sesión, correo, almacenamiento) se guardan cifradas como variables de entorno; nunca en el código.</li>
    <li><b>Bases de datos aisladas:</b> cada sistema con su propia base, evitando que una operación afecte a otra.</li>
    <li><b>Respaldos automáticos:</b> copias periódicas con historial, más la capacidad de exportar los datos completos.</li>
    <li><b>Despliegue trazable:</b> cada publicación queda registrada y es reversible; se puede volver a una versión anterior.</li>
    <li><b>SSL y red global:</b> todo el tráfico cifrado (HTTPS) y servido desde una red mundial de alta disponibilidad.</li>
  </ul>

  <h2 style="margin-top:22px;">6. Alcances para TI LATAM — Grupo Tamoin</h2>
  <div class="cards">
    <div class="card"><div class="ico">✅</div><div class="t">Operativo hoy</div><div class="d">CRM Comercial multipaís y CRM GTM en producción; sitio corporativo desplegado y en proceso de publicación bajo dominio propio.</div></div>
    <div class="card"><div class="ico">📈</div><div class="t">Escalable</div><div class="d">Sumar un país nuevo o un módulo se hace por configuración, sin rehacer el sistema.</div></div>
    <div class="card"><div class="ico">🛡️</div><div class="t">Seguro y respaldado</div><div class="d">Datos cifrados, accesos por rol y país, respaldos automáticos y restauración probada.</div></div>
    <div class="card"><div class="ico">🤝</div><div class="t">Transferible</div><div class="d">Documentación y formación disponibles para que TI de Tamoin conozca y opere el modelo.</div></div>
  </div>

  <h2 style="margin-top:20px;">7. Conclusión</h2>
  <p>El ecosistema digital de Norton / GTM en LATAM está <b>construido, desplegado y bajo control</b>, con una arquitectura moderna, segura y escalable. Cada pieza tiene su función, su aislamiento y su respaldo, y todo el conjunto se administra de forma centralizada y trazable. Esto le da a Grupo Tamoin una base tecnológica <b>profesional, confiable y lista para crecer</b> en la región.</p>
  <div style="margin-top:16px;">
    <span class="badge">CRM Comercial Multipaís</span><span class="badge">CRM GTM Obras</span><span class="badge">Sitio Corporativo</span><span class="badge">Respaldos Automáticos</span><span class="badge">Acceso por País</span><span class="badge">SSL / Nube Global</span>
  </div>
  <p style="margin-top:18px; font-style:italic; color:#24405f;">Preparado por el Ing. José E. Palomares para el área de TI LATAM de Grupo Tamoin.</p>
  <div class="footer"><span>TI · LATAM · Grupo Tamoin</span><span>Página 5</span></div>
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
