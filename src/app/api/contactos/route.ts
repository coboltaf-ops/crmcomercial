import { makeListHandlers } from '@/shared/lib/list-route'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const { GET, POST } = makeListHandlers('contactos-datos')
