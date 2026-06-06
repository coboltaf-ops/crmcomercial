import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { readList } from '@/shared/lib/kv-store'

interface EmpresaDatos {
  nombre?: string; logo_url?: string; direccion?: string; ciudad?: string
  pais?: string; telefono?: string; correo?: string
}

// Envío genérico de correos desde cualquier módulo: mensaje + enlace opcional + adjuntos.
export async function POST(req: NextRequest) {
  let to = ''
  let asunto = ''
  let modulo = 'general'
  let referencia = ''
  try {
    const body = await req.json()
    to = body.to
    asunto = body.asunto
    modulo = body.modulo || 'general'
    referencia = body.referencia || ''
    const { mensaje, url, attachments } = body

    if (!to || !asunto) {
      return NextResponse.json({ error: 'Faltan destinatario o asunto' }, { status: 400 })
    }

    // Datos de la empresa (logo, dirección) desde KV para el encabezado del correo
    let empresa: EmpresaDatos = {}
    try {
      const emp = await readList<EmpresaDatos>('empresa-datos')
      if (emp && emp[0]) empresa = emp[0]
    } catch { /* sin datos de empresa */ }

    const ubicacion = [empresa.direccion, empresa.ciudad, empresa.pais].filter(Boolean).join(', ')

    // Adjuntos del usuario
    const mailAttachments: { filename: string; content: string; encoding: 'base64'; cid?: string }[] =
      (Array.isArray(attachments) ? attachments : []).map((a: { filename: string; content: string }) => ({
        filename: a.filename,
        content: a.content.includes(',') ? a.content.split(',')[1] : a.content,
        encoding: 'base64' as const,
      }))

    // Logo embebido como imagen (CID) para que se vea en el correo
    let logoHtml = ''
    const logoMatch = (empresa.logo_url || '').match(/^data:image\/(\w+);base64,(.+)$/)
    if (logoMatch) {
      mailAttachments.push({ filename: `logo.${logoMatch[1]}`, content: logoMatch[2], encoding: 'base64', cid: 'logoempresa' })
      logoHtml = `<img src="cid:logoempresa" alt="Logo" style="max-height:70px;max-width:160px;object-fit:contain" />`
    }

    const safeMsg = String(mensaje || '').replace(/</g, '&lt;')
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:0;color:#111;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
        <div style="background:#0f1b3d;padding:20px 24px;text-align:center">
          ${logoHtml}
          ${empresa.nombre ? `<p style="color:#ffffff;font-size:18px;font-weight:800;margin:8px 0 2px">${empresa.nombre}</p>` : ''}
          ${ubicacion ? `<p style="color:rgba(255,255,255,0.75);font-size:12px;margin:0">${ubicacion}</p>` : ''}
          ${empresa.telefono ? `<p style="color:rgba(255,255,255,0.75);font-size:12px;margin:2px 0 0">Tel: ${empresa.telefono}</p>` : ''}
        </div>
        <div style="padding:24px">
          <p style="font-size:15px;font-weight:700;color:#1e3a8a;margin:0 0 14px;border-bottom:2px solid #1e3a8a;padding-bottom:8px">Asunto: ${String(asunto).replace(/</g, '&lt;')}</p>
          <div style="white-space:pre-wrap;font-size:14px;line-height:1.7">${safeMsg}</div>
          ${url ? `<p style="margin-top:24px"><a href="${url}" style="background:#1e3a8a;color:#ffffff;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">Acceder al enlace</a></p><p style="font-size:12px;color:#6b7280;margin-top:8px;word-break:break-all">O copia este enlace: ${url}</p>` : ''}
          <p style="text-align:center;color:#9ca3af;font-size:11px;margin-top:28px">Enviado desde ${empresa.nombre || 'el CRM Comercial'}</p>
        </div>
      </div>`

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: asunto,
      html,
      attachments: mailAttachments,
    })

    // Registrar en el log de correos
    try {
      const logUrl = new URL('/api/correos-log', req.url)
      await fetch(logUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ de: process.env.SMTP_USER, para: to, asunto, modulo, referencia, estado: 'Enviado' }),
      })
    } catch { /* no bloquear si falla el log */ }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('send-email error:', error)
    try {
      const logUrl = new URL('/api/correos-log', req.url)
      await fetch(logUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ de: process.env.SMTP_USER, para: to, asunto, modulo, referencia, estado: 'Error', detalle_error: String(error) }),
      })
    } catch { /* ignore */ }
    return NextResponse.json({ error: 'Error al enviar el correo' }, { status: 500 })
  }
}
