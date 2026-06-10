import { NextRequest, NextResponse } from 'next/server'
import { readList, writeList } from '@/shared/lib/kv-store'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const KV_KEY = 'cotizaciones-datos'

export async function GET() {
  const data = await readList(KV_KEY)
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
  })
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Se esperaba un arreglo' }, { status: 400 })
    }
    await writeList(KV_KEY, data)
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[api/cotizaciones] POST error:', err)
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }
}
