/**
 * Backend PostgreSQL del almacén del CRM Comercial.
 *
 * Backend de PRODUCCIÓN para el servidor propio (p. ej. el de Abreu, en Docker):
 * Postgres plano, sin Vercel KV. Guarda el MISMO modelo que los otros backends
 * —una lista JSON por `key`— en una sola tabla llave→valor.
 *
 *   tabla crm_docs(clave PK, contenido, actualizado_en)
 *
 * Se activa con DATA_BACKEND=postgres y una cadena de conexión en DATABASE_URL:
 *   DATA_BACKEND=postgres
 *   DATABASE_URL=postgres://usuario:clave@host:5432/basededatos
 *   DATABASE_SSL=true      (opcional; solo si el servidor exige SSL)
 *
 * `pg` se importa de forma perezosa desde kv-store.ts, así que los despliegues
 * que usan `local` o `kv` (Vercel) no necesitan tenerlo cargado.
 */
import { Pool } from 'pg'

let pool: Pool | null = null
let tablaLista: Promise<void> | null = null

function obtenerPool(): Pool {
  if (pool) return pool
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error(
      '[kv-store/postgres] Falta DATABASE_URL. Define la cadena de conexión para usar DATA_BACKEND=postgres.',
    )
  }
  pool = new Pool({
    connectionString,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
  })
  return pool
}

/** Crea la tabla si no existe (una sola vez por proceso). */
function asegurarTabla(): Promise<void> {
  if (tablaLista) return tablaLista
  tablaLista = obtenerPool()
    .query(
      `CREATE TABLE IF NOT EXISTS crm_docs (
         clave          TEXT PRIMARY KEY,
         contenido      TEXT NOT NULL,
         actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
       )`,
    )
    .then(() => undefined)
    .catch((err) => {
      tablaLista = null
      throw err
    })
  return tablaLista
}

export async function pgRead(clave: string): Promise<string | null> {
  await asegurarTabla()
  const { rows } = await obtenerPool().query<{ contenido: string }>(
    'SELECT contenido FROM crm_docs WHERE clave = $1',
    [clave],
  )
  return rows.length ? rows[0].contenido : null
}

export async function pgWrite(clave: string, contenido: string): Promise<void> {
  await asegurarTabla()
  await obtenerPool().query(
    `INSERT INTO crm_docs (clave, contenido, actualizado_en)
       VALUES ($1, $2, now())
     ON CONFLICT (clave)
       DO UPDATE SET contenido = EXCLUDED.contenido, actualizado_en = now()`,
    [clave, contenido],
  )
}

export async function pgDelete(clave: string): Promise<void> {
  await asegurarTabla()
  await obtenerPool().query('DELETE FROM crm_docs WHERE clave = $1', [clave])
}
