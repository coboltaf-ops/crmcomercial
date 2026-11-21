/**
 * Almacenamiento dual: Vercel KV en producción, JSON en disco en desarrollo.
 *
 * Detecta automáticamente: si las variables KV_REST_API_URL y KV_REST_API_TOKEN
 * están presentes (Vercel inyecta esto al crear una KV database), usa Vercel KV.
 * Si no, lee/escribe en data/{key}.json — comportamiento idéntico al original.
 */
import fs from 'fs'
import path from 'path'

const useKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)

// ─── Selector de backend ────────────────────────────────────────────────────
// Tres backends intercambiables con UNA variable (DATA_BACKEND), igual que
// NominaCore / OperCore:
//   local      → archivo ./data/{key}.json   (DESARROLLO)
//   kv         → Vercel KV                    (nube actual en Vercel)
//   postgres   → PostgreSQL propio en Docker   (PRODUCCIÓN server Abreu)
// Si DATA_BACKEND no está puesto, se mantiene el comportamiento previo:
// Vercel KV cuando hay credenciales, archivo local en otro caso.
const BACKEND = (process.env.DATA_BACKEND || (useKV ? 'kv' : 'local')).toLowerCase()
const USE_POSTGRES = BACKEND === 'postgres'

// `pg` se carga SOLO si el backend es postgres, para no obligar a instalarlo en
// los despliegues local/kv (Vercel). Import perezoso cacheado.
type PgModule = typeof import('./kv-store-postgres')
let pgPromesa: Promise<PgModule> | null = null
function pg(): Promise<PgModule> {
  if (!pgPromesa) pgPromesa = import('./kv-store-postgres')
  return pgPromesa
}

async function getKv() {
  const mod = await import('@vercel/kv')
  return mod.kv
}

function filePath(key: string) {
  return path.join(process.cwd(), 'data', `${key}.json`)
}

/** Semilla del bundle: lee data/{key}.json para inicializar un backend vacío. */
function readSeed<T>(key: string): T[] {
  try {
    const fp = filePath(key)
    if (!fs.existsSync(fp)) return []
    return JSON.parse(fs.readFileSync(fp, 'utf-8'))
  } catch {
    return []
  }
}

export async function readList<T>(key: string): Promise<T[]> {
  if (USE_POSTGRES) {
    const raw = await (await pg()).pgRead(key)
    if (raw === null) return readSeed<T>(key) // BD vacía → seed del bundle
    try {
      const data = JSON.parse(raw)
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  }
  if (useKV) {
    try {
      const kv = await getKv()
      const data = await kv.get<T[]>(key)
      return data || []
    } catch (err) {
      console.error('[kv-store] readList error:', err)
      return []
    }
  }
  return readSeed<T>(key)
}

// Como readList pero AVISA si la lectura falló (KV no confiable). El guardado (POST)
// debe ABORTAR cuando error:true, para no sobrescribir datos buenos con un fallback
// vacío. Evita la pérdida masiva como la del 2026-11-21 en crmgtm.
export async function readListSafe<T>(key: string): Promise<{ data: T[]; error: boolean }> {
  if (USE_POSTGRES) {
    const raw = await (await pg()).pgRead(key)
    if (raw === null) return { data: readSeed<T>(key), error: false }
    try { const data = JSON.parse(raw); return { data: Array.isArray(data) ? data : [], error: false } } catch { return { data: [], error: false } }
  }
  if (useKV) {
    try {
      const kv = await getKv()
      const data = await kv.get<T[]>(key)
      return { data: data || [], error: false }  // null = vacío genuino
    } catch (err) {
      console.error('[kv-store] readListSafe error:', err)
      return { data: [], error: true }            // ERROR → NO escribir
    }
  }
  return { data: readSeed<T>(key), error: false }
}

export async function writeList<T>(key: string, data: T[]): Promise<void> {
  if (USE_POSTGRES) {
    await (await pg()).pgWrite(key, JSON.stringify(data))
    return
  }
  if (useKV) {
    const kv = await getKv()
    // CANDADO ANTI-VACIADO: nunca sobrescribir una lista CON datos por una vacía o
    // drásticamente menor (señal de lectura fallida). Doble protección.
    if (Array.isArray(data)) {
      try {
        const actual = await kv.get<T[]>(key)
        if (Array.isArray(actual) && actual.length > 0 && (data.length === 0 || data.length < Math.ceil(actual.length / 2))) {
          console.error(`[kv-store] BLOQUEADO vaciado/pérdida de '${key}': ${actual.length} → ${data.length}. No se sobrescribe.`)
          return
        }
      } catch { /* si el chequeo falla, el POST ya validó con readListSafe */ }
    }
    await kv.set(key, data)
    return
  }
  const fp = filePath(key)
  const dir = path.dirname(fp)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf-8')
}
