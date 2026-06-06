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
    'lbl.actividad': 'Actividad',
    'lbl.adjudicacion': 'Adjudicación',
    'lbl.apellido': 'Apellido',
    'lbl.asunto': 'Asunto',
    'lbl.cargo': 'Cargo',
    'lbl.categoria': 'Categoría',
    'lbl.celular': 'Celular',
    'lbl.codigoPostal': 'Código Postal',
    'lbl.condicionPago': 'Condición de Pago',
    'lbl.condicionPagoCorta': 'Cond. Pago',
    'lbl.contacto': 'Contacto',
    'lbl.correo': 'Correo',
    'lbl.correoEmpresa': 'Correo Empresa',
    'lbl.departamento': 'Departamento',
    'lbl.descripcion': 'Descripción',
    'lbl.detalleRequerimiento': 'Detalle del Requerimiento',
    'lbl.direccion': 'Dirección',
    'lbl.email': 'Correo Electrónico',
    'lbl.empresa': 'Empresa',
    'lbl.fechaAsignacionTask': 'Fecha de Asignación',
    'lbl.fechaEmision': 'Fecha de Emisión',
    'lbl.fechaEsperadaVeredicto': 'Fecha Esperada de Veredicto',
    'lbl.fechaFinalConsultas': 'Fecha Final de Consultas',
    'lbl.fechaInicioConsultas': 'Fecha Inicio de Consultas',
    'lbl.fechaNacimiento': 'Fecha de Nacimiento',
    'lbl.fechaPresentarOferta': 'Fecha para Presentar Oferta',
    'lbl.fechaRealFin': 'Fecha Real de Fin',
    'lbl.fechaRealPresentacion': 'Fecha Real de Presentación',
    'lbl.fechaRequeridaFin': 'Fecha Requerida de Fin',
    'lbl.fechaVencimiento': 'Fecha de Vencimiento',
    'lbl.horaAsignacion': 'Hora de Asignación',
    'lbl.logoEmpresa': 'Logo de la Empresa',
    'lbl.mensaje': 'Mensaje',
    'lbl.moneda': 'Moneda',
    'lbl.montoEstimado': 'Monto Estimado',
    'lbl.montoRealOferta': 'Monto Real de la Oferta',
    'lbl.movil': 'Móvil',
    'lbl.nivelInfluencia': 'Nivel de Influencia',
    'lbl.nombre': 'Nombre',
    'lbl.nombreComercial': 'Nombre Comercial',
    'lbl.nombreEmpresa': 'Nombre de la Empresa',
    'lbl.nroDocumento': 'Nro de Documento',
    'lbl.nroMovil': 'Nro Móvil',
    'lbl.oportunidad': 'Oportunidad',
    'lbl.origenProspecto': 'Origen del Prospecto',
    'lbl.paginaWeb': 'Página Web',
    'lbl.para': 'Para',
    'lbl.parcialEuros': 'Parcial €',
    'lbl.personaQueAsigna': 'Persona que Asigna',
    'lbl.personaQueEjecuta': 'Persona que Ejecuta',
    'lbl.precioUnitario': 'Precio Unitario',
    'lbl.prioridad': 'Prioridad',
    'lbl.razonSocial': 'Razón Social',
    'lbl.representanteLegal': 'Representante Legal',
    'lbl.rol': 'Rol',
    'lbl.sinLogo': 'Sin Logo',
    'lbl.sitioWeb': 'Sitio Web',
    'lbl.subtotal': 'Subtotal',
    'lbl.telefono': 'Teléfono',
    'lbl.telefonoEmpresa': 'Teléfono Empresa',
    'lbl.tipo': 'Tipo',
    'lbl.tipoIdentificacion': 'Tipo de Identificación',
    'lbl.total': 'Total',
    'lbl.ubicacion': 'Ubicación',
    'lbl.unidadMedida': 'Unidad de Medida',
    'lbl.vendedor': 'Vendedor',
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
    'page.clientes.title': 'Empresas',
    'page.clientes.subtitle': 'Gestión de empresas',
    'page.clientes.btnNuevo': '+ Nueva Empresa',
    'page.contactos.title': 'Contactos',
    'page.contactos.subtitle': 'Gestión de contactos',
    'page.contactos.btnNuevo': '+ Nuevo Contacto',
    'page.productos.title': 'Productos',
    'page.productos.subtitle': 'Gestión de productos',
    'page.productos.btnNuevo': '+ Nuevo Producto',
    'page.cotizaciones.title': 'Cotizaciones',
    'page.cotizaciones.subtitle': 'Gestión de cotizaciones',
    'page.cotizaciones.btnNuevo': '+ Nueva Cotización',
    'page.prospectos.title': 'Prospectos',
    'page.prospectos.subtitle': 'Gestión de prospectos',
    'page.prospectos.btnNuevo': '+ Nuevo Prospecto',
    'page.usuarios.title': 'Usuarios',
    'page.usuarios.subtitle': 'Gestión de usuarios',
    'page.usuarios.btnNuevo': '+ Nuevo Usuario',
    'page.tareas.title': 'Tareas',
    'page.tareas.subtitle': 'Gestión de tareas',
    'page.tareas.btnNuevo': '+ Nueva Tarea',
    'page.miEmpresa.title': 'Mi Empresa',
    'page.miEmpresa.subtitle': 'Datos de la empresa',
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
    'page.clientes.title': 'Companies',
    'page.clientes.subtitle': 'Company management',
    'page.clientes.btnNuevo': '+ New Company',
    'page.contactos.title': 'Contacts',
    'page.contactos.subtitle': 'Contact management',
    'page.contactos.btnNuevo': '+ New Contact',
    'page.productos.title': 'Products',
    'page.productos.subtitle': 'Product management',
    'page.productos.btnNuevo': '+ New Product',
    'page.cotizaciones.title': 'Quotations',
    'page.cotizaciones.subtitle': 'Quotation management',
    'page.cotizaciones.btnNuevo': '+ New Quotation',
    'page.prospectos.title': 'Prospects',
    'page.prospectos.subtitle': 'Prospect management',
    'page.prospectos.btnNuevo': '+ New Prospect',
    'page.usuarios.title': 'Users',
    'page.usuarios.subtitle': 'User management',
    'page.usuarios.btnNuevo': '+ New User',
    'page.tareas.title': 'Tasks',
    'page.tareas.subtitle': 'Task management',
    'page.tareas.btnNuevo': '+ New Task',
    'page.miEmpresa.title': 'Company Data',
    'page.miEmpresa.subtitle': 'Company information',
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

// Convierte una clave sin traducción (ej. 'lbl.nombreComercial') en texto
// legible ('Nombre Comercial') en vez de mostrar la clave cruda en pantalla.
function humanizeKey(key: string): string {
  const last = key.includes('.') ? key.slice(key.lastIndexOf('.') + 1) : key
  const words = last
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export function useT() {
  const idioma = useI18nStore(s => s.idioma)
  return (key: string, defaultValue?: string) => {
    return translations[idioma]?.[key] || translations['es']?.[key] || defaultValue || humanizeKey(key)
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
