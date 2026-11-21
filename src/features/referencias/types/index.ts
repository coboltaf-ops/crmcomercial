export interface BaseReference {
  id: string
  descripcion: string
  situacion: boolean
  padre_id?: string // Árbol jerárquico (ej. Ubicaciones: País → Ciudad). Vacío = raíz.
  lat?: number      // Coordenada (solo Ciudad en 'ubicaciones') — para el mapa.
  lon?: number
}

// Tablas jerárquicas (árbol) y las etiquetas de cada nivel.
export const JERARQUIA_NIVELES: Record<string, string[]> = {
  ubicaciones: ['País', 'Ciudad'],
}

export interface Vendedor {
  id: string
  codigo: string
  nombre: string
  apellido: string
  correo: string
  nro_movil: string
  situacion: boolean
}

export const REFERENCE_TABLES = [
  { id: 'ubicaciones', label: 'Ubicaciones (País → Ciudad)' },
  { id: 'pais', label: 'País' },
  { id: 'ciudad', label: 'Ciudad' },
  { id: 'actividad_cliente', label: 'Actividad Empresa' },
  { id: 'situacion_cliente', label: 'Situación Empresa' },
  { id: 'situacion_contacto', label: 'Situación Contacto' },
  { id: 'situacion_cotizacion', label: 'Situación Cotización' },
  { id: 'situacion_lista', label: 'Situación Lista' },
  { id: 'situacion_oportunidad', label: 'Situación Oportunidad' },
  { id: 'situacion_pqrs', label: 'Situación PQRS' },
  { id: 'tipo_pqrs', label: 'Tipo PQRS' },
  { id: 'tipo_identificacion', label: 'Tipo Identificación' },
  { id: 'tipo_moneda', label: 'Tipo Moneda' },
  { id: 'condiciones_pago', label: 'Condiciones de Pago' },
  { id: 'origen_oportunidad', label: 'Origen Oportunidad' },
  { id: 'etapa_oportunidad', label: 'Etapa Oportunidad' },
  { id: 'veredicto_oferta', label: 'Veredicto' },
  { id: 'situacion_oferta', label: 'Situación Oferta' },
  { id: 'prioridad_pqrs', label: 'Prioridad PQRS' },
  { id: 'roles', label: 'Roles' },
  { id: 'nivel_influencia', label: 'Nivel Influencia' },
  { id: 'porcentaje_impuestos', label: '% Impuestos' },
  { id: 'categoria_productos', label: 'Categoría Productos' },
  { id: 'unidad_medida', label: 'Unidad de Medida' },
  { id: 'situacion_prospecto', label: 'Situación Prospecto' },
  { id: 'origen_prospecto', label: 'Origen Prospecto' },
  { id: 'situacion_proyecto', label: 'Situación Proyecto' },
  { id: 'actividad_proveedor', label: 'Actividad Proveedor' },
  { id: 'calificacion_proveedor', label: 'Calificación Proveedor' },
  { id: 'situacion_proveedor', label: 'Situación Proveedor' },
  { id: 'vendedores', label: 'Vendedores', custom: true },
] as const

export type ReferenceTableId = typeof REFERENCE_TABLES[number]['id']
