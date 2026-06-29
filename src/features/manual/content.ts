// Contenido del Manual de Usuario. Estructura por secciones/módulos.
// Mantener al día junto con cada cambio de módulo (parte de la rutina).

export type Campo = { nombre: string; desc: string }
export type Seccion = {
  id: string
  titulo: string
  icono: string
  grupo: 'general' | 'modulo' | 'config'
  intro: string
  campos?: Campo[]
  comoUsar?: string[]
  especiales?: string[]
}

export const SECCIONES: Seccion[] = [
  // ─────────── GENERAL ───────────
  {
    id: 'introduccion', titulo: 'Introducción', icono: '👋', grupo: 'general',
    intro: 'El CRM Comercial es el sistema para gestionar toda la relación comercial: empresas/clientes, contactos, prospectos, oportunidades de negocio, proyectos, proveedores, productos, cotizaciones, PQRS y tareas. Todos los datos viven en el servidor (la nube), por lo que son compartidos: lo que registra un usuario lo ven los demás (según sus permisos).',
    comoUsar: [
      'Ingresar: escribe tu usuario y contraseña en la pantalla de inicio.',
      'Menú lateral (izquierda): cambia entre módulos. Se puede colapsar con el botón ☰.',
      'Barra superior: muestra tu nombre y rol, el selector de idioma 🇪🇸/🇺🇸 y el botón de Cerrar Sesión.',
      'Botón 🤖 Agente: asistente que responde preguntas sobre tus datos y abre módulos.',
      'El sistema se actualiza solo: cuando se publica una mejora, la pantalla se refresca automáticamente.',
    ],
    especiales: [
      'Cada registro guarda “Creado por” (nombre y usuario) y la fecha, visible en la pantalla Ver.',
      'Los campos de nombres y razones sociales se guardan en MAYÚSCULAS automáticamente.',
    ],
  },
  {
    id: 'dashboard', titulo: 'Dashboard (Tablero)', icono: '📊', grupo: 'general',
    intro: 'Pantalla de inicio con el resumen visual del negocio. Todas las tarjetas son clickeables y llevan a su módulo. Carga sus propios datos del servidor, así los conteos son reales apenas entras.',
    campos: [
      { nombre: 'Tarjeta Empresas', desc: 'Cantidad total de empresas/clientes registrados.' },
      { nombre: 'Tarjeta Contactos', desc: 'Cantidad total de contactos.' },
      { nombre: 'Tarjeta Oportunidades', desc: 'Oportunidades abiertas o en negociación (no incluye ganadas/perdidas).' },
      { nombre: 'Tarjeta Proyectos', desc: 'Cantidad total de proyectos.' },
      { nombre: 'Tarjeta Cotizaciones', desc: 'Cantidad total de cotizaciones.' },
      { nombre: 'Tarjeta PQRS Abiertas', desc: 'PQRS que no están cerradas.' },
      { nombre: 'Tarjeta Productos', desc: 'Cantidad total de productos del catálogo.' },
      { nombre: 'Pipeline de Ventas', desc: 'Barras verticales por ETAPA de la oportunidad, mostrando el monto de cada etapa. Arriba: Total de Oportunidades y Total General (suma de montos). Cada etapa con su color.' },
      { nombre: 'Proyectos por Situación', desc: 'Barras horizontales por situación del proyecto, con dos barras: Monto Aprobado (azul) y Monto Cobrado (verde). Arriba: Total Aprobado y Total Cobrado.' },
      { nombre: 'Cotizaciones', desc: 'Pendientes y total, y el desglose por situación (Borrador, Enviada, Aprobada, Rechazada, Vencida).' },
      { nombre: 'PQRS por Tipo', desc: 'Conteo por tipo: Petición, Queja, Reclamo, Sugerencia (y cuántas abiertas de cada uno).' },
      { nombre: 'Resumen General', desc: 'Empresas Activas, Contactos Principales, Productos Activos, Oportunidades Ganadas y PQRS Urgentes.' },
      { nombre: 'Clientes por Ciudad', desc: 'Barras horizontales con la cantidad de clientes en cada ciudad.' },
      { nombre: 'Clientes por Región', desc: 'Barras horizontales con la cantidad de clientes en cada región (reconoce Colombia, Perú y Ecuador; si una empresa no tiene región guardada, la deduce desde su ciudad). Colores corporativos intercalados.' },
    ],
    especiales: [
      'Cada tarjeta es un acceso directo: al hacer clic, te lleva al módulo correspondiente.',
      'Los gráficos se dibujan con los datos reales del momento; si no hay datos, la tarjeta lo indica.',
    ],
  },

  // ─────────── MÓDULOS ───────────
  {
    id: 'clientes', titulo: 'Empresas (Clientes)', icono: '🏢', grupo: 'modulo',
    intro: 'Registro de las empresas/clientes con los que se hace negocio.',
    campos: [
      { nombre: 'Código', desc: 'Consecutivo automático (CLI-XXXXX).' },
      { nombre: 'Tipo Identificación / Nro Documento', desc: 'NIT, Cédula, etc. y su número.' },
      { nombre: 'Razón Social / Nombre Comercial', desc: 'Nombre legal y comercial.' },
      { nombre: 'Actividad', desc: 'Actividad económica (desde Referencias).' },
      { nombre: 'Teléfono / Correo / Sitio Web', desc: 'Datos de contacto.' },
      { nombre: 'Ubicación', desc: 'Dirección, País, Región, Departamento (Provincia), Ciudad y Código Postal.' },
      { nombre: 'País', desc: 'Primer campo de la ubicación. Manda la cascada: al elegirlo se ajustan los desplegables de Región, Departamento (Provincia) y Ciudad a ese país (Colombia, Perú o Ecuador, con datos oficiales DANE/INEI/INEC).' },
      { nombre: 'Región → Departamento (Provincia) → Ciudad', desc: 'Cascada: eliges Región y se cargan sus Departamentos (Provincias); eliges ese y se cargan sus Ciudades. En Perú equivale a Departamento → Provincia → Distrito; en Ecuador a Provincia → Cantón → Parroquia.' },
      { nombre: 'Condición de Pago / Moneda', desc: 'Términos comerciales.' },
      { nombre: 'Situación', desc: 'Activo, Inactivo, Prospecto.' },
      { nombre: 'Código de Acceso PQRS', desc: 'Permite a la empresa radicar PQRS desde el formulario público.' },
    ],
    comoUsar: [
      'Clic en “+ Nuevo” para crear; llena los campos y Guardar.',
      'En Ubicación, elige primero el País y luego baja por la cascada Región → Departamento (Provincia) → Ciudad.',
      'En la lista: Ver (lectura), Editar o Eliminar.',
      'Dentro del registro puedes ver sus Contactos, Cotizaciones, Oportunidades y Tickets.',
    ],
    especiales: [
      'La Ubicación funciona por CASCADA y por país: Colombia (Región/Departamento/Ciudad), Perú (Departamento/Provincia/Distrito) y Ecuador (Provincia/Cantón/Parroquia), pero los 3 campos siempre se llaman Región, Departamento (Provincia) y Ciudad.',
      'Empresas cargadas antes de la cascada conservan su ciudad; el sistema deduce su región automáticamente.',
      'Bitácora de seguimiento para registrar la gestión con cada empresa.',
    ],
  },
  {
    id: 'contactos', titulo: 'Contactos', icono: '👤', grupo: 'modulo',
    intro: 'Personas de contacto dentro de cada empresa/cliente.',
    campos: [
      { nombre: 'Código', desc: 'Consecutivo automático (CON-XXXXX).' },
      { nombre: 'Nombre / Apellido / Cargo', desc: 'Datos de la persona.' },
      { nombre: 'Empresa', desc: 'Empresa a la que pertenece (desde Clientes).' },
      { nombre: 'Correo / Celular / Teléfono', desc: 'Datos de contacto.' },
      { nombre: 'Nivel de Influencia', desc: 'Decisor, Influenciador, etc. (Referencias).' },
      { nombre: 'Situación', desc: 'Activo / Inactivo.' },
    ],
    comoUsar: ['Crear, Ver, Editar, Eliminar. Bitácora de seguimiento incluida.'],
  },
  {
    id: 'prospectos', titulo: 'Prospectos', icono: '🧲', grupo: 'modulo',
    intro: 'Posibles clientes (leads) que aún no son empresas formales. Se registran a mano dentro del CRM o llegan por el Formulario Público de Prospectos.',
    campos: [
      { nombre: 'Código', desc: 'Consecutivo automático (PRS-XXXXX).' },
      { nombre: 'Fecha Registro', desc: 'Fecha del día (automática).' },
      { nombre: 'Nombre / Apellido', desc: 'Datos de la persona (se guardan en MAYÚSCULAS).' },
      { nombre: 'Empresa', desc: 'Empresa propia del prospecto (en MAYÚSCULAS).' },
      { nombre: 'Correo / Nro Móvil', desc: 'Datos de contacto.' },
      { nombre: 'Origen del Prospecto', desc: 'Web, Referido, Llamada, etc. (desde Referencias).' },
      { nombre: 'Referenciado Por', desc: 'Persona que refirió al prospecto (en MAYÚSCULAS).' },
      { nombre: 'Empresa Referente', desc: 'Empresa que refirió al prospecto (en MAYÚSCULAS).' },
      { nombre: 'Actividad', desc: 'Actividad económica (desde Referencias).' },
      { nombre: 'Ciudad / País', desc: 'Ubicación del prospecto.' },
      { nombre: 'Detalle del Requerimiento', desc: 'Qué necesita o solicita el prospecto.' },
      { nombre: 'Situación', desc: 'Nuevo, Sin Contactar, Contactado, Calificado, Convertido, Descartado, etc. (desde Referencias).' },
    ],
    especiales: [
      '⚠️ IMPORTANTE: los prospectos que llegan por el Formulario Público NO se graban automáticamente en el módulo. Primero caen en una bandeja de entrada y el usuario debe IMPORTARLOS (botón Importar) para que pasen al CRM. La bandeja se revisa sola cada 15 segundos.',
      'Campos que llegan desde el Formulario de Prospectos (público): Nombre, Apellido, Empresa, Correo, Nro Móvil y Descripción del Requerimiento (más la Fecha y Hora de registro, que se ponen automáticas).',
      'Al importar, el prospecto entra con Origen = “Formulario Web”. El resto de campos (Referenciado Por, Empresa Referente, Actividad, Ciudad, País, etc.) los completas tú dentro del CRM.',
      'Cuando alguien envía el formulario, el sistema le manda automáticamente un correo de confirmación al prospecto.',
      'Bitácora de seguimiento incluida.',
    ],
  },
  {
    id: 'oportunidades', titulo: 'Oportunidades', icono: '🎯', grupo: 'modulo',
    intro: 'Negocios en curso (pipeline de ventas).',
    campos: [
      { nombre: 'Código', desc: 'Consecutivo automático (OPP-XXXXX).' },
      { nombre: 'Proyecto / Cliente / Contacto', desc: 'A qué se asocia la oportunidad.' },
      { nombre: 'Estimado COP / Estimado USA', desc: 'Montos (con separadores de miles).' },
      { nombre: 'Etapa', desc: 'Etapa de la oportunidad (desde Referencias).' },
      { nombre: 'Situación', desc: 'Abierta, En Negociación, Ganada, Perdida.' },
      { nombre: 'Probable % / Ejecución año % / MGC', desc: 'Indicadores de avance y margen.' },
      { nombre: 'Responsable', desc: 'Vendedor asignado (desde Referencias → Vendedores).' },
      { nombre: 'Adjudicación / Veredicto / Fechas', desc: 'Seguimiento del cierre.' },
    ],
    especiales: [
      'Visibilidad: solo el usuario “directorlatam” ve TODAS las oportunidades; los demás ven todas menos las creadas por directorlatam.',
      'La lista se ordena por % de Probabilidad de menor a mayor.',
      'La columna “Estimado USA” se muestra en dólares (US$); el “Estimado COP” en pesos (COP).',
      'Documentos exigidos y bitácora de seguimiento dentro del registro.',
    ],
  },
  {
    id: 'proyectos', titulo: 'Proyectos', icono: '🏗️', grupo: 'modulo',
    intro: 'Proyectos asociados a un cliente, con control de montos aprobado y cobrado.',
    campos: [
      { nombre: 'Nro / Código Proyecto', desc: 'Consecutivo (PRY-XXXXX) y código propio.' },
      { nombre: 'Cliente / Responsable', desc: 'A quién pertenece y quién lo lidera.' },
      { nombre: 'Descripción / Fechas', desc: 'Detalle y fechas estimada/real de inicio.' },
      { nombre: 'Consorcio', desc: 'Si aplica, con el nombre del consorcio.' },
      { nombre: 'Monto Aprobado / Cobrado', desc: 'Con separadores de miles.' },
      { nombre: 'Situación', desc: 'En Planeación, En Ejecución, Finalizado, etc.' },
    ],
    especiales: ['Bitácora de seguimiento y panel de documentos.'],
  },
  {
    id: 'proveedores', titulo: 'Proveedores', icono: '🏭', grupo: 'modulo',
    intro: 'Registro de proveedores del negocio.',
    campos: [
      { nombre: 'Nro / Fecha Registro', desc: 'Consecutivo automático (PRV-XXXXX) y fecha del día.' },
      { nombre: 'Nombre / Tipo ID / Nro Documento', desc: 'Identificación del proveedor.' },
      { nombre: 'Correo / Tel Oficina / Celular Oficina', desc: 'Datos de contacto.' },
      { nombre: 'Persona Contacto', desc: 'Persona con quien se trata.' },
      { nombre: 'Calificación', desc: 'Excelente, Bueno, Regular, Malo (desde Referencias).' },
      { nombre: 'Actividad', desc: 'Actividad del proveedor (desde Referencias).' },
      { nombre: 'Proveedor Desde / Representante Legal', desc: 'Antigüedad y representante.' },
      { nombre: 'Ubicación', desc: 'Dirección, Ciudad, País, Código Postal.' },
      { nombre: 'Observaciones / Situación', desc: 'Notas y estado (Activo/Inactivo).' },
    ],
    especiales: ['Bitácora de seguimiento. Calificación, Actividad y Situación se eligen desde Referencias.'],
  },
  {
    id: 'productos', titulo: 'Productos', icono: '📦', grupo: 'modulo',
    intro: 'Catálogo de productos o servicios que se ofrecen.',
    campos: [
      { nombre: 'Categoría', desc: 'OBLIGATORIA. Aparece de primera en el formulario; se elige desde Referencias (Categoría Productos). Sirve para filtrar los productos en las Cotizaciones.' },
      { nombre: 'Código / Descripción', desc: 'Identificación del producto (el código es automático).' },
      { nombre: 'Unidad de Medida', desc: 'Desde Referencias.' },
      { nombre: 'Precio / Moneda / Impuesto', desc: 'Valor, moneda y % de impuesto.' },
      { nombre: 'Situación', desc: 'Activo / Inactivo / Descontinuado.' },
    ],
  },
  {
    id: 'cotizaciones', titulo: 'Cotizaciones', icono: '📋', grupo: 'modulo',
    intro: 'Cotizaciones/proformas para los clientes, con sus ítems y totales.',
    campos: [
      { nombre: 'Código / Fecha / Vencimiento', desc: 'Datos de la cotización.' },
      { nombre: 'Empresa / Contacto', desc: 'A quién se cotiza.' },
      { nombre: 'Tipo de Cotización', desc: 'OBLIGATORIO. Se elige al iniciar (desde Referencias → Categoría Productos). Define qué productos se pueden agregar en los renglones.' },
      { nombre: 'Moneda / % Impuesto / Vendedor', desc: 'Condiciones comerciales.' },
      { nombre: 'Ítems (renglones)', desc: 'Productos, cantidad, precio, descuento y subtotal.' },
      { nombre: 'AIU (solo en Construcción)', desc: 'Administración, Imprevistos y Utilidad: porcentajes que digita el usuario; se aplican sobre el Subtotal.' },
      { nombre: 'Impuesto / Total', desc: 'Cálculo automático. El comportamiento cambia según el Tipo de Cotización (ver abajo).' },
      { nombre: 'Situación', desc: 'Borrador, Enviada, Aprobada, Rechazada, Vencida.' },
    ],
    especiales: [
      'Al agregar renglones, solo aparecen los productos del Tipo de Cotización elegido al inicio.',
      'No se puede repetir el mismo producto en los renglones (los ya agregados salen marcados como “Agregado”).',
      '📐 EL TIPO DE COTIZACIÓN CAMBIA LOS TOTALES Y LOS CÁLCULOS:',
      '• Tipo “Servicios” (o cualquier tipo distinto de Construcción): en Totales se muestra Subtotal → Impuesto (IVA) → Total. Cálculo: Impuesto = Subtotal × % Impuesto; y Total = Subtotal + Impuesto.',
      '• Tipo “Construcción”: se activa el AIU. En Totales aparecen líneas adicionales, cada una con su campo de %: Administración, Imprevistos y Utilidad, más el Impuesto IVA. Cada componente se calcula sobre el Subtotal: Administración = Subtotal × %, Imprevistos = Subtotal × %, Utilidad = Subtotal × %.',
      '• En Construcción el Impuesto IVA se calcula SOLO sobre la Utilidad (Impuesto = Utilidad × % Impuesto), que es el estándar legal de obra en Colombia.',
      '• En Construcción el Total General = Subtotal + Administración + Imprevistos + Utilidad + Impuesto IVA.',
      'El Subtotal y el Total se muestran resaltados (más grandes y en negro) en los dos tipos.',
      'Se puede enviar por correo al cliente; el PDF y el correo reflejan el mismo desglose (con AIU cuando es Construcción).',
    ],
  },
  {
    id: 'pqrs', titulo: 'PQRS', icono: '📩', grupo: 'modulo',
    intro: 'Peticiones, Quejas, Reclamos y Sugerencias de los clientes. Se registran dentro del CRM o llegan por el Formulario Público de PQRS.',
    campos: [
      { nombre: 'Código / Fecha', desc: 'Identificación del caso y fecha de registro.' },
      { nombre: 'Tipo de Incidencia', desc: 'Petición, Queja, Reclamo, Sugerencia (desde Referencias).' },
      { nombre: 'Prioridad', desc: 'Urgencia del caso (desde Referencias).' },
      { nombre: 'Empresa / Cliente', desc: 'Empresa que reporta (se identifica por su Código de Acceso).' },
      { nombre: 'Fecha Aviso / Hora Aviso', desc: 'Cuándo avisó la empresa.' },
      { nombre: 'Persona que Avisa / Móvil', desc: 'Quién reporta y su número de contacto.' },
      { nombre: 'Detalle de la Incidencia', desc: 'Descripción de lo sucedido.' },
      { nombre: 'Situación', desc: 'Abierta, En Proceso, Cerrada, etc. (desde Referencias).' },
    ],
    especiales: [
      '⚠️ IMPORTANTE: las PQRS que llegan por el Formulario Público NO se graban automáticamente en el módulo. Primero caen en una bandeja de entrada y el usuario debe IMPORTARLAS para que pasen al CRM.',
      'Solo clientes reales pueden radicar: el cliente debe usar su Código de Acceso PQRS (que se le asigna en el módulo de Empresas).',
      'Campos que llegan desde el Formulario de PQRS (público): Tipo de Incidencia, Prioridad, Empresa (por su Código de Acceso), Fecha y Hora de Aviso, Persona que Avisa, Móvil y Detalle de la Incidencia.',
      'Bitácora de seguimiento incluida.',
    ],
  },
  {
    id: 'tareas', titulo: 'Tareas', icono: '✅', grupo: 'modulo',
    intro: 'Tareas y asignaciones del equipo.',
    campos: [
      { nombre: 'Código / Fecha', desc: 'Identificación y fecha de asignación.' },
      { nombre: 'Descripción', desc: 'Qué se debe hacer.' },
      { nombre: 'Persona que Asigna / Ejecuta', desc: 'Responsables.' },
      { nombre: 'Fechas', desc: 'Requerida y real de finalización.' },
      { nombre: 'Situación', desc: 'Pendiente / En Proceso / Finalizada.' },
    ],
    especiales: ['Puede notificar por correo al responsable.'],
  },

  // ─────────── CONFIG / TRANSVERSAL ───────────
  {
    id: 'referencias', titulo: 'Referencias (Tablas)', icono: '⚙️', grupo: 'config',
    intro: 'Catálogos que alimentan los desplegables de todo el sistema (países, ciudades, situaciones, tipos, actividades, vendedores, etc.). Solo Admin.',
    comoUsar: [
      'Entra a Referencias y elige una tabla (salen en orden alfabético).',
      'Agrega, edita o activa/desactiva cada valor.',
      'Lo que cambies aquí aparece automáticamente en los desplegables de los módulos.',
    ],
    especiales: ['Ejemplos: Actividad Proveedor, Calificación Proveedor, Situación Proveedor, Etapa Oportunidad, Vendedores.'],
  },
  {
    id: 'seguimientos', titulo: 'Bitácora de Seguimiento', icono: '🗒️', grupo: 'config',
    intro: 'Casi todos los módulos tienen una bitácora para registrar la gestión.',
    campos: [
      { nombre: 'Fecha', desc: 'Cuándo se hizo la gestión.' },
      { nombre: 'Descripción', desc: 'Qué se hizo o conversó.' },
      { nombre: 'Persona que Atendió', desc: 'Quién gestionó.' },
      { nombre: 'Situación', desc: 'Estado al que pasa el registro.' },
    ],
  },
  {
    id: 'factores-monedas', titulo: 'Factores Conversión Monedas', icono: '💱', grupo: 'config',
    intro: 'Registra los factores para convertir entre monedas, usados en los cálculos del sistema.',
    campos: [
      { nombre: 'Nro / Fecha Registro', desc: 'Consecutivo automático (FCM-XXXXX) y fecha del día.' },
      { nombre: 'Factor Pesos a US$', desc: 'Cuántos pesos equivalen a un dólar (ej. 4000).' },
      { nombre: 'Factor US$ a Euro', desc: 'Cuántos euros equivale un dólar (ej. 0.92).' },
      { nombre: 'Situación', desc: 'Activo / Inactivo.' },
    ],
    comoUsar: ['Crear, Ver, Editar o Eliminar. Cada registro guarda quién lo creó.'],
  },
  {
    id: 'seguridad', titulo: 'Seguridad y Respaldos', icono: '🛡️', grupo: 'config',
    intro: 'Cómo se protegen los datos.',
    especiales: [
      'Los datos viven en el servidor (la nube), no en el navegador: compartidos y permanentes.',
      'Respaldo automático cada 3 días (8:00 p.m.): copia de TODO el sistema enviada por correo, y se guardan los últimos 5.',
      'Auditoría: registra quién creó, modificó o eliminó cada registro, con fecha y hora.',
    ],
  },
]
