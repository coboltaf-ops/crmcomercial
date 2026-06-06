import { NextRequest, NextResponse } from 'next/server'
import { readList, writeList } from '@/shared/lib/kv-store'

const KV_KEY = 'empresa-datos'

// GET — listar datos de empresa (persistidos en Vercel KV)
export async function GET() {
  const data = await readList(KV_KEY)
  return NextResponse.json(data)
}

// POST — guardar la lista completa de empresas en KV
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Se esperaba un arreglo de empresas' }, { status: 400 })
    }
    await writeList(KV_KEY, data)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/empresa] POST error:', err)
    return NextResponse.json({ error: 'Error al guardar datos de empresa' }, { status: 500 })
  }
}
