import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

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

    const safeMsg = String(mensaje || '').replace(/</g, '&lt;')
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111">
        <div style="white-space:pre-wrap;font-size:14px;line-height:1.7">${safeMsg}</div>
        ${url ? `<p style="margin-top:24px"><a href="${url}" style="background:#1e3a8a;color:#ffffff;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">Acceder al enlace</a></p><p style="font-size:12px;color:#6b7280;margin-top:8px;word-break:break-all">O copia este enlace: ${url}</p>` : ''}
        <p style="text-align:center;color:#9ca3af;font-size:11px;margin-top:28px">Enviado desde el CRM Comercial</p>
      </div>`

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })

    const mailAttachments = (Array.isArray(attachments) ? attachments : []).map((a: { filename: string; content: string }) => ({
      filename: a.filename,
      content: a.content.includes(',') ? a.content.split(',')[1] : a.content,
      encoding: 'base64' as const,
    }))

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
