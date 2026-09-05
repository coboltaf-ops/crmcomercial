import { makeListHandlers } from '@/shared/lib/list-route'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Productos Varios son PROPIOS de crmgtm (multipaís). Cada usuario ve/administra
// solo los de su país; GLOBAL/Admin ve todos.
export const { GET, POST } = makeListHandlers('productos-varios-datos', { scopePais: true })
