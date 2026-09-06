import puppeteer from '/Users/josepalomares/aplicaciones/crmpalomaresconsultor/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js'
import fs from 'fs'
import path from 'path'

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUT_PDF = '/Users/josepalomares/aplicaciones/crmcomercial/docs/Publicacion-Landing-Norton-Dominio-Tamoin.pdf'
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
  .cover h1 { font-size:36px; line-height:1.14; font-weight:800; margin-bottom:16px; }
  .cover .sub { font-size:16px; color:#cfe0f7; max-width:90%; }
  .cover .rule { width:66px; height:5px; background:#4d9bff; border-radius:3px; margin:26px 0; }
  .cover .meta { margin-top:auto; font-size:13px; color:#b9cff0; }
  .cover .meta b { color:#fff; }
  .running { font-size:10.5px; letter-spacing:2px; text-transform:uppercase; color:#9fb2cc; margin-bottom:16px; border-bottom:1px solid #eef3fa; padding-bottom:8px; }
  h2 { font-size:20px; color:#123a6b; font-weight:800; margin:6px 0 12px; }
  h3 { font-size:15px; color:#1e5aa8; font-weight:700; margin:16px 0 6px; }
  p { margin-bottom:10px; }
  .lead { font-size:14.5px; color:#2b3a52; }
  ul { margin:6px 0 12px 18px; } li { margin-bottom:6px; }
  table { width:100%; border-collapse:collapse; margin:12px 0; font-size:12.5px; }
  th { background:#123a6b; color:#fff; text-align:left; padding:9px 11px; font-weight:600; }
  td { padding:9px 11px; border-bottom:1px solid #e2ebf7; vertical-align:top; }
  tr:nth-child(even) td { background:#f6f9ff; }
  td b, td code { color:#123a6b; }
  code { font-family:'SF Mono',Consolas,monospace; background:#eef3fb; padding:1px 6px; border-radius:4px; font-size:12px; color:#123a6b; }
  .step { display:flex; gap:14px; margin:14px 0; }
  .step .num { flex:0 0 34px; height:34px; background:#123a6b; color:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:15px; }
  .step .body { flex:1; }
  .step .ti { font-size:15px; font-weight:700; color:#123a6b; margin-bottom:3px; }
  .step .st { font-size:11px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; }
  .ok { color:#15803d; } .pend { color:#b45309; }
  .box { border-left:4px solid #4d9bff; background:#f3f8ff; padding:12px 16px; margin:12px 0; border-radius:0 8px 8px 0; }
  .footer { position:absolute; bottom:0.4in; left:0.85in; right:0.85in; display:flex; justify-content:space-between; font-size:10px; color:#9fb2cc; border-top:1px solid #eef3fa; padding-top:6px; }
</style></head><body>

<div class="page cover">
  <div class="kicker">TI · LATAM · Grupo Tamoin</div>
  <h1>Publicación de la Landing Norton<br>en el Dominio Corporativo</h1>
  <div class="rule"></div>
  <div class="sub">Procedimiento técnico paso a paso para publicar el sitio de Norton Edificios Industriales en el dominio <b>nortoneilatam.com</b> provisto por Grupo Tamoin.</div>
  <div style="margin-top:26px; padding:14px 18px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.18); border-radius:10px; max-width:88%;">
    <div style="font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#8fbaff; margin-bottom:4px;">Dirigido a</div>
    <div style="font-size:17px; font-weight:800; color:#ffffff;">José Abreu</div>
    <div style="font-size:13px; color:#cfe0f7;">Responsable de Transformación Digital LATAM</div>
  </div>
  <div class="meta">Documento técnico · ${FECHA}<br>Elaborado por <b>Ing. José E. Palomares</b> — Consultor de Desarrollo y Sistemas de Información</div>
</div>

<div class="page">
  <div class="running">Publicación de la Landing Norton · Dominio Corporativo</div>
  <h2>1. Objetivo</h2>
  <p class="lead">Dejar el sitio web de <b>Norton Edificios Industriales</b> publicado y accesible al público bajo el dominio corporativo <b>nortoneilatam.com</b>, entregado por el área de TI de Grupo Tamoin, con conexión segura (HTTPS) y de forma profesional, estable y reversible.</p>

  <h2 style="margin-top:22px;">2. Punto de partida</h2>
  <table>
    <tr><th>Elemento</th><th>Estado inicial</th></tr>
    <tr><td><b>Sitio web (landing)</b></td><td>Desarrollado y desplegado en la nube (Vercel), visible en la URL técnica <code>nortonlanding.vercel.app</code>.</td></tr>
    <tr><td><b>Dominio</b></td><td><code>nortoneilatam.com</code>, provisto por Tamoin, registrado en el proveedor <b>Neubox</b>.</td></tr>
    <tr><td><b>Credenciales</b></td><td>Acceso al panel de Neubox entregado por Tamoin para administrar el DNS del dominio.</td></tr>
    <tr><td><b>DNS inicial</b></td><td>El dominio apuntaba a la página por defecto de Neubox (no al sitio de Norton).</td></tr>
  </table>
  <p>El reto: <b>conectar</b> el dominio corporativo con el sitio ya publicado, sin exponer nada inseguro y manteniendo el control total del proceso.</p>
  <div class="footer"><span>TI · LATAM · Grupo Tamoin</span><span>Página 2</span></div>
</div>

<div class="page">
  <div class="running">Publicación de la Landing Norton · Dominio Corporativo</div>
  <h2>3. Procedimiento paso a paso</h2>

  <div class="step"><div class="num">1</div><div class="body"><div class="ti">Verificar el sitio en producción</div>
  <div class="st ok">✔ Hecho</div><p>Se confirmó que la landing responde correctamente en la nube (HTTP 200) en su URL técnica de Vercel. El sitio ya estaba listo para recibir el dominio.</p></div></div>

  <div class="step"><div class="num">2</div><div class="body"><div class="ti">Registrar el dominio en la plataforma</div>
  <div class="st ok">✔ Hecho</div><p>Se agregó <code>nortoneilatam.com</code> a la cuenta de la plataforma (Vercel), quedando bajo administración centralizada junto con los demás sistemas.</p></div></div>

  <div class="step"><div class="num">3</div><div class="body"><div class="ti">Asignar el dominio al proyecto de la landing</div>
  <div class="st ok">✔ Hecho</div><p>Se vinculó el dominio <b>y su versión con www</b> (<code>nortoneilatam.com</code> y <code>www.nortoneilatam.com</code>) al proyecto de la landing, de modo que ambas direcciones sirvan el sitio de Norton.</p></div></div>

  <div class="step"><div class="num">4</div><div class="body"><div class="ti">Diagnosticar el DNS actual</div>
  <div class="st ok">✔ Hecho</div><p>Se revisó a dónde apuntaba el dominio: seguía dirigido a la página por defecto de Neubox. Se identificaron los registros exactos que debían cambiarse para dirigirlo a la infraestructura del sitio.</p></div></div>

  <div class="step"><div class="num">5</div><div class="body"><div class="ti">Configurar el DNS en Neubox</div>
  <div class="st pend">▶ Acción final en el panel del dominio</div><p>En el panel de Neubox, en la Zona DNS de <code>nortoneilatam.com</code>, se establecen los siguientes registros:</p></div></div>
  <table>
    <tr><th>Tipo</th><th>Nombre</th><th>Valor</th><th>Función</th></tr>
    <tr><td><b>A</b></td><td><code>@</code></td><td><code>76.76.21.21</code></td><td>Apunta el dominio raíz a la infraestructura del sitio.</td></tr>
    <tr><td><b>CNAME</b></td><td><code>www</code></td><td><code>cname.vercel-dns.com</code></td><td>Apunta la versión con www al sitio.</td></tr>
  </table>
  <p style="font-size:12px;color:#46566e;">Alternativa equivalente: cambiar los <i>nameservers</i> del dominio a <code>ns1.vercel-dns.com</code> y <code>ns2.vercel-dns.com</code> (delega todo el DNS a la plataforma). Se prefirió la opción de registros por ser más específica y no afectar otros servicios del dominio (como el correo).</p>
  <div class="footer"><span>TI · LATAM · Grupo Tamoin</span><span>Página 3</span></div>
</div>

<div class="page">
  <div class="running">Publicación de la Landing Norton · Dominio Corporativo</div>

  <div class="step"><div class="num">6</div><div class="body"><div class="ti">Verificación y certificado de seguridad (SSL)</div>
  <div class="st ok">✔ Automático</div><p>Una vez propagado el DNS (entre 15 minutos y 2 horas), la plataforma <b>verifica el dominio y emite automáticamente el certificado SSL</b>, habilitando el candado de seguridad (HTTPS). No requiere intervención manual.</p></div></div>

  <div class="step"><div class="num">7</div><div class="body"><div class="ti">Comprobación final</div>
  <div class="st ok">✔ Verificable</div><p>Se confirma que <code>https://nortoneilatam.com</code> y <code>https://www.nortoneilatam.com</code> muestran la landing de Norton con conexión segura. A partir de ese momento, el sitio queda <b>publicado oficialmente en el dominio corporativo</b>.</p></div></div>

  <h2 style="margin-top:14px;">4. Resultado</h2>
  <div class="box">
  <b>La landing de Norton Edificios Industriales queda publicada en el dominio corporativo <code>nortoneilatam.com</code></b>, con HTTPS, sobre una red global de alta disponibilidad, y administrada de forma centralizada junto al resto del ecosistema digital.
  </div>

  <h2 style="margin-top:14px;">5. Buenas prácticas aplicadas</h2>
  <ul>
    <li><b>Reversibilidad:</b> los cambios de DNS pueden revertirse en cualquier momento desde el panel del dominio.</li>
    <li><b>Sin afectar otros servicios:</b> se usaron registros específicos (A y CNAME) para no interferir con el correo u otros servicios del dominio.</li>
    <li><b>Seguridad por defecto:</b> HTTPS/SSL automático; todo el tráfico cifrado.</li>
    <li><b>Administración centralizada:</b> el dominio y el sitio quedan bajo la misma cuenta de plataforma, con trazabilidad de despliegues.</li>
    <li><b>Independencia:</b> la landing es un proyecto independiente; su publicación no afecta a los CRM ni a sus datos.</li>
  </ul>

  <p style="margin-top:16px; font-style:italic; color:#24405f;">Procedimiento ejecutado y documentado por el Ing. José E. Palomares para el área de TI LATAM de Grupo Tamoin.</p>
  <div class="footer"><span>TI · LATAM · Grupo Tamoin</span><span>Página 4</span></div>
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
