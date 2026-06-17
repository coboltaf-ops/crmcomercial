import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Devuelve la versión del despliegue actual (commit de Vercel).
// El cliente la consulta para auto-actualizarse cuando hay una versión nueva.
export async function GET() {
  const v =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.VERCEL_DEPLOYMENT_ID ||
    'dev'
  return NextResponse.json(
    { v },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' } },
  )
}
