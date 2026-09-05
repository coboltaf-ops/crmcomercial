import { makeListHandlers } from '@/shared/lib/list-route'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Maquinaria y Equipos son PROPIOS de crmgtm (multipaís). Cada usuario ve/administra
// solo los de su país; GLOBAL/Admin ve todos. El servidor filtra y sella el país.
export const { GET, POST } = makeListHandlers('maquinarias-equipos-datos', { scopePais: true })
