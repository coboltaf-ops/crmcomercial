// SOLO LECTURA: muestra los usuarios que hay en usuarios-datos.
import fs from 'fs'
const env = fs.readFileSync('.env.production.local', 'utf-8')
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) { let v = m[2].trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); process.env[m[1]] = v }
}
const { kv } = await import('@vercel/kv')
const a = await kv.get('usuarios-datos')
console.log('Total usuarios en KV:', Array.isArray(a) ? a.length : '(no es lista)')
if (Array.isArray(a)) for (const u of a) {
  console.log('  -', (u.usuario || '?').padEnd(16), '| rol:', (u.rol || '?').padEnd(8), '| situacion:', (u.situacion ?? 'Activo'), '| claveCifrada:', String(u.clave || '').startsWith('scrypt$'))
}
