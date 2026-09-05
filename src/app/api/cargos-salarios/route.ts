import { makeListHandlers } from '@/shared/lib/list-route'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Cargos y Salarios son PROPIOS de crmgtm (multipaís). Cada usuario ve/administra
// solo los de su país; GLOBAL/Admin ve todos. El servidor sella el país.
export const { GET, POST } = makeListHandlers('cargos-salarios-datos', { scopePais: true })
