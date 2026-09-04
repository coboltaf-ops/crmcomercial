// RESPALDO COMPLETO del KV de producción. SOLO LECTURA del KV; escribe archivos locales.
import fs from 'fs'
import path from 'path'

// cargar credenciales
const env = fs.readFileSync('.env.production.local', 'utf-8')
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) {
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    process.env[m[1]] = v
  }
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const dir = path.join(process.cwd(), `_RESPALDO_KV_${stamp}`)
fs.mkdirSync(dir, { recursive: true })
fs.mkdirSync(path.join(dir, 'keys'), { recursive: true })

const { kv } = await import('@vercel/kv')
const keys = (await kv.keys('*')).sort()

const full = {}
const manifest = []
let ok = 0, err = 0
for (const k of keys) {
  try {
    const val = await kv.get(k)
    full[k] = val
    const count = Array.isArray(val) ? val.length : (val && typeof val === 'object' ? Object.keys(val).length : 1)
    manifest.push({ key: k, count, tipo: Array.isArray(val) ? 'array' : typeof val })
    // archivo individual legible (nombre saneado)
    const safe = k.replace(/[^a-zA-Z0-9_-]/g, '__')
    fs.writeFileSync(path.join(dir, 'keys', `${safe}.json`), JSON.stringify(val, null, 2))
    ok++
  } catch (e) {
    manifest.push({ key: k, count: 0, tipo: 'ERROR', error: e.message })
    err++
  }
}

// respaldo maestro (para restaurar exacto) + manifiesto
fs.writeFileSync(path.join(dir, 'backup-full.json'), JSON.stringify(full))
fs.writeFileSync(path.join(dir, 'MANIFEST.json'), JSON.stringify({ fecha: stamp, total_claves: keys.length, ok, err, items: manifest }, null, 2))

console.log('=== RESPALDO COMPLETO ===')
console.log('carpeta:', dir)
console.log('claves respaldadas OK:', ok, '| errores:', err, '| total:', keys.length)
console.log('tamaño backup-full.json:', (fs.statSync(path.join(dir, 'backup-full.json')).size / 1024).toFixed(1), 'KB')
console.log('\n-- claves de crmcomercial (datos principales) --')
for (const it of manifest.filter(x => /-datos$|^clientes$|^contactos$|^empresa|^auditoria|^usuarios|^roles/.test(x.key))) {
  console.log(`  ${it.key}: ${it.count} (${it.tipo})`)
}
