import { NextRequest, NextResponse } from 'next/server'
import { readList, writeList } from '@/shared/lib/kv-store'

const KV_KEY = 'productos-datos'

export async function GET() {
  const data = await readList(KV_KEY)
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Se esperaba un arreglo' }, { status: 400 })
    }
    await writeList(KV_KEY, data)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/productos] POST error:', err)
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }
}
