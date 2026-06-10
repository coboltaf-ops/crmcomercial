import { create } from 'zustand'
import { BaseReference, ReferenceTableId, Vendedor } from '../types'

type RefData = Record<ReferenceTableId, BaseReference[]>

interface ReferenceState {
  data: RefData
  vendedores: Vendedor[]
  loaded: boolean
  loadReferencias: () => Promise<void>
  addItem: (table: ReferenceTableId, item: BaseReference) => void
  updateItem: (table: ReferenceTableId, id: string, item: Partial<BaseReference>) => void
  deleteItem: (table: ReferenceTableId, id: string) => void
  addVendedor: (v: Vendedor) => void
  updateVendedor: (id: string, v: Partial<Vendedor>) => void
  deleteVendedor: (id: string) => void
}

const initialData: RefData = {
  pais: [
    { id: '1', descripcion: 'Colombia', situacion: true },
    { id: '2', descripcion: 'Venezuela', situacion: true },
    { id: '3', descripcion: 'Ecuador', situacion: true },
    { id: '4', descripcion: 'Perú', situacion: true },
    { id: '5', descripcion: 'Panamá', situacion: true },
  ],
  ciudad: [
    { id: '1', descripcion: 'Bogotá', situacion: true },
    { id: '2', descripcion: 'Medellín', situacion: true },
    { id: '3', descripcion: 'Cali', situacion: true },
    { id: '4', descripcion: 'Barranquilla', situacion: true },
  ],
  actividad_cliente: [
    { id: '1', descripcion: 'Construcción', situacion: true },
    { id: '2', descripcion: 'Tecnología', situacion: true },
    { id: '3', descripcion: 'Comercio', situacion: true },
    { id: '4', descripcion: 'Servicios', situacion: true },
    { id: '5', descripcion: 'Manufactura', situacion: true },
  ],
  situacion_cliente: [
    { id: '1', descripcion: 'Activo', situacion: true },
    { id: '2', descripcion: 'Inactivo', situacion: true },
    { id: '3', descripcion: 'Prospecto', situacion: true },
  ],
  situacion_contacto: [
    { id: '1', descripcion: 'Activo', situacion: true },
    { id: '2', descripcion: 'Inactivo', situacion: true },
  ],
  situacion_cotizacion: [
    { id: '1', descripcion: 'Borrador', situacion: true },
    { id: '2', descripcion: 'Enviada', situacion: true },
    { id: '3', descripcion: 'Aprobada', situacion: true },
    { id: '4', descripcion: 'Rechazada', situacion: true },
    { id: '5', descripcion: 'Vencida', situacion: true },
  ],
  situacion_lista: [
    { id: '1', descripcion: 'Activo', situacion: true },
    { id: '2', descripcion: 'Inactivo', situacion: true },
    { id: '3', descripcion: 'Descontinuado', situacion: true },
  ],
  situacion_oportunidad: [
    { id: '1', descripcion: 'Abierta', situacion: true },
    { id: '2', descripcion: 'Ganada', situacion: true },
    { id: '3', descripcion: 'Perdida', situacion: true },
    { id: '4', descripcion: 'En Negociación', situacion: true },
  ],
  situacion_pqrs: [
    { id: '1', descripcion: 'Abierta', situacion: true },
    { id: '2', descripcion: 'En Proceso', situacion: true },
    { id: '3', descripcion: 'Cerrada', situacion: true },
    { id: '4', descripcion: 'Escalada', situacion: true },
  ],
  tipo_pqrs: [
    { id: '1', descripcion: 'Petición', situacion: true },
    { id: '2', descripcion: 'Queja', situacion: true },
    { id: '3', descripcion: 'Reclamo', situacion: true },
    { id: '4', descripcion: 'Sugerencia', situacion: true },
  ],
  tipo_identificacion: [
    { id: '1', descripcion: 'NIT', situacion: true },
    { id: '2', descripcion: 'Cédula', situacion: true },
    { id: '3', descripcion: 'Pasaporte', situacion: true },
    { id: '4', descripcion: 'RUC', situacion: true },
  ],
  tipo_moneda: [
    { id: '1', descripcion: 'Pesos Colombianos', situacion: true },
    { id: '2', descripcion: 'Dólares', situacion: true },
    { id: '3', descripcion: 'Euros', situacion: true },
  ],
  condiciones_pago: [
    { id: '1', descripcion: 'Contado', situacion: true },
    { id: '2', descripcion: '15 días', situacion: true },
    { id: '3', descripcion: '30 días', situacion: true },
    { id: '4', descripcion: '60 días', situacion: true },
    { id: '5', descripcion: '90 días', situacion: true },
  ],
  origen_oportunidad: [
    { id: '1', descripcion: 'Referido', situacion: true },
    { id: '2', descripcion: 'Web', situacion: true },
    { id: '3', descripcion: 'Llamada', situacion: true },
    { id: '4', descripcion: 'Evento', situacion: true },
    { id: '5', descripcion: 'Redes Sociales', situacion: true },
  ],
  etapa_oportunidad: [
    { id: '1', descripcion: 'Prospección', situacion: true },
    { id: '2', descripcion: 'Calificación', situacion: true },
    { id: '3', descripcion: 'Propuesta', situacion: true },
    { id: '4', descripcion: 'Negociación', situacion: true },
    { id: '5', descripcion: 'Cierre', situacion: true },
  ],
  prioridad_pqrs: [
    { id: '1', descripcion: 'Baja', situacion: true },
    { id: '2', descripcion: 'Media', situacion: true },
    { id: '3', descripcion: 'Alta', situacion: true },
    { id: '4', descripcion: 'Urgente', situacion: true },
  ],
  roles: [
    { id: '1', descripcion: 'Admin', situacion: true },
    { id: '2', descripcion: 'Ventas', situacion: true },
    { id: '3', descripcion: 'Soporte', situacion: true },
    { id: '4', descripcion: 'Gerencia', situacion: true },
  ],
  nivel_influencia: [
    { id: '1', descripcion: 'Decisor', situacion: true },
    { id: '2', descripcion: 'Influenciador', situacion: true },
    { id: '3', descripcion: 'Usuario Final', situacion: true },
    { id: '4', descripcion: 'Evaluador Técnico', situacion: true },
    { id: '5', descripcion: 'Patrocinador', situacion: true },
  ],
  porcentaje_impuestos: [
    { id: '1', descripcion: '0%', situacion: true },
    { id: '2', descripcion: '5%', situacion: true },
    { id: '3', descripcion: '8%', situacion: true },
    { id: '4', descripcion: '16%', situacion: true },
    { id: '5', descripcion: '19%', situacion: true },
  ],
  categoria_productos: [],
  unidad_medida: [
    { id: '1', descripcion: 'Unidad', situacion: true },
    { id: '2', descripcion: 'Kilogramo', situacion: true },
    { id: '3', descripcion: 'Litro', situacion: true },
    { id: '4', descripcion: 'Metro', situacion: true },
    { id: '5', descripcion: 'Caja', situacion: true },
    { id: '6', descripcion: 'Paquete', situacion: true },
  ],
  situacion_prospecto: [
    { id: '0', descripcion: 'Sin Contactar', situacion: true },
    { id: '1', descripcion: 'Nuevo', situacion: true },
    { id: '2', descripcion: 'Contactado', situacion: true },
    { id: '3', descripcion: 'Calificado', situacion: true },
    { id: '4', descripcion: 'En Negociación', situacion: true },
    { id: '5', descripcion: 'Convertido', situacion: true },
    { id: '6', descripcion: 'Descartado', situacion: true },
  ],
  situacion_proyecto: [
    { id: '1', descripcion: 'En Planeación', situacion: true },
    { id: '2', descripcion: 'En Ejecución', situacion: true },
    { id: '3', descripcion: 'Suspendido', situacion: true },
    { id: '4', descripcion: 'Finalizado', situacion: true },
    { id: '5', descripcion: 'Cancelado', situacion: true },
  ],
  origen_prospecto: [
    { id: '1', descripcion: 'Web', situacion: true },
    { id: '2', descripcion: 'Referido', situacion: true },
    { id: '3', descripcion: 'Llamada', situacion: true },
    { id: '4', descripcion: 'Evento', situacion: true },
    { id: '5', descripcion: 'Redes Sociales', situacion: true },
    { id: '6', descripcion: 'Email', situacion: true },
    { id: '7', descripcion: 'Otro', situacion: true },
  ],
  vendedores: [],
}

const sortItems = (items: BaseReference[]) => [...items].sort((a, b) => a.descripcion.localeCompare(b.descripcion))

// Combina lo guardado con initialData para que SIEMPRE existan todas las tablas
// (incluidas las nuevas que se agreguen al sistema, ej. situacion_proyecto).
function mergeData(saved?: Partial<RefData> | null): RefData {
  const merged = { ...initialData } as RefData
  if (saved) {
    for (const key of Object.keys(initialData) as ReferenceTableId[]) {
      merged[key] = saved[key] ?? initialData[key]
    }
  }
  return merged
}

// Persiste { data, vendedores } en Vercel KV vía /api/referencias.
async function persistRef(data: RefData, vendedores: Vendedor[]) {
  try {
    await fetch('/api/referencias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, vendedores }),
    })
  } catch (err) {
    console.error('[reference-store] persist error:', err)
  }
}

export const useReferenceStore = create<ReferenceState>()((set, get) => ({
  data: initialData,
  vendedores: [],
  loaded: false,
  loadReferencias: async () => {
    try {
      const res = await fetch('/api/referencias', { cache: 'no-store' })
      const kv = await res.json()
      if (kv && kv.data) {
        set({ data: mergeData(kv.data), vendedores: kv.vendedores || [], loaded: true })
        return
      }
      // KV vacío: usar los catálogos por defecto (NO leer datos viejos del navegador)
      set({ data: initialData, vendedores: [], loaded: true })
    } catch (err) {
      console.error('[reference-store] load error:', err)
      set({ loaded: true })
    }
  },
  addItem: (table, item) => {
    const data = { ...get().data, [table]: sortItems([...(get().data[table] || []), item]) }
    set({ data }); persistRef(data, get().vendedores)
  },
  updateItem: (table, id, item) => {
    const data = { ...get().data, [table]: sortItems((get().data[table] || []).map(r => r.id === id ? { ...r, ...item } : r)) }
    set({ data }); persistRef(data, get().vendedores)
  },
  deleteItem: (table, id) => {
    const data = { ...get().data, [table]: (get().data[table] || []).filter(r => r.id !== id) }
    set({ data }); persistRef(data, get().vendedores)
  },
  addVendedor: (v) => {
    const vendedores = [...get().vendedores, v].sort((a, b) => a.nombre.localeCompare(b.nombre))
    set({ vendedores }); persistRef(get().data, vendedores)
  },
  updateVendedor: (id, v) => {
    const vendedores = get().vendedores.map(x => x.id === id ? { ...x, ...v } : x).sort((a, b) => a.nombre.localeCompare(b.nombre))
    set({ vendedores }); persistRef(get().data, vendedores)
  },
  deleteVendedor: (id) => {
    const vendedores = get().vendedores.filter(x => x.id !== id)
    set({ vendedores }); persistRef(get().data, vendedores)
  },
}))
