import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Modulo {
  id: string
  label: string
  icon: string
  href: string
  activo: boolean
  grupo?: 'principal' | 'configuracion' | 'ofertas'
}

interface ModulosState {
  modulos: Modulo[]
  toggleModulo: (id: string) => void
}

const defaultModulos: Modulo[] = [
  // ── Módulos Principales ──
  { id: 'manual', label: 'Manual uso CRM Comercial', icon: '📖', href: '/manual', activo: true, grupo: 'principal' },
  { id: 'dashboard', label: 'Dashboard', icon: '📊', href: '/dashboard', activo: true, grupo: 'principal' },
  { id: 'clientes', label: 'Empresas', icon: '🏢', href: '/clientes', activo: true, grupo: 'principal' },
  { id: 'contactos', label: 'Contactos', icon: '👤', href: '/contactos', activo: true, grupo: 'principal' },
  { id: 'prospectos', label: 'Prospectos', icon: '🧲', href: '/prospectos', activo: true, grupo: 'principal' },
  { id: 'oportunidades', label: 'Oportunidades', icon: '🎯', href: '/oportunidades', activo: true, grupo: 'principal' },
  { id: 'proyectos', label: 'Proyectos', icon: '🏗️', href: '/proyectos', activo: true, grupo: 'principal' },
  { id: 'proveedores', label: 'Proveedores', icon: '🏭', href: '/proveedores', activo: true, grupo: 'principal' },
  { id: 'productos', label: 'Productos', icon: '📦', href: '/productos', activo: true, grupo: 'principal' },
  { id: 'cotizaciones', label: 'Cotizaciones', icon: '📋', href: '/cotizaciones', activo: true, grupo: 'principal' },
  { id: 'pqrs', label: 'PQRS', icon: '📩', href: '/pqrs', activo: true, grupo: 'principal' },
  { id: 'correos', label: 'Correos Enviados', icon: '📧', href: '/correos', activo: true, grupo: 'principal' },
  { id: 'tareas', label: 'Tareas', icon: '✅', href: '/tareas', activo: true, grupo: 'principal' },

  // ── Ofertas ──
  { id: 'presupuesto-obras', label: 'Presupuesto Ofertas', icon: '🧮', href: '/presupuesto-obras', activo: true, grupo: 'ofertas' },
  { id: 'capitulos-obra', label: 'Capítulos de Oferta', icon: '🗂️', href: '/capitulos-obra', activo: true, grupo: 'ofertas' },
  { id: 'subcontratistas', label: 'Contratistas', icon: '👷', href: '/subcontratistas', activo: true, grupo: 'ofertas' },
  { id: 'presupuesto-subcontratistas', label: 'Presupuesto Contratistas', icon: '📑', href: '/presupuesto-subcontratistas', activo: true, grupo: 'ofertas' },
  { id: 'productos-varios', label: 'Productos Varios', icon: '🧱', href: '/productos-varios', activo: true, grupo: 'ofertas' },
  { id: 'maquinarias-equipos', label: 'Maquinaria y Equipos', icon: '🚜', href: '/maquinarias-equipos', activo: true, grupo: 'ofertas' },
  { id: 'cargos-salarios', label: 'Cargos y Salarios', icon: '💼', href: '/cargos-salarios', activo: true, grupo: 'ofertas' },

  { id: 'referencias', label: 'Referencias', icon: '⚙️', href: '/referencias', activo: true, grupo: 'configuracion' },
  { id: 'factores-monedas', label: 'Factores Conversión Monedas', icon: '💱', href: '/factores-monedas', activo: true, grupo: 'configuracion' },

  // ── Configuración ──
  { id: 'usuarios', label: 'Usuarios', icon: '🔐', href: '/usuarios', activo: true, grupo: 'configuracion' },
  { id: 'email-marketing', label: 'Email Marketing', icon: '📨', href: '/email-marketing', activo: true, grupo: 'configuracion' },
  { id: 'flujos', label: 'Automatizaciones', icon: '⚡', href: '/flujos', activo: true, grupo: 'configuracion' },
  { id: 'datos-empresa', label: 'Mi Empresa', icon: '🏛️', href: '/datos-empresa', activo: true, grupo: 'configuracion' },
  { id: 'disenador-correos', label: 'Diseñador Correos', icon: '🎨', href: '/disenador-correos', activo: true, grupo: 'configuracion' },
  { id: 'modulos', label: 'Módulos', icon: '🧩', href: '/modulos', activo: true, grupo: 'configuracion' },
  { id: 'auditoria', label: 'Auditoría', icon: '🔍', href: '/auditoria', activo: true, grupo: 'configuracion' },
]

export const useModulosStore = create<ModulosState>()(
  persist(
    (set) => ({
      modulos: defaultModulos,
      toggleModulo: (id) => set((s) => ({
        modulos: s.modulos.map(m => m.id === id ? { ...m, activo: !m.activo } : m)
      })),
    }),
    {
      name: 'crm-modulos-storage',
      merge: (persisted, current) => {
        const p = persisted as ModulosState
        const saved = p?.modulos || []
        // Always use default labels/icons/href/grupo, only keep user's activo state
        const merged = defaultModulos.map(dm => {
          const existing = saved.find(s => s.id === dm.id)
          return existing ? { ...dm, activo: existing.activo } : dm
        })
        return { ...current, modulos: merged }
      },
    }
  )
)
