import { NextRequest, NextResponse } from 'next/server'
import { readList, writeList } from '@/shared/lib/kv-store'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const KV_KEY = 'referencias-datos'

// Guarda un único objeto { data, vendedores } como array de 1 elemento en KV.
export async function GET() {
  const arr = await readList<{ data: unknown; vendedores: unknown }>(KV_KEY)
  const obj = Array.isArray(arr) && arr[0] ? arr[0] : null
  return NextResponse.json(obj, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    await writeList(KV_KEY, [body])
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[api/referencias] POST error:', err)
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }
}
