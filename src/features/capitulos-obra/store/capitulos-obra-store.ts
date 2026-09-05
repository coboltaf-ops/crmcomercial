import { create } from 'zustand'
import { apiUpsert, apiDelete } from '@/shared/lib/list-client'
import { stampCreacion, registrarAuditoria, type Auditoria } from '@/shared/lib/audit'
import { SEED_CAPITULOS } from '../seed-capitulos'

export type TipoCapitulo = 'Directo' | 'Indirecto'

export type CapituloObra = Auditoria & {
  id: string
  codigo: string
  nombre: string
  tipo: TipoCapitulo
  orden: number
  situacion: string
  // ── Jerarquía (capítulo → subcapítulos) ──
  nivel?: 'Capitulo' | 'Subcapitulo'
  capitulo_padre_id?: string     // vacío = capítulo raíz; con valor = subcapítulo de ese id
  // ── Cabecera de la Oferta a la que pertenece el capítulo (varios se traen de la oferta) ──
  oferta_consecutivo?: string    // Nro Consecutivo Oferta (PR-XXXXX)
  cliente?: string
  fecha_registro?: string
  codigo_gtm?: string            // Nro Oferta GTM
  responsable_tecnico?: string
  comercial?: string             // Responsable Comercial
  lugar_ejecucion?: string
  moneda?: string                // Tipo Moneda
  alcance?: string               // Alcance del proyecto
  pais: string                   // País del capítulo (multipaís). GLOBAL/Admin ve todos.
}

// Capítulos de Oferta — PROPIOS de crmgtm (multipaís). Se persisten POR REGISTRO en el
// servidor (/api/capitulos-obra → capitulos-obra-datos). El servidor filtra y sella el país.
const PAIS_SEED = 'Colombia'

interface CapitulosObraState {
  capitulos: CapituloObra[]
  loaded: boolean
  loadCapitulos: () => Promise<void>
  addCapitulo: (c: CapituloObra) => void
  updateCapitulo: (id: string, c: Partial<CapituloObra>) => void
  deleteCapitulo: (id: string) => void
}

export const useCapitulosObraStore = create<CapitulosObraState>()((set, get) => ({
  capitulos: [],
  loaded: false,
  loadCapitulos: async () => {
    try {
      const res = await fetch('/api/capitulos-obra', { cache: 'no-store' })
      const data = await res.json()
      const kv: CapituloObra[] = Array.isArray(data) ? data : []
      if (kv.length > 0) {
        set({ capitulos: kv, loaded: true })
        return
      }
      // Servidor vacío: sembrar los capítulos demo (una sola vez) en el servidor.
      const seed: CapituloObra[] = SEED_CAPITULOS.map((c) => ({ ...c, pais: PAIS_SEED }))
      set({ capitulos: seed, loaded: true })
      for (const c of seed) apiUpsert('/api/capitulos-obra', c)
    } catch (err) {
      console.error('[capitulos-obra-store] load error:', err)
      set({ loaded: true })
    }
  },
  addCapitulo: (c) => {
    const nuevo = stampCreacion({ ...c, pais: c.pais || PAIS_SEED })
    registrarAuditoria('Crear', 'Capítulos de Ofertas', `Creó capítulo ${c.codigo} - ${c.nombre}`)
    set((s) => ({ capitulos: [...s.capitulos, nuevo] }))
    apiUpsert('/api/capitulos-obra', nuevo)
  },
  updateCapitulo: (id, c) => {
    const actual = get().capitulos.find((r) => r.id === id)
    registrarAuditoria('Editar', 'Capítulos de Ofertas', `Editó capítulo ${c.codigo ?? actual?.codigo ?? id}`)
    const capitulos = get().capitulos.map((r) => (r.id === id ? { ...r, ...c } : r))
    set({ capitulos })
    const actualizado = capitulos.find((r) => r.id === id)
    if (actualizado) apiUpsert('/api/capitulos-obra', actualizado)
  },
  deleteCapitulo: (id) => {
    const actual = get().capitulos.find((r) => r.id === id)
    registrarAuditoria('Eliminar', 'Capítulos de Ofertas', `Eliminó capítulo ${actual?.codigo ?? id}`)
    set((s) => ({ capitulos: s.capitulos.filter((r) => r.id !== id) }))
    apiDelete('/api/capitulos-obra', id)
  },
}))
