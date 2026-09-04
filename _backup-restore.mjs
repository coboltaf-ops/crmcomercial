// RESTAURACIÓN del KV desde un respaldo. Modos:
//   node _backup-restore.mjs <carpeta_respaldo> test    -> prueba de escritura SEGURA (clave descartable)
//   node _backup-restore.mjs <carpeta_respaldo> dry     -> muestra qué restauraría (NO escribe)  [default]
//   node _backup-restore.mjs <carpeta_respaldo> apply   -> RESTAURA de verdad (kv.set de cada clave)
import fs from 'fs'
import path from 'path'

const env = fs.readFileSync('.env.production.local', 'utf-8')
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) { let v = m[2].trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); process.env[m[1]] = v }
}

const folder = process.argv[2]
const mode = process.argv[3] || 'dry'
if (!folder) { console.error('Falta la carpeta del respaldo.'); process.exit(1) }
const fullPath = path.join(folder, 'backup-full.json')
const full = JSON.parse(fs.readFileSync(fullPath, 'utf-8'))
const keys = Object.keys(full)

const { kv } = await import('@vercel/kv')

if (mode === 'test') {
  // Prueba de escritura SEGURA: clave descartable, no toca datos reales.
  const tk = '__restore_test__' + Date.now()
  await kv.set(tk, [{ ok: true, ts: Date.now() }])
  const back = await kv.get(tk)
  await kv.del(tk)
  console.log('PRUEBA DE ESCRITURA:', Array.isArray(back) && back[0]?.ok ? 'OK ✅ (se escribió, leyó y borró una clave de prueba)' : 'FALLÓ ❌')
  process.exit(0)
}

if (mode === 'dry') {
  console.log('DRY-RUN (no escribe nada). Restauraría', keys.length, 'claves:')
  for (const k of keys) {
    const v = full[k]; const c = Array.isArray(v) ? v.length : (v && typeof v === 'object' ? Object.keys(v).length : 1)
    console.log(`  ${k}: ${c}`)
  }
  console.log('\nPara restaurar DE VERDAD: node _backup-restore.mjs', folder, 'apply')
  process.exit(0)
}

if (mode === 'apply') {
  let ok = 0, err = 0
  for (const k of keys) {
    try { await kv.set(k, full[k]); ok++ } catch (e) { console.error('  error', k, e.message); err++ }
  }
  console.log('RESTAURACIÓN COMPLETA. claves restauradas:', ok, '| errores:', err)
  process.exit(0)
}
