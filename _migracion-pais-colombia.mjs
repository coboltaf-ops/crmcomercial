// MIGRACIÓN ADITIVA: pone pais:"Colombia" a los registros que NO tengan país.
// NUNCA borra ni cambia otros campos. Solo agrega 'pais' donde falte.
//   node _migracion-pais-colombia.mjs dry     -> muestra qué haría (NO escribe)  [default]
//   node _migracion-pais-colombia.mjs apply   -> aplica de verdad (kv.set)
import fs from 'fs'

const env = fs.readFileSync('.env.production.local', 'utf-8')
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) { let v = m[2].trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); process.env[m[1]] = v }
}

const PAIS = 'Colombia'
// Solo las colecciones transaccionales (las que filtran por país). NO catálogos/config.
const COLS = [
  'clientes-datos', 'contactos-datos', 'cotizaciones-datos', 'oportunidades-datos',
  'pqrs-datos', 'prospectos-datos', 'proveedores-datos', 'proyectos-datos', 'tareas-datos',
]
const mode = process.argv[2] || 'dry'
const { kv } = await import('@vercel/kv')

let totalReg = 0, totalCambios = 0
console.log(`=== MIGRACIÓN pais="${PAIS}" (modo: ${mode}) ===`)
for (const key of COLS) {
  const arr = await kv.get(key)
  if (!Array.isArray(arr)) { console.log(`  ${key}: (no es lista, se omite)`); continue }
  let cambios = 0
  const nuevo = arr.map(r => {
    if (r && typeof r === 'object' && !r.pais) { cambios++; return { ...r, pais: PAIS } }
    return r
  })
  totalReg += arr.length; totalCambios += cambios
  console.log(`  ${key}: ${arr.length} registros, ${cambios} sin país → se les pondría "${PAIS}"`)
  if (mode === 'apply' && cambios > 0) {
    // seguridad: mismo número de registros antes/después
    if (nuevo.length !== arr.length) { console.log(`  ⚠️  ABORTADO en ${key}: cambió el conteo (${arr.length}→${nuevo.length})`); continue }
    await kv.set(key, nuevo)
  }
}
console.log(`\nTOTAL: ${totalReg} registros | ${totalCambios} recibirían país "${PAIS}"`)
if (mode === 'dry') console.log('\nDRY-RUN: no se escribió nada. Para aplicar: node _migracion-pais-colombia.mjs apply')
else console.log('\n✅ MIGRACIÓN APLICADA (solo se agregó el campo pais; nada más cambió).')
