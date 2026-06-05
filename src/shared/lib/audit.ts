export function logAudit(params: any) {
  console.log('[AUDIT]', params)
}

export function computarDiff(before: any, after: any) {
  return { antes: before, despues: after }
}
