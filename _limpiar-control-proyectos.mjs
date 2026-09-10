// Deja LIMPIA la tabla del módulo Control de Proyectos (control-proyectos-datos).
// AISLADA: no toca ningún otro módulo ni dato del CRM.
//
//   node _limpiar-control-proyectos.mjs            → solo muestra cuántos hay (no borra)
//   node _limpiar-control-proyectos.mjs --confirm  → vacía la tabla (deja [])
import fs from 'fs'

const CONFIRM = process.argv.includes('--confirm')
const env = fs.readFileSync('.env.production.local', 'utf-8')
for (const line of env.split('\n')) { const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m) { let v = m[2].trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); process.env[m[1]] = v } }
const { kv } = await import('@vercel/kv')

const actual = (await kv.get('control-proyectos-datos')) || []
console.log('Registros actuales en control-proyectos-datos:', Array.isArray(actual) ? actual.length : 0)
if (Array.isArray(actual)) actual.forEach(p => console.log('  -', p.codigo, p.nombre_proyecto))

if (CONFIRM) {
  await kv.set('control-proyectos-datos', [])
  console.log('✅ Tabla vaciada. Control de Proyectos queda limpio (0 registros).')
} else {
  console.log('\n(DRY) Para vaciar de verdad: node _limpiar-control-proyectos.mjs --confirm')
}
