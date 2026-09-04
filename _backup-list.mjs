// SOLO LECTURA: lista las claves del KV de producción. No escribe nada.
import fs from 'fs'

// cargar .env.production.local manualmente (sin dotenv)
const env = fs.readFileSync('.env.production.local', 'utf-8')
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) {
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    process.env[m[1]] = v
  }
}

const { kv } = await import('@vercel/kv')
const keys = await kv.keys('*')
keys.sort()
console.log('TOTAL CLAVES:', keys.length)
for (const k of keys) {
  try {
    const val = await kv.get(k)
    const n = Array.isArray(val) ? val.length : (val && typeof val === 'object' ? Object.keys(val).length + ' campos' : typeof val)
    console.log(`  ${k}  →  ${n} registros`)
  } catch (e) {
    console.log(`  ${k}  →  (error leyendo: ${e.message})`)
  }
}
