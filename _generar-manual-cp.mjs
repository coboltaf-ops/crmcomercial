// Genera el PDF del Manual de Control de Proyectos desde el HTML fuente.
// Reejecutar cada vez que se actualice public/manuales/control-proyectos.html
//   node _generar-manual-cp.mjs
import puppeteer from '/Users/josepalomares/aplicaciones/crmpalomaresconsultor/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js'
import fs from 'fs'
import path from 'path'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const SRC = path.resolve('public/manuales/control-proyectos.html')
const OUT_DOCS = path.resolve('docs/Proceso 360 de Control Proyectos/Manual Procedimientos y Uso Sistema Control de Proyectos.pdf')
const OUT_PUB = path.resolve('public/manuales/Manual-Procedimientos-Control-Proyectos.pdf')

if (!fs.existsSync(SRC)) { console.error('No existe el HTML fuente:', SRC); process.exit(1) }

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.goto('file://' + SRC, { waitUntil: 'networkidle0' })
const pdf = await page.pdf({
  format: 'A4',
  printBackground: true,
  margin: { top: '0', bottom: '0', left: '0', right: '0' },
})
await browser.close()

fs.writeFileSync(OUT_DOCS, pdf)
fs.mkdirSync(path.dirname(OUT_PUB), { recursive: true })
fs.writeFileSync(OUT_PUB, pdf)
console.log('PDF generado:')
console.log('  docs   →', OUT_DOCS, '(' + (pdf.length / 1024).toFixed(0) + ' KB)')
console.log('  public →', OUT_PUB)
