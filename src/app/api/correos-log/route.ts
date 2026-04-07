import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'correos-log.json')

export interface CorreoLog {
  id: string
  fecha: string
  hora: string
  de: string
  para: string
  asunto: string
  modulo: string
  referencia: string
  estado: 'Enviado' | 'Error'
  detalle_error?: string
}

function readData(): CorreoLog[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return []
    const raw = fs.readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function writeData(data: CorreoLog[]) {
  const dir = path.dirname(DATA_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

// GET — listar correos enviados
export async function GET(req: NextRequest) {
  const modulo = req.nextUrl.searchParams.get('modulo')
  const data = readData()
  const result = modulo ? data.filter(c => c.modulo === modulo) : data
  // Devolver en orden más reciente primero
  result.sort((a, b) => `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`))
  return NextResponse.json({ correos: result, total: result.length })
}

// POST — registrar un correo enviado
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { de, para, asunto, modulo, referencia, estado, detalle_error } = body

    if (!para || !asunto || !modulo) {
      return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 })
    }

    const now = new Date()
    const fecha = now.toLocaleDateString('es-CO', { timeZone: 'America/Bogota', day: '2-digit', month: '2-digit', year: 'numeric' })
    const hora = now.toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', second: '2-digit' })

    const nuevo: CorreoLog = {
      id: crypto.randomUUID(),
      fecha,
      hora,
      de: de || process.env.SMTP_USER || '',
      para,
      asunto,
      modulo,
      referencia: referencia || '',
      estado: estado || 'Enviado',
      detalle_error: detalle_error || undefined,
    }

    const data = readData()
    data.push(nuevo)
    writeData(data)

    return NextResponse.json({ ok: true, id: nuevo.id })
  } catch {
    return NextResponse.json({ error: 'Error al registrar correo.' }, { status: 500 })
  }
}

// DELETE — eliminar un correo del log
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID requerido.' }, { status: 400 })
    const data = readData()
    const filtered = data.filter(c => c.id !== id)
    if (filtered.length === data.length) {
      return NextResponse.json({ error: 'Correo no encontrado.' }, { status: 404 })
    }
    writeData(filtered)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar.' }, { status: 500 })
  }
}
