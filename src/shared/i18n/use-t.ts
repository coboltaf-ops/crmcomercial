import { create } from 'zustand'

interface I18nState {
  idioma: 'es' | 'en'
  setIdioma: (idioma: 'es' | 'en') => void
}

const useI18nStore = create<I18nState>(set => ({
  idioma: 'es',
  setIdioma: (idioma) => set({ idioma }),
}))

const translations: Record<string, Record<string, string>> = {
  es: {
    'lbl.nroOportunidad': 'Nro Oportunidad',
    'lbl.fechaRegistro': 'Fecha Registro',
    'lbl.codigo': 'Código',
    'lbl.cliente': 'Cliente',
    'lbl.proyecto': 'Proyecto',
    'lbl.ciudad': 'Ciudad',
    'lbl.pais': 'País',
    'lbl.fechaPresupuesto': 'Fecha Presupuesto',
    'lbl.situacion': 'Situación',
    'lbl.responsable': 'Responsable',
    'lbl.probabilidad': 'Probabilidad %',
    'lbl.parcialDolarProbable': 'Parcial $ Probable',
    'lbl.adjudicacionMMAAAA': 'Adjudicación (MM/AAAA)',
    'lbl.mgc': 'Margen Comercial %',
    'lbl.ejecucionAnyo': 'Ejecución Año %',
    'lbl.veredicto': 'Veredicto',
    'lbl.empresaGanadora': 'Empresa Ganadora',
    'lbl.datosPrincipales': 'Datos Principales',
    'lbl.controlOferta': 'Control de Oferta',
    'lbl.observaciones': 'Observaciones',
    'campo.seleccionar': 'Seleccionar',
    'btn.volver': 'Volver',
    'btn.cancelar': 'Cancelar',
    'btn.editar': 'Editar',
    'btn.eliminar': 'Eliminar',
    'fmt.nuevaOportunidad': 'Nueva Oportunidad',
    'fmt.editarOportunidad': 'Editar Oportunidad',
    'page.oportunidades.title': 'Oportunidades',
    'page.oportunidades.subtitle': 'Gestión de oportunidades de negocio',
    'page.oportunidades.btnNuevo': '+ Nueva Oportunidad',
    'tab.registros': 'Registros',
    'tab.reportes': 'Reportes',
    'ph.buscarOportunidad': 'Buscar por proyecto, código o cliente...',
  },
  en: {
    'lbl.nroOportunidad': 'Opportunity #',
    'lbl.fechaRegistro': 'Registration Date',
    'lbl.codigo': 'Code',
    'lbl.cliente': 'Client',
    'lbl.proyecto': 'Project',
    'lbl.ciudad': 'City',
    'lbl.pais': 'Country',
    'lbl.fechaPresupuesto': 'Budget Date',
    'lbl.situacion': 'Status',
    'lbl.responsable': 'Responsible',
    'lbl.probabilidad': 'Probability %',
    'lbl.parcialDolarProbable': 'Probable $ Partial',
    'lbl.adjudicacionMMAAAA': 'Award (MM/YYYY)',
    'lbl.mgc': 'Commercial Margin %',
    'lbl.ejecucionAnyo': 'Year Execution %',
    'lbl.veredicto': 'Verdict',
    'lbl.empresaGanadora': 'Winning Company',
    'lbl.datosPrincipales': 'Main Data',
    'lbl.controlOferta': 'Offer Control',
    'lbl.observaciones': 'Observations',
    'campo.seleccionar': 'Select',
    'btn.volver': 'Back',
    'btn.cancelar': 'Cancel',
    'btn.editar': 'Edit',
    'btn.eliminar': 'Delete',
    'fmt.nuevaOportunidad': 'New Opportunity',
    'fmt.editarOportunidad': 'Edit Opportunity',
    'page.oportunidades.title': 'Opportunities',
    'page.oportunidades.subtitle': 'Business opportunity management',
    'page.oportunidades.btnNuevo': '+ New Opportunity',
    'tab.registros': 'Records',
    'tab.reportes': 'Reports',
    'ph.buscarOportunidad': 'Search by project, code or client...',
  },
}

const statusTranslations: Record<string, Record<string, string>> = {
  es: {
    'Abierta': 'Abierta',
    'En Negociación': 'En Negociación',
    'Ganada': 'Ganada',
    'Perdida': 'Perdida',
    'Activo': 'Activo',
    'Inactivo': 'Inactivo',
  },
  en: {
    'Abierta': 'Open',
    'En Negociación': 'Negotiating',
    'Ganada': 'Won',
    'Perdida': 'Lost',
    'Activo': 'Active',
    'Inactivo': 'Inactive',
  },
}

export function useT() {
  const idioma = useI18nStore(s => s.idioma)
  return (key: string, defaultValue?: string) => {
    return translations[idioma]?.[key] || translations['es']?.[key] || defaultValue || key
  }
}

export function useIdioma() {
  return useI18nStore(s => s.idioma)
}

export function useTStatus() {
  const idioma = useI18nStore(s => s.idioma)
  return (key: string, defaultValue?: string) => {
    return statusTranslations[idioma]?.[key] || statusTranslations['es']?.[key] || defaultValue || key
  }
}
