import { NextRequest, NextResponse } from 'next/server'
import { readList, writeList } from '@/shared/lib/kv-store'

const KV_KEY = 'auditoria-log'
const MAX = 5000 // conservar las últimas 5000 acciones

interface Registro {
  id: string
  usuario: string
  usuario_nombre: string
  rol: string
  modulo: string
  accion: string
  registro_codigo?: string
  registro_nombre?: string
  detalle?: string
  fecha: string  // ISO
}

// GET — consultar auditoría con filtros opcionales (?usuario= &modulo= &accion= &desde=YYYY-MM-DD &hasta=YYYY-MM-DD)
export async function GET(req: NextRequest) {
  const data = await readList<Registro>(KV_KEY)
  const p = req.nextUrl.searchParams
  const usuario = p.get('usuario')?.toLowerCase()
  const modulo = p.get('modulo')?.toLowerCase()
  const accion = p.get('accion')?.toLowerCase()
  const desde = p.get('desde')
  const hasta = p.get('hasta')

  let result = data
  if (usuario) result = result.filter(r => (r.usuario_nombre || '').toLowerCase().includes(usuario) || (r.usuario || '').toLowerCase().includes(usuario))
  if (modulo) result = result.filter(r => (r.modulo || '').toLowerCase() === modulo)
  if (accion) result = result.filter(r => (r.accion || '').toLowerCase() === accion)
  if (desde) result = result.filter(r => r.fecha.slice(0, 10) >= desde)
  if (hasta) result = result.filter(r => r.fecha.slice(0, 10) <= hasta)

  result = result.sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 1000)
  return NextResponse.json(result)
}

// POST — registrar una acción
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = await readList<Registro>(KV_KEY)
    const registro: Registro = {
      id: crypto.randomUUID(),
      usuario: body.usuario || 'desconocido',
      usuario_nombre: body.usuario_nombre || '',
      rol: body.rol || '',
      modulo: body.modulo || '',
      accion: body.accion || '',
      registro_codigo: body.registro_codigo || '',
      registro_nombre: body.registro_nombre || '',
      detalle: body.detalle || '',
      fecha: new Date().toISOString(),
    }
    data.push(registro)
    // recortar a los últimos MAX
    const recortado = data.length > MAX ? data.slice(data.length - MAX) : data
    await writeList(KV_KEY, recortado)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[auditoria] POST', err)
    return NextResponse.json({ error: 'Error al registrar auditoría' }, { status: 500 })
  }
}

// DELETE — limpiar la auditoría real (llave auditoria-log)
//   { modo: 'todo' }                              → borra TODA la auditoría
//   { modo: 'rango', fechaInicio, fechaFinal }    → borra registros en ese rango (inclusive)
export async function DELETE(req: NextRequest) {
  try {
    const { modo, fechaInicio, fechaFinal } = await req.json()

    if (modo === 'todo') {
      const data = await readList<Registro>(KV_KEY)
      const total = data.length
      await writeList(KV_KEY, [])
      return NextResponse.json({ ok: true, eliminados: total, mensaje: `Se eliminó toda la auditoría (${total} registros).` })
    }

    if (modo === 'rango') {
      if (!fechaInicio || !fechaFinal) {
        return NextResponse.json({ error: 'Faltan fechaInicio y fechaFinal' }, { status: 400 })
      }
      const data = await readList<Registro>(KV_KEY)
      // Comparación por día (YYYY-MM-DD), inclusiva en ambos extremos
      const conservados = data.filter(r => {
        const dia = (r.fecha || '').slice(0, 10)
        return !(dia >= fechaInicio && dia <= fechaFinal)
      })
      const eliminados = data.length - conservados.length
      await writeList(KV_KEY, conservados)
      return NextResponse.json({ ok: true, eliminados, mensaje: `Se eliminaron ${eliminados} registros entre ${fechaInicio} y ${fechaFinal}.` })
    }

    return NextResponse.json({ error: 'Modo no válido (usa "todo" o "rango")' }, { status: 400 })
  } catch (err) {
    console.error('[auditoria] DELETE', err)
    return NextResponse.json({ error: 'Error al limpiar auditoría: ' + String(err) }, { status: 500 })
  }
}
