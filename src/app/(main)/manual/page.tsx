'use client'
import { useState } from 'react'
import { useCurrentUserStore } from '@/features/usuarios-gestion/store/current-user-store'

// ── Tarjeta del manual: frente de color intenso; al pulsar se abre en página completa ──
type CampoManual = { n: string; d: string }
type Tarjeta = {
  id: string
  titulo: string
  icono: string
  color: string
  // Contenido (se va llenando con lo que dicta el usuario)
  intro?: string
  puntos?: string[]
  pasos?: string[]   // Paso a paso (secuencia numerada)
  campos?: CampoManual[]
  notas?: string[]
}

// Grupo 1 — Módulos operativos (visibles para todos)
const TARJETAS_OPERATIVAS: Tarjeta[] = [
  {
    id: 'introduccion', titulo: 'Introducción', icono: '📘', color: '#4338ca',
    intro: 'En toda empresa, una de las áreas con mayor responsabilidad para hacer sostenible el negocio en el tiempo es el Área Comercial. Casi el 100% de sus acciones apuntan a tres momentos clave del proceso, y un CRM le da la visión completa y controlada del seguimiento y el manejo de las relaciones con los clientes.',
    puntos: [
      '1) ATRAER — Mercadeo: captar nuevos clientes con estrategias que unen lo digital con lo tradicional.',
      '2) VENDER — Ventas: mostrar lo que se ofrece y la experiencia de la empresa, cotizar trabajos o emitir ofertas definidas por el cliente, y así cerrar los negocios. Esas ventas cerradas son los ingresos que le permiten a la empresa continuar su vida en el mundo de los negocios.',
      '3) SERVIR — Servicio al Cliente: lo más difícil no es vender y cumplir un cupo, sino mantener muy bien atendido al cliente, atendiendo cada requerimiento o incidencia de forma profesional y lo más rápido posible.',
    ],
    notas: [
      'El resultado de atender bien: comentarios y recomendaciones favorables que posicionan a la empresa como un referente en el mundo empresarial.',
      'Por eso el CRM: reúne Mercadeo + Ventas + Servicio al Cliente en un solo lugar, con la visión completa y controlada de la relación con cada cliente.',
      'Tip MULTIPAÍS — Este CRM (GESTIÓN COMERCIAL NORTON) maneja varios países. Cada usuario tiene asignado su País y ve SOLO la información de su país; los usuarios GLOBAL (Admin / HQ) ven todos los países. Monedas por país: Colombia → Pesos (COP $) · Perú → Soles (S/) · Ecuador → Dólar (US$). La ubicación se adapta a la estructura de cada país (Colombia: Región → Departamento → Ciudad · Perú: Departamento → Provincia → Distrito). El módulo de Productos también filtra por país: cada producto pertenece a un país y el usuario ve solo los de su país (GLOBAL ve todos, con filtro 🌎).',
      'Tip BILINGÜE — El sistema es bilingüe Español / Inglés. Con la banderita del encabezado (🇪🇸 / 🇺🇸) se cambia el idioma y se traducen los títulos de módulos y los nombres de campos al instante.',
    ],
  },
  {
    id: 'clientes', titulo: 'Clientes', icono: '🏢', color: '#1d4ed8',
    intro: 'Aquí se registran las empresas que son Clientes de la Empresa. El campo clave es el Tipo de Cliente.',
    puntos: [
      'Tipo de Cliente: las empresas que YA son clientes se identifican como “Cliente”.',
      'Cuando una empresa todavía es solo un prospecto (aún no se crea la Oportunidad) y su situación indica que “Requiere una Oferta o Cotización”, desde el módulo Prospectos se pulsa el botón “Convertir a Cliente”.',
      'Al convertir, el sistema le asigna automáticamente el Tipo “Prospecto”.',
      'Así, al crear la Oportunidad, cuando se solicita el Cliente, el informe muestra el Nombre y el Tipo que tiene en ese momento (Cliente o Prospecto), y desde ahí se continúa con los datos de la Oportunidad.',
    ],
    campos: [
      { n: 'Código', d: 'Consecutivo automático (CLI-XXXXX).' },
      { n: 'Tipo Identificación / Nro Documento', d: 'RUC, DNI, etc. y su número.' },
      { n: 'Tipo Cliente', d: 'Cliente o Prospecto.' },
      { n: 'Razón Social / Nombre Comercial', d: 'Nombre legal y comercial.' },
      { n: 'Actividad', d: 'Actividad económica (desde Referencias).' },
      { n: 'Teléfono / Correo / Sitio Web', d: 'Datos de contacto.' },
      { n: 'Ubicación', d: 'Dirección, País, Región, Departamento, Ciudad y Código Postal.' },
      { n: 'Condición de Pago / Moneda', d: 'Términos comerciales (Pesos por defecto).' },
      { n: 'Situación', d: 'Activo, Inactivo, Prospecto.' },
      { n: 'Código de Acceso PQR', d: 'Se genera automáticamente (ver nota).' },
    ],
    notas: [
      'Ubicación — metodología Colombia: la ubicación funciona por CASCADA con la estructura del país: Región → Departamento → Ciudad. Cada nivel filtra al siguiente.',
      'Código PQR automático: al crear una Empresa tipo Cliente, el sistema le genera un Código de Acceso PQR para que en el futuro pueda registrar Incidencias, Reclamos, Sugerencias, etc. por el formulario público de PQRS.',
      'Bitácora de Seguimiento: al entrar a Ver una empresa se registra toda la gestión (Fecha, Hora, Detalle, Persona y Situación). IMPORTANTE: la Situación que se coloca al final del renglón del seguimiento actualiza automáticamente la Situación del registro principal del módulo.',
      'Adjuntar archivos: en cada registro se pueden subir fotos, imágenes y documentos (PDF, Word, Excel), hasta 50 MB por archivo, para guardar los soportes y la evidencia en un solo lugar.',
    ],
  },
  {
    id: 'contactos', titulo: 'Contactos', icono: '👤', color: '#0e7490',
    intro: 'En este módulo se almacenan los datos de las personas que trabajan en las empresas clientes, con el fin de tener a la mano la información de contacto necesaria.',
    puntos: [
      'Es MUY importante mantenerlos actualizados: las personas cambian de puesto o salen de la empresa, y un dato desactualizado hace perder tiempo y oportunidades.',
      'Cada contacto se asocia a una Empresa (cliente) registrada en el módulo Clientes.',
      'Se puede marcar un contacto como Principal para identificar rápidamente al interlocutor clave de esa empresa.',
    ],
    campos: [
      { n: 'Código', d: 'Consecutivo automático (CON-XXXXX).' },
      { n: 'Empresa', d: 'Empresa/cliente a la que pertenece la persona (desde Clientes).' },
      { n: 'Nombre / Apellido', d: 'Datos de la persona.' },
      { n: 'Cargo', d: 'Puesto que ocupa en la empresa.' },
      { n: 'Departamento / Área', d: 'Área a la que pertenece dentro de la empresa.' },
      { n: 'Teléfono / Celular', d: 'Números de contacto.' },
      { n: 'Correo', d: 'Email de contacto.' },
      { n: 'Fecha de Nacimiento', d: 'Útil para saludos y fidelización.' },
      { n: 'Nivel de Influencia', d: 'Decisor, Influenciador, etc. (desde Referencias).' },
      { n: 'Contacto Principal', d: 'Marca si es el interlocutor principal de la empresa.' },
      { n: 'Observaciones', d: 'Notas adicionales.' },
      { n: 'Situación', d: 'Activo / Inactivo.' },
    ],
    notas: [
      'Manténlos al día: cuando un contacto cambie de cargo o salga de la empresa, actualiza su registro o cámbialo a Situación “Inactivo” para conservar el histórico sin perder información.',
      'Cada contacto tiene su propia Bitácora de Seguimiento para registrar las gestiones hechas con esa persona. La Situación que se coloca en el renglón del seguimiento actualiza automáticamente la Situación del contacto.',
      'Adjuntar archivos: en cada registro se pueden subir fotos, imágenes y documentos (PDF, Word, Excel), hasta 50 MB por archivo.',
    ],
  },
  {
    id: 'prospectos', titulo: 'Prospectos', icono: '🧲', color: '#db2777',
    intro: 'El objetivo del módulo Prospectos es gestionar los posibles clientes (leads): personas o empresas interesadas que todavía NO son clientes formales. Aquí se captan, se califican y se les hace seguimiento antes de convertirlos en Cliente y crear una Oportunidad, para que ningún interesado se pierda por falta de gestión.',
    puntos: [
      '¿Por qué un módulo de Prospectos? Para separar a los interesados (leads) de los clientes reales: primero se captan y califican aquí, sin ensuciar la base de Clientes.',
      'Un prospecto puede registrarse a mano dentro del CRM o llegar por el Formulario Público / Landing de Norton.',
      'Se le hace seguimiento comercial (llamadas, correos) hasta calificarlo o descartarlo.',
      'Cuando su situación indica que “Requiere una Oferta/Cotización”, se pulsa “Convertir a Cliente” (queda con Tipo Prospecto) y desde ahí se crea la Oportunidad.',
    ],
    pasos: [
      '1) El interesado llena el Formulario Público / Landing de Norton (nombre, empresa, correo, requerimiento).',
      '2) Ese lead NO entra directo al CRM: primero cae en una BANDEJA DE ENTRADA (pendientes por importar).',
      '3) La pantalla de Prospectos se revisa sola cada ~15 segundos y AVISA con un globo rojo mostrando cuántos prospectos hay pendientes por incorporar.',
      '4) El usuario abre la bandeja y revisa cada lead (así filtra spam o datos incompletos antes de que entren a la base).',
      '5) Pulsa “Importar al CRM” (o “Importar Todas”) para pasarlos a la lista de Prospectos. Entran con Origen = “Formulario Web”.',
      '6) El sistema le envía al prospecto un correo de confirmación automático.',
      '7) Se le hace seguimiento en la bitácora hasta calificarlo; cuando “Requiere Oferta/Cotización”, se pulsa “Convertir a Cliente” y se crea la Oportunidad.',
    ],
    campos: [
      { n: 'Código', d: 'Consecutivo automático (PRS-XXXXX).' },
      { n: 'Fecha Registro', d: 'Fecha del día (automática).' },
      { n: 'Nombre / Apellido', d: 'Datos de la persona (se guardan en MAYÚSCULAS).' },
      { n: 'Empresa', d: 'Empresa a la que pertenece el prospecto.' },
      { n: 'Correo / Nro Móvil', d: 'Datos de contacto.' },
      { n: 'Origen del Prospecto', d: 'Cómo llegó: Web, Referido, Llamada, etc. (desde Referencias).' },
      { n: 'Referenciado Por / Empresa Referente', d: 'Quién y qué empresa lo refirió.' },
      { n: 'Actividad', d: 'Actividad económica (desde Referencias).' },
      { n: 'Ubicación', d: 'Cascada País → Región → Departamento → Ciudad, igual que en Clientes.' },
      { n: 'Detalle del Requerimiento', d: 'Qué necesita o solicita el prospecto.' },
      { n: 'Situación', d: 'Nuevo, Sin Contactar, Contactado, Calificado, Requiere Oferta/Cotización, Convertido, Descartado, etc. (desde Referencias).' },
    ],
    notas: [
      'Bitácora de Seguimiento: cada prospecto tiene su bitácora (Fecha, Hora, Detalle, Persona y Situación). La Situación que se coloca en el renglón del seguimiento actualiza automáticamente la Situación del prospecto.',
      'Captación desde la Landing de Norton: los prospectos que llegan por el formulario público NO se graban directamente. Primero caen en una BANDEJA DE ENTRADA; la pantalla la revisa sola cada 15 segundos y AVISA con un globo rojo con el número de pendientes. El usuario debe pulsar “Importar al CRM” (o “Importar Todas”) para pasarlos al registro.',
      '¿Por qué NO se incorpora automáticamente? Para que una persona revise y valide cada lead antes de que entre a la base: así se filtra spam/basura y no se contamina el CRM con registros automáticos no deseados. Al importar entran con Origen = “Formulario Web”, y el sistema le envía al prospecto un correo de confirmación automático.',
      'Adjuntar archivos: en cada registro se pueden subir fotos, imágenes y documentos (PDF, Word, Excel), hasta 50 MB por archivo.',
    ],
  },
  {
    id: 'oportunidades', titulo: 'Oportunidades', icono: '🎯', color: '#15803d',
    intro: 'Una Oportunidad es un negocio concreto en curso: una posibilidad real de venta con un cliente identificado que ya pasó del simple interés a una intención de compra. Este módulo es el PIPELINE DE VENTAS: permite proyectar, dar seguimiento y cerrar cada negocio sabiendo cuánto vale, en qué etapa está y qué probabilidad tiene de ganarse.',
    puntos: [
      'De dónde nace: normalmente desde un Prospecto convertido a Cliente. Al crear la Oportunidad se solicita el Cliente y el sistema trae su Nombre y Tipo (Cliente o Prospecto) del momento; de ahí se continúa con los datos del negocio.',
      'Cada Oportunidad se asocia a un Cliente y un Contacto, y opcionalmente a un Proyecto.',
      'Maneja dos montos en paralelo: Estimado COP (pesos $) y Estimado USA (dólares US$).',
      'La Probabilidad (%) y la Etapa permiten ver el embudo y priorizar los negocios más cerca de cerrarse.',
      'Se acompaña todo el ciclo: fechas de consultas, presentación de la oferta, veredicto esperado y cierre (Ganada / Perdida).',
    ],
    campos: [
      { n: 'Código', d: 'Consecutivo automático (OPP-XXXXX).' },
      { n: 'Proyecto / Cliente / Contacto', d: 'A qué proyecto y con quién se asocia la oportunidad.' },
      { n: 'Estimado COP / Estimado USA', d: 'Monto estimado del negocio en pesos ($) y en dólares (US$).' },
      { n: 'Etapa', d: 'Etapa del pipeline (Prospección, Calificación, Propuesta, Negociación, Cierre… desde Referencias). Alimenta el gráfico Pipeline del Dashboard.' },
      { n: 'Situación', d: 'Abierta, En Negociación, Ganada, Perdida.' },
      { n: 'Probable % / Ejecución año % / MGC', d: 'Indicadores de probabilidad de cierre, avance del año y margen (MGC).' },
      { n: 'Responsable', d: 'Vendedor asignado (desde Referencias → Vendedores).' },
      { n: 'Fechas del proceso', d: 'Inicio/fin de consultas, presentación de la oferta y veredicto esperado.' },
      { n: 'Adjudicación / Veredicto / Empresa Ganadora', d: 'Seguimiento del resultado del cierre.' },
      { n: 'Monto Real de la Oferta', d: 'Valor con el que finalmente se presentó la oferta.' },
      { n: 'Observaciones', d: 'Notas y detalles adicionales del negocio.' },
    ],
    notas: [
      'Documentos Exigidos: dentro de la oportunidad se listan los documentos que pide la licitación/oferta, para no dejar ninguno pendiente.',
      'Pipeline en el Dashboard: los montos por Etapa alimentan el gráfico “Pipeline de Ventas” del tablero, para ver el embudo completo de un vistazo.',
      'Bitácora de Seguimiento: registra toda la gestión (Fecha, Hora, Detalle, Persona y Situación). La Situación del seguimiento actualiza automáticamente la Situación de la oportunidad.',
      'Adjuntar archivos: en cada registro se pueden subir fotos, imágenes y documentos (PDF, Word, Excel), hasta 50 MB por archivo.',
    ],
  },
  {
    id: 'cotizaciones', titulo: 'Cotizaciones', icono: '📋', color: '#6d28d9',
    intro: 'Las Cotizaciones son el corazón comercial del CRM: es donde toda la información dispersa se junta para producir una propuesta formal en minutos. Optimiza y agiliza el trabajo porque REUTILIZA los datos que ya viven en el sistema —el cliente, sus contactos, los productos y sus precios— evitando volver a digitar y reduciendo errores. En lugar de armar cada oferta a mano, se genera de forma consistente, con sus cálculos e impuestos automáticos.',
    puntos: [
      'Se conecta con el maestro de Clientes: eliges la Empresa y trae su nombre y su contacto; además puede enlazarse a una Oportunidad para dar trazabilidad al negocio.',
      'Se conecta con el maestro de Productos: el Tipo de Cotización (Categoría) filtra qué productos se pueden agregar como renglones, con su precio ya cargado.',
      'Agiliza todo: los totales, impuestos y (en obra) el AIU se calculan automáticamente — cero cuentas a mano.',
      'Cada propuesta lleva su Situación (Borrador, Enviada, Aprobada, Rechazada, Vencida) para seguir el estado del negocio.',
    ],
    campos: [
      { n: 'Código / Nro', d: 'Identificación de la cotización (automática).' },
      { n: 'Fecha Emisión / Vencimiento', d: 'Fecha de la propuesta y hasta cuándo es válida.' },
      { n: 'Empresa / Contacto', d: 'A quién se cotiza (desde el maestro de Clientes).' },
      { n: 'Oportunidad', d: 'Negocio al que se asocia la cotización (opcional, para trazabilidad).' },
      { n: 'Tipo de Cotización', d: 'OBLIGATORIO. Se elige al inicio (Categoría Productos) y define qué productos se pueden agregar en los renglones.' },
      { n: 'Moneda / Condición de Pago / % Impuesto / Vendedor', d: 'Condiciones comerciales de la oferta.' },
      { n: 'Ítems (renglones)', d: 'Productos, cantidad, precio, descuento y subtotal.' },
      { n: 'AIU (solo Construcción)', d: 'Administración, Imprevistos y Utilidad; se activan cuando el tipo es Construcción.' },
      { n: 'Situación', d: 'Borrador, Enviada, Aprobada, Rechazada, Vencida.' },
    ],
    notas: [
      'Generar PDF y enviar por correo: con un clic se genera el PDF de la cotización y se puede enviar directamente al Cliente y/o Prospecto por correo. El PDF y el correo reflejan el mismo desglose (incluyendo AIU si es Construcción).',
      'Cálculo según el Tipo: en Servicios el Impuesto va sobre el Subtotal; en Construcción se activa el AIU (Administración, Imprevistos, Utilidad) y el impuesto se liquida sobre la Utilidad.',
      'Bitácora de Seguimiento: registra la gestión de cada cotización; la Situación del seguimiento actualiza la Situación de la cotización.',
      'Adjuntar archivos: en cada registro se pueden subir fotos, imágenes y documentos (PDF, Word, Excel), hasta 50 MB por archivo.',
    ],
  },
  {
    id: 'ofertas', titulo: 'Ofertas', icono: '🏗️', color: '#0369a1',
    intro: 'El subsistema de Ofertas es el motor para elaborar PRESUPUESTOS DE OBRA / LICITACIÓN con nivel de APU (Análisis de Precios Unitarios). A diferencia de una cotización simple, aquí se arma una oferta detallada por CAPÍTULOS y RENGLONES, jalando los costos reales de los maestros (Personal, Productos Varios, Maquinaria y Contratistas), y calculando margen de utilidad, impuestos y el monto total — todo listo para presentar reportes profesionales al cliente.',
    puntos: [
      '📋 PRESUPUESTO OFERTAS — Qué hace: es la oferta/licitación en sí (código PR-XXXXX), el documento central del subsistema. Cómo funciona: se llena una cabecera (Cliente, Proyecto, País, Moneda, % Utilidad y % Impuesto) y se arma el presupuesto con renglones organizados por Capítulos (Títulos) y Detalles (D1=MOD, D2=MOI, D3=Materiales, D4=Maquinaria, D5=Subcontrato, D6=Otro). Cada Detalle jala su costo del maestro correspondiente y el sistema calcula precio unitario, venta, utilidad e impuesto en automático. Desde aquí se generan los reportes Oficial, APU y Gráfico.',
      '🗂️ CAPÍTULOS DE OFERTA — Qué hace: define la estructura estándar del presupuesto (ej. E-01 Estudios, E-02 Preliminares, E-03 Movimiento de Tierras…). Cómo funciona: se crean una sola vez como maestro de títulos/subcapítulos y se reutilizan en cada oferta; agrupan los renglones y permiten ver subtotales por capítulo, dando orden y lectura rápida al presupuesto.',
      '👷 CONTRATISTAS — Qué hace: es el maestro de empresas/personas subcontratistas (datos, especialidad, contacto). Cómo funciona: registra a cada contratista una vez; sirve de base para los renglones tipo Subcontrato y para asociarle presupuestos.',
      '📑 PRESUPUESTO CONTRATISTAS — Qué hace: guarda los presupuestos que cada contratista entrega para una obra u oferta. Cómo funciona: se registran los ítems y costos del subcontrato; esos valores alimentan los renglones de tipo Subcontrato (D5) de la oferta con costos reales, no estimados.',
      '🧱 PRODUCTOS VARIOS — Qué hace: maestro de materiales e insumos con su unidad y costo. Cómo funciona: cada material queda con su precio; al agregar un renglón de tipo Materiales (D3) en la oferta, este jala el costo desde aquí. Mantenerlo al día asegura precios reales.',
      '🚜 MAQUINARIA Y EQUIPOS — Qué hace: maestro de maquinaria y equipos con su costo (por hora/día). Cómo funciona: alimenta los renglones de tipo Maquinaria y Vehículos (D4); al elegir el equipo en la oferta, trae su costo automáticamente.',
      '💼 CARGOS Y SALARIOS — Qué hace: maestro del personal con cargo, salario y costo-día cargado (incluye prestaciones). Cómo funciona: alimenta los renglones de MOD (mano de obra directa, D1) y MOI (indirecta, D2); el costo del personal en la oferta sale de aquí.',
      '🏗️ SEGUIMIENTO DE OBRAS — Qué hace: controla la ejecución de la obra una vez adjudicada la oferta. Cómo funciona: registra avances, fechas y estados de cada obra/proyecto, para monitorear cómo va la ejecución frente a lo presupuestado.',
    ],
    pasos: [
      '1) Prepara los maestros: registra tus Cargos y Salarios, Productos Varios, Maquinaria y Equipos y Contratistas — de ahí saldrán los costos de cada renglón.',
      '2) Crea los Capítulos de Oferta (Títulos y subcapítulos) que estructurarán el presupuesto.',
      '3) En Presupuesto Ofertas pulsa “+ Nueva Oferta” y llena la cabecera: Cliente, Proyecto, País, Moneda, % Utilidad general, % Impuesto y Alcance.',
      '4) Agrega los renglones: cada uno es un Título (capítulo) o un Detalle (D1=MOD, D2=MOI, D3=Materiales, D4=Maquinaria, D5=Subcontrato, D6=Otro). Al elegir el concepto, el renglón jala el recurso de su maestro con su costo.',
      '5) Ajusta las cantidades y el % de margen (general o por capítulo). El sistema calcula precio unitario, venta e impuesto automáticamente.',
      '6) Guarda. En la lista, con el botón “Ver” abres el presupuesto completo con sus subtotales por capítulo y el total general.',
      '7) Genera los reportes: 📄 Oficial (oferta formal para el cliente), 🖨 APU (análisis de precios unitarios detallado) y 📊 Gráfico (resumen visual por concepto). Se guardan en PDF o se imprimen.',
    ],
    notas: [
      'Motor APU: cada renglón de Detalle jala su costo del maestro correspondiente (Cargos / Productos Varios / Maquinaria / Contratistas). Por eso es CLAVE tener los maestros al día.',
      'Multipaís: cada oferta lleva su País. Los usuarios GLOBAL ven todas las ofertas; un usuario de un país ve solo las de su país. El filtro 🌎 permite ver por país (Colombia, Perú, Ecuador).',
      'Conceptos con color: MOD, MOI, Materiales, Maquinaria y Vehículos, Subcontrato y Otro se distinguen por color para leer rápido el presupuesto.',
      'Transparencia: los reportes muestran el desglose completo (Costos, Ventas y Utilidad), para presentar la oferta con total claridad al cliente.',
    ],
  },
  {
    id: 'pqrs', titulo: 'PQRS', icono: '📩', color: '#be123c',
    intro: 'La atención al cliente es lo que fideliza —o pierde— a una empresa. Este módulo centraliza las PQRS (Peticiones, Quejas, Reclamos y Sugerencias) para dar un servicio al cliente optimizado, rápido y eficiente: cada caso queda registrado, priorizado y con seguimiento hasta su cierre, de modo que nada se pierde ni se olvida y el cliente siente respaldo.',
    puntos: [
      'Recepción desde la WEB: si se usa el sistema de Reclamos Web, el cliente radica su PQRS desde el formulario público, sin llamar ni escribir correos.',
      'IMPORTANTE: solo puede radicar por la web un cliente YA VALIDADO por la Empresa. Debe usar el Código de Acceso PQR que el sistema le asigna automáticamente al registrarlo como Cliente (módulo Clientes).',
      'Al igual que en Prospectos, las PQRS web NO entran directo: caen en una bandeja de entrada, el sistema avisa y el usuario las Importa al CRM. Así se evita spam y radicaciones de terceros no autorizados.',
    ],
    campos: [
      { n: 'Código / Fecha', d: 'Identificación del caso y fecha de registro.' },
      { n: 'Tipo de Incidencia', d: 'Petición, Queja, Reclamo o Sugerencia (desde Referencias).' },
      { n: 'Prioridad', d: 'Urgencia del caso (desde Referencias).' },
      { n: 'Empresa / Cliente', d: 'Quién reporta; se identifica por su Código de Acceso PQR.' },
      { n: 'Asunto', d: 'Resumen del caso.' },
      { n: 'Fecha Aviso / Hora Aviso', d: 'Cuándo avisó el cliente.' },
      { n: 'Persona que Avisa / Móvil', d: 'Quién reporta y su número de contacto.' },
      { n: 'Persona del Caso / Móvil', d: 'Responsable de atender el caso y su contacto.' },
      { n: 'Detalle de la Incidencia', d: 'Descripción de lo sucedido.' },
      { n: 'Situación / Fecha de Cierre', d: 'Abierta, En Proceso, Cerrada; y cuándo se resolvió.' },
    ],
    notas: [
      'Código de Acceso PQR: se genera solo al crear una Empresa tipo Cliente. Es la llave que garantiza que únicamente clientes reales y validados puedan radicar por la web; sin ese código, un tercero no puede reportar.',
      'TIP — Sintonía con CRM Comercial: el sistema de Reclamos Web debe trabajar conectado a CRM Comercial. El formulario público valida el Código de Acceso contra los Clientes de CRM Comercial, muestra los datos de la Empresa (Norton Colombia) y entrega las PQRS a la bandeja del CRM para importarlas. Así el canal web y el CRM funcionan como un solo sistema.',
      'Bitácora de Seguimiento: registra toda la gestión del caso (Fecha, Hora, Detalle, Persona y Situación). La Situación del seguimiento actualiza la del caso, hasta llegar a Cerrada.',
      'Adjuntar archivos: en cada caso se pueden subir fotos, imágenes y documentos (PDF, Word, Excel), hasta 50 MB por archivo — ideal para las evidencias del reclamo.',
    ],
  },
  {
    id: 'tareas', titulo: 'Tareas', icono: '✅', color: '#ca8a04',
    intro: 'El objetivo principal del módulo de Tareas es que las personas del núcleo de Ventas, Mercadeo y Servicio al Cliente puedan asignar y recibir asignaciones de tareas, para ejecutarlas y cumplirlas en una fecha específica. Así el trabajo del equipo se distribuye, se sigue y nada queda sin hacer.',
    puntos: [
      'Se asigna una tarea a una persona (quién la ejecuta), definida por quien la asigna.',
      'Maneja la fecha requerida de finalización frente a la fecha real, para medir el cumplimiento.',
      'Puede notificar por correo al responsable cuando se le asigna una tarea.',
    ],
    campos: [
      { n: 'Código', d: 'Consecutivo automático de la tarea.' },
      { n: 'Fecha / Hora de Asignación', d: 'Cuándo se creó/asignó la tarea.' },
      { n: 'Persona que Asigna / Persona que Ejecuta', d: 'Quién delega y quién realiza el trabajo.' },
      { n: 'Descripción', d: 'Qué se debe hacer.' },
      { n: 'Fecha Requerida de Fin / Fecha Real de Fin', d: 'Plazo comprometido y cumplimiento real.' },
      { n: 'Situación', d: 'Pendiente, En Proceso, Finalizada.' },
    ],
    notas: [
      'Notificación por correo: al asignar una tarea, se puede avisar al responsable por correo.',
      'Bitácora de Seguimiento: registra los avances (Fecha, Hora, Detalle, Persona y Situación); la Situación del seguimiento actualiza la de la tarea.',
      'Adjuntar archivos: en cada tarea se pueden subir fotos, imágenes y documentos (PDF, Word, Excel), hasta 50 MB por archivo.',
    ],
  },
  {
    id: 'dashboard', titulo: 'Dashboard de Indicadores', icono: '📊', color: '#0f766e',
    intro: 'El Dashboard es el tablero de control del negocio: reúne en una sola pantalla los indicadores clave (KPIs) y los gráficos del CRM. IMPORTANTE: los indicadores comienzan a visualizarse en la medida en que las áreas van suministrando datos. Sin información cargada las tarjetas aparecen vacías o en cero; a medida que se registran clientes, oportunidades, cotizaciones, PQRS, etc., los gráficos cobran vida con datos reales del momento.',
    puntos: [
      'Tarjetas KPI: totales de Empresas, Contactos, Oportunidades, Proyectos, Cotizaciones, PQRS abiertas y Productos. Cada una es clickeable y lleva directo a su módulo.',
      'Pipeline de Ventas: barras por Etapa con el monto de cada una — muestra el embudo comercial y dónde está represado el negocio.',
      'Proyectos por Situación: compara Monto Aprobado vs Monto Cobrado — controla la ejecución financiera.',
      'Cotizaciones por Situación: valor por estado (Borrador, Enviada, Aprobada, Rechazada, Vencida), en Pesos (COP).',
      'PQRS por Tipo: Peticiones, Quejas, Reclamos y Sugerencias — mide la carga de servicio al cliente.',
      'Clientes por Ciudad / por Región y Mapa de Colombia: distribución geográfica del negocio en el país.',
    ],
    notas: [
      'Se dibujan con datos reales: cada gráfico se arma con la información del momento. Si un área todavía no ha cargado sus datos, su tarjeta lo indicará (vacía o en cero).',
      'Ajustables a la medida: los indicadores pueden adaptarse a necesidades específicas, previa reunión donde se definan objetivos, mediciones y metas para el control y la optimización de una gestión. Se pueden crear, quitar o cambiar los gráficos y lo que miden.',
    ],
  },
]

// Grupo 2 — Administración (SOLO visibles para usuarios con Rol Admin)
const TARJETAS_ADMIN: Tarjeta[] = [
  {
    id: 'datos-empresa', titulo: 'Datos Empresa', icono: '🏛️', color: '#334155',
    intro: 'Aquí se registran y actualizan los datos de la propia Empresa: identificación, contacto, representante legal y el LOGO que aparece en el inicio de sesión y en los documentos. Es una configuración que SOLO maneja un usuario con Rol Admin.',
    campos: [
      { n: 'Nombre', d: 'Razón social de la empresa.' },
      { n: 'Tipo Identificación / Nro Documento', d: 'Documento tributario (RUC/NIT) y su número.' },
      { n: 'Representante Legal', d: 'Nombre del representante de la empresa.' },
      { n: 'Correo / Teléfono / Móvil / Página Web', d: 'Datos de contacto de la empresa.' },
      { n: 'Logo', d: 'Imagen que se muestra en el login y en los documentos (se sube y se redimensiona automáticamente).' },
      { n: 'Dirección / Ciudad / País / Código Postal', d: 'Ubicación de la empresa.' },
      { n: 'Situación', d: 'Activo / Inactivo.' },
    ],
    notas: [
      'SOLO ROL ADMIN: esta configuración la gestiona únicamente un usuario con Rol Admin.',
      'El logo que se carga aquí es el que ven todos en la pantalla de inicio de sesión.',
    ],
  },
  {
    id: 'usuarios-claves', titulo: 'Usuarios y Claves', icono: '🔐', color: '#9f1239',
    intro: 'Módulo donde se crean y administran los Usuarios del sistema y sus Claves de acceso. Cada persona del equipo que va a usar el CRM tiene su propio usuario con una clave segura. SOLO un usuario con Rol Admin puede gestionarlo.',
    campos: [
      { n: 'Nombre / Apellido', d: 'Datos de la persona usuaria.' },
      { n: 'Usuario', d: 'Nombre de acceso (login).' },
      { n: 'Clave', d: 'Contraseña de acceso; se guarda cifrada, nunca en texto plano.' },
      { n: 'Correo', d: 'Correo del usuario.' },
      { n: 'Rol', d: 'Perfil que define sus permisos (Admin, Ventas, Soporte, Gerencia…).' },
      { n: 'Situación', d: 'Activo / Inactivo: activa o bloquea el acceso del usuario.' },
    ],
    notas: [
      'Seguridad: las claves se guardan cifradas y el login se valida en el servidor.',
      'SOLO ROL ADMIN: crear, editar o desactivar usuarios y cambiar claves es exclusivo del Rol Admin.',
    ],
  },
  {
    id: 'roles', titulo: 'Roles', icono: '🛡️', color: '#1e3a8a',
    intro: 'Los Roles definen QUÉ puede hacer cada usuario en el sistema. Cada rol tiene permisos por módulo (Leer, Crear, Editar, Eliminar), de modo que cada persona ve y hace solo lo que le corresponde. Se administran dentro del módulo de Usuarios (pestaña Roles) y SOLO por un usuario con Rol Admin.',
    puntos: [
      'Roles por defecto: Admin (acceso total), Ventas, Soporte y Gerencia — y se pueden crear nuevos.',
      'Cada rol define permisos por módulo: Leer, Crear, Editar y Eliminar.',
      'Al asignar un rol a un usuario, este hereda automáticamente esos permisos.',
    ],
    campos: [
      { n: 'Nombre del Rol', d: 'Identifica el perfil (ej. Ventas, Soporte).' },
      { n: 'Permisos por Módulo', d: 'Leer / Crear / Editar / Eliminar en cada módulo del CRM.' },
    ],
    notas: [
      'SOLO ROL ADMIN: la creación y edición de roles y permisos es exclusiva del Rol Admin.',
    ],
  },
  {
    id: 'referencias', titulo: 'Referencias', icono: '⚙️', color: '#475569',
    intro: 'El módulo de Referencias está dedicado a almacenar los datos que se usan en otros módulos para desplegar sus opciones — por ejemplo Condiciones de Pago, Tipo de Identificación, Tipo de Moneda, Actividad del Cliente, etc. Son la base de la coherencia de la información, y solo pueden ser actualizadas y administradas por el Administrador del sistema.',
    puntos: [
      'Lo que cambias aquí aparece automáticamente en los desplegables de los módulos.',
      'Cada valor se puede agregar, editar o activar/desactivar (sin borrar el histórico).',
      'Bien configuradas evitan que cada quien escriba distinto y mantienen limpia y ordenada la información.',
    ],
    campos: [
      { n: 'Descripción', d: 'El valor/opción que se mostrará en el desplegable del módulo correspondiente. (Es el campo común a TODAS las tablas.)' },
      { n: 'Situación', d: 'Activo / Inactivo: activa o desactiva la opción sin borrarla.' },
    ],
    notas: [
      'Qué alimenta cada grupo de tablas: Comercial (Tipo de Identificación, Tipo de Moneda, Condiciones de Pago, % Impuestos) · Actividades (de Empresa/Cliente y de Proveedor) · Estados/Situación (Empresa, Contacto, Oportunidad, Cotización, Prospecto, Proyecto, Proveedor y PQRS) · Ventas (Etapa y Origen de Oportunidad, Vendedores) · Productos (Categoría y Unidad de Medida) · Contactos (Nivel de Influencia) · PQRS (Tipo y Prioridad) · Prospectos (Origen) · Ubicación (País y Ciudad) · Seguridad (Roles). Todas comparten los mismos campos: Descripción y Situación.',
      'IMPORTANTE: solo el Administrador del sistema puede actualizar y administrar estas tablas, por su impacto en todo el sistema.',
    ],
  },
  {
    id: 'factores-monedas', titulo: 'Factores Conversión Monedas', icono: '💱', color: '#0d9488',
    intro: 'Registra los factores para convertir entre monedas, usados en los cálculos del sistema (por ejemplo, para mostrar montos equivalentes en otra moneda).',
    campos: [
      { n: 'Nro / Fecha Registro', d: 'Consecutivo automático (FCM-XXXXX) y fecha del día.' },
      { n: 'Factor Pesos a US$', d: 'Cuántos pesos equivalen a un dólar (ej. 4000).' },
      { n: 'Factor US$ a Euro', d: 'Cuántos euros equivale un dólar (ej. 0.92).' },
      { n: 'Situación', d: 'Activo / Inactivo.' },
    ],
    notas: [
      'Configuración que administra normalmente el Administrador del sistema.',
    ],
  },
]

// ── Mini-gráficos de EJEMPLO para la tarjeta Dashboard (datos de muestra) ──
function GraficosEjemplo({ color }: { color: string }) {
  const kpis = [
    { label: 'Empresas', valor: '128', c: '#1d4ed8' },
    { label: 'Oportunidades', valor: '24', c: '#15803d' },
    { label: 'Cotizaciones', valor: '57', c: '#6d28d9' },
    { label: 'PQRS abiertas', valor: '6', c: '#be123c' },
  ]
  const pipeline = [
    { et: 'Prospección', v: 120, c: '#1e3a8a' },
    { et: 'Calificación', v: 90, c: '#60a5fa' },
    { et: 'Propuesta', v: 150, c: '#38bdf8' },
    { et: 'Negociación', v: 80, c: '#f59e0b' },
    { et: 'Cierre', v: 60, c: '#15803d' },
  ]
  const maxPipe = 150
  const cotiz = [
    { s: 'Aprobada', v: 85, c: '#15803d' },
    { s: 'Enviada', v: 60, c: '#1d4ed8' },
    { s: 'Borrador', v: 30, c: '#64748b' },
    { s: 'Vencida', v: 15, c: '#ea580c' },
  ]
  const maxCot = 85
  const tituloEj: React.CSSProperties = { color, fontSize: 14, fontWeight: 800, margin: '2px 0 8px' }
  const wrap: React.CSSProperties = { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 4 }}>
      <p style={{ color: '#0f172a', fontSize: 15, fontWeight: 800 }}>Ejemplos de gráficos <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>(datos de muestra)</span></p>

      {/* KPIs */}
      <div style={wrap}>
        <p style={tituloEj}>Tarjetas KPI</p>
        <svg viewBox="0 0 660 92" style={{ width: '100%', maxWidth: 660, height: 'auto', display: 'block' }}>
          {kpis.map((k, i) => {
            const x = i * 168
            return (
              <g key={k.label}>
                <rect x={x} y={0} width={155} height={92} rx={12} fill="#f8fafc" stroke="#e2e8f0" />
                <text x={x + 16} y={46} fontSize={30} fontWeight={800} fill={k.c}>{k.valor}</text>
                <text x={x + 16} y={70} fontSize={12} fontWeight={600} fill="#475569">{k.label}</text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Pipeline de Ventas — barras verticales */}
      <div style={wrap}>
        <p style={tituloEj}>Pipeline de Ventas (monto por etapa)</p>
        <svg viewBox="0 0 660 210" style={{ width: '100%', maxWidth: 660, height: 'auto', display: 'block' }}>
          <line x1={0} y1={170} x2={660} y2={170} stroke="#e2e8f0" />
          {pipeline.map((b, i) => {
            const h = Math.round((b.v / maxPipe) * 140)
            const bx = 20 + i * 128
            const y = 170 - h
            return (
              <g key={b.et}>
                <rect x={bx} y={y} width={72} height={h} rx={5} fill={b.c} />
                <text x={bx + 36} y={y - 6} fontSize={12} fontWeight={800} fill="#0f172a" textAnchor="middle">{`$ ${b.v}M`}</text>
                <text x={bx + 36} y={188} fontSize={11} fontWeight={700} fill="#334155" textAnchor="middle">{b.et}</text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Cotizaciones por Situación — barras horizontales */}
      <div style={wrap}>
        <p style={tituloEj}>Cotizaciones por Situación (valor en $)</p>
        <svg viewBox="0 0 660 180" style={{ width: '100%', maxWidth: 660, height: 'auto', display: 'block' }}>
          {cotiz.map((c, i) => {
            const y = 10 + i * 42
            const w = Math.round((c.v / maxCot) * 380)
            return (
              <g key={c.s}>
                <text x={0} y={y + 24} fontSize={13} fontWeight={800} fill="#0f172a">{c.s}</text>
                <rect x={150} y={y + 6} width={w} height={26} rx={4} fill={c.c} />
                <text x={150 + w + 8} y={y + 25} fontSize={12} fontWeight={900} fill="#0f172a">{`$ ${c.v}M`}</text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

export default function ManualPage() {
  const user = useCurrentUserStore(s => s.user)
  const isAdmin = (user?.rol || '').toLowerCase() === 'admin'
  const [abierta, setAbierta] = useState<string | null>(null)

  // Orden de las tarjetas = orden del menú lateral
  const ORDEN_MENU = ['introduccion', 'dashboard', 'clientes', 'contactos', 'prospectos', 'oportunidades', 'ofertas', 'cotizaciones', 'pqrs', 'tareas']
  const posMenu = (id: string) => { const i = ORDEN_MENU.indexOf(id); return i < 0 ? 999 : i }
  const operativasOrd = [...TARJETAS_OPERATIVAS].sort((a, b) => posMenu(a.id) - posMenu(b.id))

  const todas = [...TARJETAS_OPERATIVAS, ...TARJETAS_ADMIN]
  const tarjeta = todas.find(t => t.id === abierta) || null
  const tieneContenido = (t: Tarjeta) => !!(t.intro || t.puntos?.length || t.campos?.length || t.notas?.length)

  // ── Tile de acceso (frente de color) ──
  const Tile = ({ t }: { t: Tarjeta }) => (
    <div
      className="manual-card-front"
      onClick={() => setAbierta(t.id)}
      style={{
        ['--card-bg' as string]: t.color, background: t.color, borderRadius: 18, padding: 22, height: 170, cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
        boxShadow: '0 10px 24px rgba(0,0,0,0.18)', textAlign: 'center', transition: 'transform 0.15s',
      } as React.CSSProperties}
      onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
    >
      <span style={{ fontSize: 48, lineHeight: 1 }}>{t.icono}</span>
      <span style={{ color: '#ffffff', fontSize: 18, fontWeight: 800, letterSpacing: 0.3 }}>{t.titulo}</span>
      <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600 }}>toca para abrir ▸</span>
    </div>
  )

  const grid: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 20, marginTop: 16,
  }

  // ── Vista en PÁGINA COMPLETA de una tarjeta ──
  if (tarjeta) {
    const t = tarjeta
    return (
      <div style={{ ['--card-bg' as string]: t.color } as React.CSSProperties}>
        <button
          onClick={() => setAbierta(null)}
          style={{ padding: '10px 18px', borderRadius: 10, background: '#000000', color: '#ffffff', border: '1px solid #333', fontWeight: 700, cursor: 'pointer', fontSize: 13, marginBottom: 16 }}
        >
          ◂ Volver a las tarjetas
        </button>

        {/* Encabezado de color */}
        <div className="manual-card-front" style={{ background: t.color, borderRadius: 18, padding: '26px 24px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 10px 24px rgba(0,0,0,0.18)' }}>
          <span style={{ fontSize: 52, lineHeight: 1 }}>{t.icono}</span>
          <span style={{ color: '#ffffff', fontSize: 28, fontWeight: 900 }}>{t.titulo}</span>
        </div>

        {/* Contenido */}
        <div style={{ background: '#ffffff', borderRadius: 18, padding: 28, border: `2px solid ${t.color}`, marginTop: 16, maxWidth: 900 }}>
          {!tieneContenido(t) ? (
            <p style={{ color: '#94a3b8', fontSize: 15, fontStyle: 'italic' }}>Contenido en preparación…</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {t.intro && <p style={{ color: '#0f172a', fontSize: 16, lineHeight: 1.6, fontWeight: 600 }}>{t.intro}</p>}

              {t.puntos && t.puntos.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {t.puntos.map((p, i) => <li key={i} style={{ color: '#0f172a', fontSize: 14.5, lineHeight: 1.55 }}>{p}</li>)}
                </ul>
              )}

              {t.pasos && t.pasos.length > 0 && (
                <div>
                  <p style={{ color: t.color, fontSize: 16, fontWeight: 800, marginBottom: 10 }}>Paso a paso</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {t.pasos.map((paso, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 999, background: t.color, color: '#ffffff', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                        <p style={{ color: '#0f172a', fontSize: 14.5, lineHeight: 1.55, paddingTop: 3 }}>{paso.replace(/^\d+\)\s*/, '')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {t.campos && t.campos.length > 0 && (
                <div>
                  <p style={{ color: t.color, fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Campos del formulario</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {t.campos.map((c, i) => (
                      <p key={i} style={{ color: '#0f172a', fontSize: 14, lineHeight: 1.5 }}>
                        <b>{c.n}:</b> {c.d}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {t.notas && t.notas.map((nota, i) => (
                <div key={i} style={{ background: '#eff6ff', border: `1.5px solid ${t.color}`, borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ color: '#0f172a', fontSize: 14, lineHeight: 1.55 }}>📌 {nota}</p>
                </div>
              ))}

              {t.id === 'dashboard' && <GraficosEjemplo color={t.color} />}
            </div>
          )}
        </div>

        <button
          onClick={() => setAbierta(null)}
          style={{ padding: '10px 18px', borderRadius: 10, background: t.color, color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 13, marginTop: 18 }}
        >
          ◂ Cerrar y elegir otra tarjeta
        </button>
      </div>
    )
  }

  // ── Vista de TARJETAS (grid) ──
  return (
    <div>
      {/* Título principal */}
      <div className="manual-hero" style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #0f766e 100%)', borderRadius: 18, padding: '28px 24px',
        marginBottom: 8, boxShadow: '0 10px 24px rgba(0,0,0,0.15)',
      }}>
        <h1 style={{ color: '#ffffff', fontSize: 30, fontWeight: 900, letterSpacing: 0.3 }}>Manual de Uso — GESTIÓN COMERCIAL NORTON</h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 6 }}>
          Guía por módulos, paso a paso. Toca una tarjeta para abrirla en página completa.
        </p>
      </div>

      {/* Módulos operativos */}
      <h2 style={{ color: '#013978', fontSize: 18, fontWeight: 800, marginTop: 24 }}>Módulos Operativos</h2>
      <div style={grid}>
        {operativasOrd.map(t => <Tile key={t.id} t={t} />)}
      </div>

      {/* Administración — solo Admin */}
      {isAdmin && (
        <>
          <h2 style={{ color: '#013978', fontSize: 18, fontWeight: 800, marginTop: 32 }}>
            Administración / Configuración <span style={{ fontSize: 12, fontWeight: 700, color: '#9f1239', background: '#fee2e2', padding: '3px 10px', borderRadius: 12, marginLeft: 8 }}>Solo Admin</span>
          </h2>
          <div style={grid}>
            {TARJETAS_ADMIN.map(t => <Tile key={t.id} t={t} />)}
          </div>
        </>
      )}
    </div>
  )
}
