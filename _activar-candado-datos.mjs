// PREPARA LOS DATOS para activar el candado por país (aislamiento). SEGURO y reversible.
//   - Respalda usuarios-datos + las 9 colecciones ANTES de escribir.
//   - Migración ADITIVA: pone pais="Colombia" a los registros que NO tengan país (no borra ni cambia otros campos).
//   - Asigna país a los usuarios: GLOBAL a los Jose/admin, Colombia a las Adrianas.
//   - Crea el usuario nuevo (Jose Palomares) como Admin GLOBAL, si no existe.
//   - NUNCA reduce el número de registros/usuarios (aborta si eso pasara).
//
//   node _activar-candado-datos.mjs dry     -> muestra qué haría (NO escribe)  [default]
//   node _activar-candado-datos.mjs apply   -> aplica de verdad
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const env = fs.readFileSync('.env.production.local', 'utf-8')
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) { let v = m[2].trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); process.env[m[1]] = v }
}

// ── Configuración de la operación ──
const PAIS = 'Colombia'
const COLS = ['clientes-datos', 'contactos-datos', 'cotizaciones-datos', 'oportunidades-datos',
  'pqrs-datos', 'prospectos-datos', 'proveedores-datos', 'proyectos-datos', 'tareas-datos']

// País por usuario (por nombre de login). Lo que no esté aquí, NO se toca.
const PAIS_USUARIO = { directorlatam: 'GLOBAL', admin: 'GLOBAL', comer01: 'Colombia', comer99: 'Colombia' }

// Usuario nuevo (Jose Palomares) como Admin GLOBAL. Cambia usuario/clave si quieres.
const NUEVO = { usuario: 'soportelatam', clave: 'Soportegtm1510', nombre: 'JOSE E', apellido: 'PALOMARES',
  correo: 'coboltaf@gmail.com', rol: 'Admin', pais: 'GLOBAL' }

const mode = process.argv[2] || 'dry'
function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex')
  return `scrypt$${salt}$${crypto.scryptSync(plain, salt, 64).toString('hex')}`
}

const { kv } = await import('@vercel/kv')
console.log(`=== ACTIVAR CANDADO — preparar datos (modo: ${mode}) ===\n`)

// Respaldo previo (solo en apply)
let dir = null
if (mode === 'apply') {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  dir = `_RESPALDO_antes_candado_${stamp}`
  fs.mkdirSync(dir, { recursive: true })
}

// ── 1) MIGRACIÓN de registros sin país ──
console.log('1) Migración (registros sin país → Colombia):')
let totalMig = 0
for (const key of COLS) {
  const arr = await kv.get(key)
  if (!Array.isArray(arr)) { console.log(`   ${key}: (no es lista, se omite)`); continue }
  if (dir) fs.writeFileSync(path.join(dir, `${key}.json`), JSON.stringify(arr))
  let cambios = 0
  const nuevo = arr.map(r => (r && typeof r === 'object' && !r.pais) ? (cambios++, { ...r, pais: PAIS }) : r)
  totalMig += cambios
  console.log(`   ${key}: ${arr.length} reg, ${cambios} sin país → Colombia`)
  if (mode === 'apply' && cambios > 0) {
    if (nuevo.length !== arr.length) { console.error(`   ⚠️ ABORTADO en ${key}: cambió el conteo`); process.exit(1) }
    await kv.set(key, nuevo)
  }
}
console.log(`   → total registros marcados Colombia: ${totalMig}\n`)

// ── 2) y 3) USUARIOS: asignar país + crear el nuevo ──
console.log('2) Usuarios (país) y 3) usuario nuevo:')
const usuarios = await kv.get('usuarios-datos')
if (!Array.isArray(usuarios)) { console.error('usuarios-datos no es lista, abortado.'); process.exit(1) }
if (dir) fs.writeFileSync(path.join(dir, 'usuarios-datos.json'), JSON.stringify(usuarios))

const permisosAdmin = usuarios.find(u => String(u.rol).toLowerCase() === 'admin')?.permisos

let usuariosNuevos = usuarios.map(u => {
  const p = PAIS_USUARIO[(u.usuario || '').toLowerCase()]
  if (p) { console.log(`   ${u.usuario}: país → ${p}`); return { ...u, pais: p } }
  console.log(`   ${u.usuario}: (sin cambio)`) ; return u
})

const yaExiste = usuariosNuevos.some(u => (u.usuario || '').toLowerCase() === NUEVO.usuario.toLowerCase())
if (yaExiste) {
  console.log(`   "${NUEVO.usuario}": YA existe → se asegura país GLOBAL`)
  usuariosNuevos = usuariosNuevos.map(u => (u.usuario || '').toLowerCase() === NUEVO.usuario.toLowerCase()
    ? { ...u, pais: 'GLOBAL', rol: 'Admin', situacion: 'Activo' } : u)
} else {
  console.log(`   "${NUEVO.usuario}": se CREA (Admin GLOBAL)`)
  const nuevoUsuario = {
    id: 'usr-' + crypto.randomBytes(6).toString('hex'),
    nombre: NUEVO.nombre, apellido: NUEVO.apellido, usuario: NUEVO.usuario,
    clave: mode === 'apply' ? hashPassword(NUEVO.clave) : '(se cifra al aplicar)',
    clave_visible: NUEVO.clave, correo: NUEVO.correo, rol: NUEVO.rol, pais: NUEVO.pais,
    situacion: 'Activo', permisos: permisosAdmin,
  }
  usuariosNuevos = [...usuariosNuevos, nuevoUsuario]
}

// Seguridad: nunca perder usuarios
if (usuariosNuevos.length < usuarios.length) { console.error('⚠️ ABORTADO: menos usuarios que el original.'); process.exit(1) }
if (mode === 'apply') await kv.set('usuarios-datos', usuariosNuevos)

console.log(`\n   usuarios: ${usuarios.length} → ${usuariosNuevos.length}`)
console.log('   GLOBAL (ven todo):', usuariosNuevos.filter(u => u.pais === 'GLOBAL').map(u => u.usuario).join(', '))
console.log('   Colombia:', usuariosNuevos.filter(u => u.pais === 'Colombia').map(u => u.usuario).join(', '))

if (mode === 'dry') {
  console.log('\nDRY-RUN: no se escribió nada. Para aplicar: node _activar-candado-datos.mjs apply')
} else {
  console.log(`\n✅ DATOS LISTOS. Respaldo previo en: ${dir}`)
  console.log(`   Nuevo acceso →  usuario: "${NUEVO.usuario}"  clave: "${NUEVO.clave}"  (Admin GLOBAL)`)
  console.log('   Falta: activar el candado en el código y desplegar (lo hace tu asistente).')
}
