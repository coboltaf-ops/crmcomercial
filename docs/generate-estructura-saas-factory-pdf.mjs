import puppeteer from '/Users/josepalomares/aplicaciones/crmpalomaresconsultor/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js'
import fs from 'fs'
import path from 'path'

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUT_PDF = '/Users/josepalomares/aplicaciones/crmcomercial/docs/Estructura-SaaS-Factory.pdf'

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  @page { size: Letter; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; color: #1a2332; line-height: 1.6; font-size: 14px; }
  .page { width: 8.5in; min-height: 11in; padding: 0.85in 0.9in; page-break-after: always; position: relative; background: #fff; }
  .page:last-child { page-break-after: auto; }

  .cover { background: linear-gradient(150deg, #0b1f3a 0%, #123a6b 55%, #1e5aa8 100%); color: #fff; display: flex; flex-direction: column; justify-content: center; }
  .cover .kicker { font-size: 13px; letter-spacing: 3px; text-transform: uppercase; color: #7fb2ff; margin-bottom: 22px; }
  .cover h1 { font-size: 46px; line-height: 1.1; font-weight: 800; margin-bottom: 18px; }
  .cover .sub { font-size: 17px; color: #cfe0f7; max-width: 80%; }
  .cover .rule { width: 70px; height: 5px; background: #4d9bff; border-radius: 3px; margin: 30px 0; }
  .cover .author { margin-top: auto; font-size: 14px; color: #b9cff0; }
  .cover .author b { color: #fff; }

  h2 { font-size: 22px; color: #123a6b; font-weight: 800; margin: 8px 0 14px; border-bottom: 3px solid #e2ebf7; padding-bottom: 8px; }
  h3 { font-size: 16px; color: #1e5aa8; font-weight: 700; margin: 22px 0 8px; }
  p { margin-bottom: 12px; }
  .lead { font-size: 15px; color: #2b3a52; }
  blockquote { border-left: 4px solid #4d9bff; background: #f3f8ff; padding: 14px 18px; margin: 16px 0; font-style: italic; color: #24405f; border-radius: 0 8px 8px 0; }
  blockquote .who { display: block; font-style: normal; font-weight: 700; margin-top: 8px; color: #123a6b; font-size: 13px; }

  .running { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #9fb2cc; margin-bottom: 18px; }

  .cards { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 16px 0; }
  .card { background: #f6f9ff; border: 1px solid #e2ebf7; border-radius: 12px; padding: 16px; }
  .card .ico { font-size: 26px; margin-bottom: 8px; }
  .card .t { font-weight: 700; color: #123a6b; margin-bottom: 4px; font-size: 14px; }
  .card .d { font-size: 12.5px; color: #46566e; }

  table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 13px; }
  th { background: #123a6b; color: #fff; text-align: left; padding: 10px 12px; font-weight: 600; }
  td { padding: 10px 12px; border-bottom: 1px solid #e2ebf7; vertical-align: top; }
  tr:nth-child(even) td { background: #f6f9ff; }
  td b { color: #123a6b; }

  ul { margin: 8px 0 12px 20px; }
  li { margin-bottom: 7px; }

  .footer { position: absolute; bottom: 0.45in; left: 0.9in; right: 0.9in; display: flex; justify-content: space-between; font-size: 10.5px; color: #9fb2cc; border-top: 1px solid #eef3fa; padding-top: 6px; }
</style>
</head>
<body>

  <div class="page cover">
    <div class="kicker">SaaS Factory</div>
    <h1>Estructura de<br>SaaS Factory</h1>
    <div class="rule"></div>
    <div class="sub">La fábrica de desarrollo de software empresarial asistido con Inteligencia Artificial: pilares, respaldo internacional, herramientas y modelo de seguridad.</div>
    <div class="author">Documento base: <b>Recomendaciones · Nuevo CRM con IA</b><br>Ing. <b>José E. Palomares</b> — Consultor SaaS Factory</div>
  </div>

  <div class="page">
    <div class="running">Estructura de SaaS Factory</div>
    <h2>1. Qué es SaaS Factory</h2>
    <p class="lead">En la organización <b>SaaS Factory</b> hemos preparado, en el más estricto sentido de la palabra, una verdadera <b>fábrica de desarrollo de software</b> para personal de alto nivel, capaz de entender los procesos empresariales y desarrollar aplicativos aprovechando la maravilla de la Inteligencia Artificial.</p>

    <h3>Una fábrica, no un taller</h3>
    <p>La diferencia es importante. Un <b>taller</b> hace cosas a mano, una por una, con resultados que dependen del estado de ánimo del artesano. Una <b>fábrica</b>, en cambio, tiene procesos estandarizados, herramientas profesionales, controles de calidad y capacidad de producción a escala.</p>
    <p>Eso es SaaS Factory: <b>una fábrica preparada para entregar software empresarial con velocidad, calidad y consistencia.</b></p>

    <h2 style="margin-top:34px;">2. Los pilares de la fábrica</h2>
    <div class="cards">
      <div class="card"><div class="ico">👨‍💼</div><div class="t">Personal de alto nivel</div><div class="d">Consultores con experiencia comprobada en operaciones empresariales, no únicamente programadores.</div></div>
      <div class="card"><div class="ico">⚡</div><div class="t">IA en cada etapa</div><div class="d">Las herramientas de IA más potentes del mundo trabajando en cada paso del desarrollo.</div></div>
      <div class="card"><div class="ico">🔧</div><div class="t">Procesos estandarizados</div><div class="d">Cada sistema sigue una metodología probada, con resultados predecibles y de alta calidad.</div></div>
      <div class="card"><div class="ico">🔁</div><div class="t">Mejora continua</div><div class="d">Lo aprendido en un cliente fortalece los desarrollos para todos los demás clientes de la fábrica.</div></div>
    </div>
    <div class="footer"><span>SaaS Factory · Ing. José E. Palomares</span><span>Página 2</span></div>
  </div>

  <div class="page">
    <div class="running">Estructura de SaaS Factory</div>
    <h2>3. El contrato con SaaS Factory México</h2>
    <p>Como <b>Consultor de SaaS Factory</b>, mantengo un contrato directo con la operación de <b>SaaS Factory México</b>, lo que significa que el cliente tiene a su disposición las mismas herramientas, los mismos protocolos de seguridad y los mismos estándares de calidad que utilizan los clientes corporativos atendidos desde esa operación regional.</p>
    <p>Para el cliente, esto se traduce en:</p>
    <ul>
      <li>Respaldo de una <b>organización internacional</b>.</li>
      <li>Acceso a las <b>herramientas más avanzadas del mercado</b>.</li>
      <li>La tranquilidad de saber que el modelo de trabajo <b>no depende de una sola persona</b>, sino de <b>toda una estructura empresarial sólida y respaldada</b>.</li>
    </ul>

    <h2 style="margin-top:32px;">4. Herramientas de IA al servicio del cliente</h2>
    <p>No son experimentos: son <b>productos comerciales de las compañías tecnológicas más importantes del mundo</b>, contratadas, pagadas y operativas dentro del ecosistema SaaS Factory para construir y mantener cada CRM.</p>
    <table>
      <tr><th>Herramienta</th><th>Empresa creadora</th><th>Aplicación en el CRM</th></tr>
      <tr><td><b>Claude 4.7</b></td><td>Anthropic (USA)</td><td>Razonamiento avanzado, diseño de arquitectura, redacción de código y validación de lógica de negocio. Es la IA principal del proceso.</td></tr>
      <tr><td><b>GPT-5 / GPT-4</b></td><td>OpenAI (USA)</td><td>Generación de textos, cotizaciones, mensajes al usuario, comunicaciones y soporte conversacional dentro del CRM.</td></tr>
      <tr><td><b>Gemini 2.5</b></td><td>Google (USA)</td><td>Análisis de imágenes, procesamiento multimodal, generación de assets gráficos y reportes ejecutivos visuales.</td></tr>
      <tr><td><b>Vercel AI Gateway</b></td><td>Vercel (USA)</td><td>Orquestación y enrutamiento de los modelos de IA dentro de la infraestructura del CRM.</td></tr>
    </table>
    <div class="footer"><span>SaaS Factory · Ing. José E. Palomares</span><span>Página 3</span></div>
  </div>

  <div class="page">
    <div class="running">Estructura de SaaS Factory</div>
    <h2>5. Seguridad e infraestructura que maneja la fábrica</h2>
    <p>Lo más importante en cualquier desarrollo que SaaS Factory entrega a sus clientes es que el cliente esté <b>tranquilo y seguro de que la infraestructura funcionará siempre</b>. Sin interrupciones, sin pérdidas de información, sin sorpresas desagradables. Esa es la esencia del trabajo, y sobre ese pilar se construye todo lo demás.</p>
    <div class="cards">
      <div class="card"><div class="ico">🛡️</div><div class="t">Seguridad permanente</div><div class="d">Datos en infraestructura de alto nivel, con replicación automática en servidores profesionales y cumplimiento de la Ley de Habeas Data (Ley 1581).</div></div>
      <div class="card"><div class="ico">💾</div><div class="t">Respaldos en poder del cliente</div><div class="d">Copias semanales automáticas en un equipo local y/o en un Google Drive corporativo asignado. La infraestructura ya genera respaldos automáticos por su cuenta.</div></div>
      <div class="card"><div class="ico">👥</div><div class="t">Empoderamiento del equipo</div><div class="d">Entrenamiento a una persona del cliente en la estructura, la forma de programar y todo el modelo de desarrollo.</div></div>
      <div class="card"><div class="ico">🤖</div><div class="t">IA de última generación</div><div class="d">Cada CRM se construye con Claude 4.7, GPT-5, Gemini 2.5, Vercel AI Gateway y más.</div></div>
    </div>

    <h2 style="margin-top:30px;">6. El modelo de valor</h2>
    <p>La misión del consultor con cada cliente es <b>bajar los costos operativos</b> del proceso comercial, aprovechando todas las herramientas de SaaS Factory para desarrollos rápidos, seguros y de alta calidad. Tres ejes de optimización:</p>
    <ul>
      <li>💰 <b>Costo de licenciamiento</b> — Eliminación del costo recurrente de licencias y módulos premium de plataformas genéricas.</li>
      <li>⚡ <b>Costo de tiempo</b> — Cotizaciones, seguimientos, PQRS y reportes ejecutivos automatizados con IA.</li>
      <li>🎯 <b>Costo de errores</b> — Reducción drástica de errores al eliminar la doble digitación y los formularios manuales.</li>
    </ul>
    <blockquote>
      "El cambio de paradigma es radical. Hoy, gracias a la combinación de un consultor humano experto con las herramientas de IA más avanzadas del mundo, podemos construir un CRM corporativo en una fracción del tiempo y del costo que hace apenas dos años hubiera requerido."
      <span class="who">— Ing. José E. Palomares, Consultor SaaS Factory</span>
    </blockquote>
    <div class="footer"><span>SaaS Factory · Ing. José E. Palomares</span><span>Página 4</span></div>
  </div>

</body>
</html>`

async function generatePDF() {
  console.log('🚀 Lanzando Chrome...')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle0' })
  fs.mkdirSync(path.dirname(OUT_PDF), { recursive: true })
  await page.pdf({
    path: OUT_PDF,
    format: 'Letter',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    preferCSSPageSize: true,
  })
  await browser.close()
  const stat = fs.statSync(OUT_PDF)
  console.log(`✅ PDF generado: ${OUT_PDF}`)
  console.log(`   Tamaño: ${(stat.size / 1024).toFixed(1)} KB`)
}

generatePDF().catch((err) => { console.error('❌ Error:', err); process.exit(1) })
