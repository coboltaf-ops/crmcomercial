import { type Auditoria } from '@/shared/lib/audit'

// Conceptos de recurso de un renglón de la oferta (APU)
export const CONCEPTOS = ['MOD', 'MOI', 'Materiales', 'Maquinaria y Vehículos', 'Subcontrato', 'Otro'] as const
export type Concepto = typeof CONCEPTOS[number]

// De qué maestro se jala cada concepto
export const origenDeConcepto = (c: string): 'personal' | 'producto' | 'cotizacion' | 'maquinaria' | 'manual' => {
  if (c === 'MOD' || c === 'MOI') return 'personal'
  if (c === 'Materiales') return 'producto'
  if (c === 'Subcontrato') return 'cotizacion'
  if (c === 'Maquinaria y Vehículos') return 'maquinaria'
  return 'manual' // Otro
}

// Tipo de renglón: T1 = Título · T2 = Subtítulo · D1..D6 = Detalle (el tipo ES el concepto)
export const TIPOS_RENGLON = [
  { v: 'T1', l: 'T1 · Título' },
  { v: 'T2', l: 'T2 · Subtítulo' },
  { v: 'D1', l: 'D1 · MOD' },
  { v: 'D2', l: 'D2 · MOI' },
  { v: 'D3', l: 'D3 · Materiales' },
  { v: 'D4', l: 'D4 · Maquinaria' },
  { v: 'D5', l: 'D5 · Subcontrato' },
  { v: 'D6', l: 'D6 · Otro' },
] as const

// D1..D6 → concepto
export const tipoConcepto: Record<string, string> = {
  D1: 'MOD', D2: 'MOI', D3: 'Materiales', D4: 'Maquinaria y Vehículos', D5: 'Subcontrato', D6: 'Otro',
}
export const esDetalle = (tipo: string) => (tipo || '').startsWith('D')

export type RenglonOferta = {
  id: string
  tipo: string              // T1 | T2 | D
  codigo: string            // código del renglón (jerárquico)
  concepto: string          // MOD | MOI | Materiales | Maquinaria y Vehículos | Subcontrato | Otro (solo D)
  ref_id: string            // id del recurso origen (personal/producto/cotización)
  descripcion: string
  unidad: string
  cantidad: number
  costo_unitario: number     // snapshot del costo del recurso
  margen: number             // % de margen aplicado a este renglón
}

export type Oferta = Auditoria & {
  id: string
  nro: number
  consecutivo: string        // PR-00001 (Oferta)
  proyecto: string           // (compat) espejo del Cliente para reportes/listado
  cliente?: string           // Cliente de la oferta
  comercial?: string         // Comercial responsable de la oferta
  responsable_tecnico?: string // Responsable Técnico de la oferta
  codigo_gtm?: string        // Código GTM de la oferta
  unidad_negocio?: string    // Unidad de Negocio
  lugar_ejecucion?: string   // Lugar de ejecución
  fecha_emision: string      // Fecha Comienzo Elaboración
  moneda: string             // de Referencias (Tipos de Moneda)
  margen_general: number     // % de Utilidad de la oferta (se aplica a todos los renglones)
  pct_impuesto: number       // % de Referencias (Impuestos)
  monto_calculado?: number   // Monto Calculado de la Oferta (Venta + Impuesto) — se sincroniza en cada cambio
  alcance: string            // descripción del alcance del proyecto
  observaciones: string
  renglones: RenglonOferta[]
  situacion: string          // Borrador · Enviada · Ganada · Perdida
  pais: string               // País de la oferta (multipaís). GLOBAL/Admin ve todos.
}

// Cálculos por renglón
export const precioUnit = (r: RenglonOferta) => (r.costo_unitario || 0) * (1 + (r.margen || 0) / 100)
export const costoTotal = (r: RenglonOferta) => (r.costo_unitario || 0) * (r.cantidad || 0)
export const montoVenta = (r: RenglonOferta) => precioUnit(r) * (r.cantidad || 0)

export const nextOfertaConsecutivo = (lista: Oferta[]): string => {
  const max = lista.reduce((m, r) => Math.max(m, r.nro || 0), 0)
  return `PR-${String(max + 1).padStart(5, '0')}`
}
