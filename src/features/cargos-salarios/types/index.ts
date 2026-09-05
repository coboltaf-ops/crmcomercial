import { type Auditoria } from '@/shared/lib/audit'

export type CargoSalario = Auditoria & {
  id: string
  nro: number
  consecutivo: string          // CAR-00001
  especialidad: string         // Especialidad del empleado (de Referencias)
  descripcion: string          // nombre del cargo
  tipo_mo: string              // Directa | Indirecta
  salario_dia: number
  pct_prestaciones: number
  salario_mes: number          // = (salario_dia + salario_dia × %prest) × 30 (calculado)
  fecha_actualizacion: string
  situacion: string            // Activo | Inactivo
}

// Salario Mes = (Salario Día + Salario Día × % Prestaciones) × 30
export const salarioMesCalc = (salarioDia: number, pctPrest: number) =>
  Math.round((salarioDia || 0) * (1 + (pctPrest || 0) / 100) * 30)

// Costo Día cargado = Salario Día × (1 + % Prestaciones) — lo que usa la Oferta
export const costoDiaCargado = (salarioDia: number, pctPrest: number) =>
  Math.round((salarioDia || 0) * (1 + (pctPrest || 0) / 100))

export const nextCargoConsecutivo = (lista: CargoSalario[]): string => {
  const max = lista.reduce((m, r) => Math.max(m, r.nro || 0), 0)
  return `CAR-${String(max + 1).padStart(5, '0')}`
}
