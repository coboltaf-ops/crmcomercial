// Crea (o actualiza) UN usuario de prueba en 'usuarios-datos'. NO toca a los demás usuarios ni ningún otro dato.
// Respalda la lista de usuarios ANTES de escribir. Idempotente. Clave cifrada con scrypt (igual que el login).
//   node _crear-usuario-prueba.mjs dry     -> muestra qué haría (NO escribe)  [default]
//   node _crear-usuario-prueba.mjs apply   -> crea/actualiza el usuario de prueba
//   node _crear-usuario-prueba.mjs borrar   -> ELIMINA el usuario de prueba (deja todo como estaba)
import fs from 'fs'
import crypto from 'crypto'

const env = fs.readFileSync('.env.production.local', 'utf-8')
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) { let v = m[2].trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); process.env[m[1]] = v }
}

const KEY = 'usuarios-datos'
const U_PRUEBA = 'prueba'
const CLAVE = 'Prueba2026*'
const mode = process.argv[2] || 'dry'

function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(plain, salt, 64).toString('hex')
  return `scrypt$${salt}$${hash}`
}

const { kv } = await import('@vercel/kv')
const arr = await kv.get(KEY)
if (!Array.isArray(arr)) { console.error('usuarios-datos no es lista, abortado.'); process.exit(1) }

console.log(`=== usuario de prueba (modo: ${mode}) ===`)
console.log(`usuarios actuales: ${arr.length} → ${arr.map(u => u.usuario).join(', ')}`)

const idx = arr.findIndex(u => (u.usuario || '').toLowerCase() === U_PRUEBA)

if (mode === 'borrar') {
  if (idx < 0) { console.log('No existe el usuario "prueba", nada que borrar.'); process.exit(0) }
  const nuevo = arr.filter(u => (u.usuario || '').toLowerCase() !== U_PRUEBA)
  console.log(`Se ELIMINARÁ "prueba". Quedarían ${nuevo.length} usuarios.`)
  await kv.set(KEY, nuevo)
  console.log('✅ Usuario "prueba" eliminado. Todo quedó como antes.')
  process.exit(0)
}

const usuarioPrueba = {
  id: 'usr-prueba-tmp',
  nombre: 'PRUEBA MULTIPAIS',
  usuario: U_PRUEBA,
  clave: hashPassword(CLAVE),
  correo: 'prueba@crmcomercial.com',
  rol: 'Admin',
  pais: 'GLOBAL',
  situacion: 'Activo',
  permisos: idx >= 0 ? arr[idx].permisos : (arr.find(u => u.rol === 'Admin')?.permisos),
}

const nuevo = idx >= 0 ? arr.map((u, i) => i === idx ? { ...u, ...usuarioPrueba } : u) : [...arr, usuarioPrueba]

console.log(idx >= 0 ? 'El usuario "prueba" YA existe → se actualizaría su clave.' : 'Se AGREGARÍA un usuario nuevo "prueba" (Admin).')
console.log(`resultado: ${nuevo.length} usuarios`)

if (mode === 'dry') { console.log('\nDRY-RUN: no se escribió nada. Para aplicar: node _crear-usuario-prueba.mjs apply'); process.exit(0) }

// respaldo de la lista de usuarios ANTES de escribir
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
fs.writeFileSync(`_RESPALDO_usuarios_antes_prueba_${stamp}.json`, JSON.stringify(arr, null, 2))
console.log(`respaldo previo guardado: _RESPALDO_usuarios_antes_prueba_${stamp}.json`)

// seguridad: nunca perder usuarios
if (nuevo.length < arr.length) { console.error('⚠️ ABORTADO: el resultado tiene menos usuarios que el original.'); process.exit(1) }

await kv.set(KEY, nuevo)
console.log(`\n✅ LISTO. Entra con usuario: "${U_PRUEBA}"  clave: "${CLAVE}"  (Admin, ve todo)`)
console.log('Para borrarlo luego: node _crear-usuario-prueba.mjs borrar')
