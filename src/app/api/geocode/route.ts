import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const noStore = { 'Cache-Control': 'no-store' }

/**
 * Geocoding GRATUITO vía OpenStreetMap / Nominatim.
 * - Server-side: fija un User-Agent genérico y NO expone datos del usuario/cliente.
 * - Solo viaja el texto "Ciudad, País" (geografía pública), nada privado.
 * - Respaldo: si no hay internet o no encuentra, el front deja ingresar lat/lon a mano.
 *
 * Uso: GET /api/geocode?ciudad=Buenos Aires&pais=Argentina
 */
export async function GET(req: NextRequest) {
  const ciudad = (req.nextUrl.searchParams.get('ciudad') || '').trim()
  const pais = (req.nextUrl.searchParams.get('pais') || '').trim()
  const q = [ciudad, pais].filter(Boolean).join(', ')
  if (!q) return NextResponse.json({ error: 'Falta ciudad/país' }, { status: 400, headers: noStore })

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'crm-tamoin-latam/1.0 (geocoding de ciudades)',
        'Accept-Language': 'es',
      },
      cache: 'no-store',
    })
    if (!r.ok) return NextResponse.json({ found: false, error: 'geocoder no disponible' }, { status: 200, headers: noStore })
    const arr = await r.json()
    if (!Array.isArray(arr) || arr.length === 0) {
      return NextResponse.json({ found: false }, { headers: noStore })
    }
    const lat = Number(arr[0].lat)
    const lon = Number(arr[0].lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json({ found: false }, { headers: noStore })
    }
    return NextResponse.json(
      { found: true, lat: Math.round(lat * 1e6) / 1e6, lon: Math.round(lon * 1e6) / 1e6, nombre: arr[0].display_name || q },
      { headers: noStore },
    )
  } catch (err) {
    console.error('[api/geocode] error:', err)
    return NextResponse.json({ found: false, error: 'error de geocoding' }, { status: 200, headers: noStore })
  }
}
