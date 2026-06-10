import { NextRequest, NextResponse } from 'next/server'
import { readList, writeList } from '@/shared/lib/kv-store'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Todas las llaves de datos del CRM que se respaldan
const KEYS = [
  'clientes-datos', 'contactos-datos', 'oportunidades-datos', 'cotizaciones-datos',
  'tareas-datos', 'prospectos-datos', 'productos-datos', 'pqrs-datos', 'proyectos-datos',
  'referencias-datos', 'usuarios-datos', 'empresa-datos', 'auditoria-log',
  'pqrs-externas', 'prospectos-externos',
]

const INDEX_KEY = 'backups-index'   // lista de snapshots guardados
const MAX_BACKUPS = 6               // ~18 días de historial (cada 3 días)

async function hacerRespaldo() {
  // 1) Leer todos los datos
  const data: Record<string, unknown> = {}
  let totalRegistros = 0
  for (const k of KEYS) {
    const arr = await readList(k)
    data[k] = arr
    if (Array.isArray(arr)) totalRegistros += arr.length
  }
  const fechaISO = new Date().toISOString()
  const fechaCorta = fechaISO.slice(0, 10)
  const bundle = { fecha: fechaISO, sistema: 'crmcomercial', totalRegistros, data }
  const json = JSON.stringify(bundle)

  // 2) Guardar snapshot con fecha en KV (copia interna para restaurar rápido)
  const backupKey = `backup-${fechaISO.replace(/[:.]/g, '-')}`
  await writeList(backupKey, [bundle])

  // 3) Mantener solo los últimos MAX_BACKUPS (podar los viejos)
  let index = await readList<string>(INDEX_KEY)
  index = Array.isArray(index) ? index : []
  index.push(backupKey)
  const aBorrar = index.length > MAX_BACKUPS ? index.slice(0, index.length - MAX_BACKUPS) : []
  index = index.slice(-MAX_BACKUPS)
  await writeList(INDEX_KEY, index)
  for (const k of aBorrar) { try { await writeList(k, []) } catch { /* ignore */ } }

  return { json, fechaCorta, totalRegistros }
}

async function enviarCorreo(json: string, fechaCorta: string, totalRegistros: number) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return 'SMTP no configurado'
  const to = process.env.BACKUP_EMAIL || 'coboltaf@gmail.com'
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: `🗄️ Respaldo CRM Comercial — ${fechaCorta} (${totalRegistros} registros)`,
    text: `Respaldo automático del CRM Comercial.\n\nFecha: ${fechaCorta}\nTotal de registros: ${totalRegistros}\n\nEl archivo adjunto (JSON) contiene TODOS los datos del sistema. Guárdalo en un lugar seguro. Con este archivo se pueden restaurar los datos.`,
    attachments: [{ filename: `respaldo-crmcomercial-${fechaCorta}.json`, content: json }],
  })
  return 'enviado a ' + to
}

export async function GET(req: NextRequest) {
  // Seguridad: solo Vercel Cron (envía Authorization: Bearer CRON_SECRET) o llamada con ese secreto
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
  }
  try {
    const { json, fechaCorta, totalRegistros } = await hacerRespaldo()
    let correo = 'no enviado'
    try { correo = await enviarCorreo(json, fechaCorta, totalRegistros) }
    catch (e) { correo = 'error correo: ' + String(e) }
    return NextResponse.json({ ok: true, fecha: fechaCorta, totalRegistros, correo, tamano_kb: Math.round(json.length / 1024) })
  } catch (err) {
    console.error('[backup] error', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
