import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Asistente con IA real (Claude). Recibe la pregunta del usuario y un resumen
// compacto de los datos del CRM, y responde en español de forma concisa.
export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return Response.json({
        respuesta: 'El asistente de IA aún no está configurado. Falta agregar la clave ANTHROPIC_API_KEY en Vercel. Avísale a tu administrador.',
        error: 'missing_api_key',
      })
    }

    const body = await request.json().catch(() => ({}))
    const pregunta: string = (body?.pregunta || '').toString().trim()
    const contexto = body?.contexto ?? {}

    if (!pregunta) {
      return Response.json({ respuesta: 'No recibí ninguna pregunta. Escribe qué deseas saber de tu CRM.' })
    }

    const client = new Anthropic({ apiKey })

    const system = [
      'Eres el asistente virtual de un CRM comercial llamado "CRM Comercial".',
      'Respondes SIEMPRE en español, de forma clara, breve y amable (1 a 3 frases).',
      'Tu trabajo es responder preguntas sobre los datos del CRM que te entrego en formato JSON.',
      'Usa ÚNICAMENTE los datos que te paso en el contexto. No inventes cifras ni nombres.',
      'Si la pregunta pide algo que NO está en el contexto, dilo con sinceridad y sugiere qué sí puedes responder (clientes, contactos, oportunidades, pipeline, cotizaciones, productos, tareas, PQRS).',
      'Cuando des cifras, sé concreto. Cuando te pregunten por un nombre, busca coincidencias parciales sin distinguir mayúsculas/acentos.',
      'No uses tecnicismos ni menciones que eres un modelo de IA.',
    ].join(' ')

    const userContent = `Datos actuales del CRM (JSON):\n${JSON.stringify(contexto)}\n\nPregunta del usuario: ${pregunta}`

    const msg = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: userContent }],
    })

    const respuesta = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .trim()

    return Response.json({ respuesta: respuesta || 'No pude generar una respuesta. Intenta reformular la pregunta.' })
  } catch (err) {
    const e = err as { status?: number; message?: string }
    if (e?.status === 401) {
      return Response.json({ respuesta: 'La clave de IA (ANTHROPIC_API_KEY) no es válida. Revisa la configuración en Vercel.', error: 'auth' })
    }
    if (e?.status === 429) {
      return Response.json({ respuesta: 'El asistente está recibiendo muchas consultas en este momento. Intenta de nuevo en unos segundos.', error: 'rate_limit' })
    }
    return Response.json({ respuesta: 'Ocurrió un problema al consultar al asistente. Intenta de nuevo en un momento.', error: 'server' })
  }
}
