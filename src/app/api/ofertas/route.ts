import { makeListHandlers } from '@/shared/lib/list-route'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Presupuesto Ofertas son PROPIAS de crmgtm (multipaís). Cada usuario ve/administra
// solo las de su país; GLOBAL/Admin ve todas. El servidor filtra y sella el país.
export const { GET, POST } = makeListHandlers('ofertas-datos', { scopePais: true })
