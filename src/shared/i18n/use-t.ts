const translations: Record<string, string> = {
  'back': 'Atrás',
  'btn.cancelar': 'Cancelar',
  'btn.editar': 'Editar',
  'btn.eliminar': 'Eliminar',
  'btn.volver': 'Volver',
  'fmt.editarOportunidad': 'Editar Oportunidad',
  'fmt.nuevaOportunidad': 'Nueva Oportunidad',
  'lbl.adjudicacion': 'Adjudicación',
  'lbl.adjudicacionMMAAAA': 'Adjudicación (MM/AAAA)',
  'lbl.ciudad': 'Ciudad',
  'lbl.cliente': 'Cliente',
  'lbl.codigo': 'Código',
  'lbl.controlOferta': 'Control de Oferta',
  'lbl.datosPrincipales': 'Datos Principales',
  'lbl.ejecucionAnyo': 'Ejecución Año %',
  'lbl.empresaGanadora': 'Empresa Ganadora',
  'lbl.fechaEsperadaVeredicto': 'Fecha Esperada Veredicto',
  'lbl.fechaFinalConsultas': 'Fecha Final Consultas',
  'lbl.fechaInicioConsultas': 'Fecha Inicio Consultas',
  'lbl.fechaPresentarOferta': 'Fecha Presentar Oferta',
  'lbl.fechaPresupuesto': 'Fecha Presupuesto',
  'lbl.fechaRealPresentacion': 'Fecha Real Presentación',
  'lbl.fechaRegistro': 'Fecha Registro',
  'lbl.mgc': 'MGC %',
  'lbl.montoEstimado': 'Monto Estimado US$',
  'lbl.montoRealOferta': 'Monto Real Oferta',
  'lbl.nroOportunidad': 'Nro Oportunidad',
  'lbl.observaciones': 'Observaciones',
  'lbl.pais': 'País',
  'lbl.parcialDolarProbable': 'Parcial $ Probable',
  'lbl.parcialEuros': 'Parcial Año €',
  'lbl.probabilidad': 'Probabilidad %',
  'lbl.proyecto': 'Proyecto',
  'lbl.responsable': 'Responsable',
  'lbl.situacion': 'Situación',
  'lbl.veredicto': 'Veredicto',
  'open': 'Abrir',
  'page.oportunidades.btnNuevo': 'Nueva Oportunidad',
  'page.oportunidades.subtitle': 'Gestión de Oportunidades Comerciales',
  'page.oportunidades.title': 'Oportunidades',
  'ph.buscarOportunidad': 'Buscar por proyecto, código o cliente...',
  'tab.registros': 'Registros',
  'tab.reportes': 'Reportes',
}

export function useT() {
  return (key: string) => translations[key] || key
}

export function useIdioma() {
  return 'es'
}

export function useTStatus() {
  return (status: string) => status
}
