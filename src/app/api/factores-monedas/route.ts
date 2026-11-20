import { makeListHandlers } from '@/shared/lib/list-route'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Multipaís: cada usuario ve/administra solo los factores de SU país; GLOBAL/Admin
// ve todos. El país se sella al guardar. Un factor sin país (heredado) queda visible
// para todos, así que la data ya grabada NO se oculta a ningún país.
export const { GET, POST } = makeListHandlers('factores-monedas-datos', { scopePais: true })
