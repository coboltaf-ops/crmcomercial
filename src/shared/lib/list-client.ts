/**
 * Cliente para guardar listas en el servidor POR REGISTRO (no pisa toda la lista).
 * Úsalo desde los stores: así un navegador desactualizado no puede borrar todo.
 */

async function post(path: string, body: unknown) {
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) console.error('[list-client]', path, 'HTTP', res.status)
  } catch (err) {
    console.error('[list-client] error:', path, err)
  }
}

/** Inserta o reemplaza un registro por id. */
export function apiUpsert(path: string, item: unknown) {
  return post(path, { op: 'upsert', item })
}

/** Elimina un registro por id (puede dejar la lista vacía legítimamente). */
export function apiDelete(path: string, id: unknown) {
  return post(path, { op: 'delete', id })
}

/** Reemplazo total de la lista (migración / carga masiva). force vacía con datos. */
export function apiSet(path: string, items: unknown[], force = false) {
  return post(path, { op: 'set', items, force })
}
