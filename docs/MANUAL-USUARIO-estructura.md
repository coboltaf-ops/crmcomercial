# Manual de Usuario — CRM Comercial · Estructura aprobada

> Estructura propuesta y **aprobada por José** para redactar el Manual de Usuario del CRM Comercial.
> Pendiente: desarrollar cada sección a texto completo + capturas reales + exportar a PDF profesional
> (misma calidad que el "Directorio de Sistemas Palomares"). URL del sistema: https://crmcomercial.vercel.app

## Formato de entrega
- **PDF profesional** con portada, índice numerado y secciones (generado con Playwright/Chromium → page.pdf, como el Directorio).
- **Capturas reales** de cada módulo (navegando el sistema con Playwright; login admin/admin123 o llave maestra jpalomares).
- Lenguaje **sencillo, paso a paso**, para cualquier usuario.

---

## Índice / Estructura

**Portada**
- Logo de la empresa + "Manual de Usuario — CRM Comercial"
- Versión, fecha, URL de acceso

**Índice** (tabla de contenido con números de página)

**1. Introducción**
- 1.1 ¿Qué es el CRM Comercial y para qué sirve?
- 1.2 A quién está dirigido este manual
- 1.3 Requisitos (navegador, internet)

**2. Acceso al Sistema**
- 2.1 Dirección de acceso (URL)
- 2.2 Iniciar sesión (usuario y clave)
- 2.3 Cerrar sesión
- 2.4 ¿Olvidó su clave? (el admin la resetea — no se "buscan", se asignan nuevas)

**3. Conociendo la Interfaz**
- 3.1 El menú lateral
- 3.2 El Dashboard (indicadores/KPIs)
- 3.3 Botones de acción: Ver (naranja) · Editar (azul) · Eliminar (rojo) · Guardar

**4. Los Módulos** (un capítulo por cada uno, con paso a paso)
- 4.1 Clientes
- 4.2 Contactos
- 4.3 Prospectos
- 4.4 Oportunidades
- 4.5 Productos
- 4.6 Cotizaciones
- 4.7 PQRS
- 4.8 Referencias
- Cada módulo: qué es → cómo crear → cómo ver/editar/eliminar → campos importantes → tips

**5. Formularios Públicos (captación)**
- 5.1 Formulario público de Prospectos (/prospectos-publico)
- 5.2 Formulario público de PQRS (/pqrs-publico)
- 5.3 Cómo llegan automáticamente al CRM

**6. Administración**
- 6.1 Gestión de usuarios (crear, editar, permisos, resetear clave)
- 6.2 Datos de la empresa y logo
- 6.3 Roles y permisos

**7. Preguntas Frecuentes (FAQ)**

**8. Soporte y Contacto**

---

## Notas técnicas para quien lo redacte (contexto del sistema, jun 2026)
- Login YA es seguro (servidor + claves cifradas scrypt). Cookie `palomares_session`. Endpoint `/api/usuarios` protegido.
- Usuarios actuales en producción: `admin` (Admin), `directorlatam`/JOSE DAVID (Admin), `comer01`/ADRIANA (Ventas), `jpalomares` (llave maestra/Admin). Claves cifradas — no se listan en el manual.
- Botones de acción y estilos: ver el componente de tabla compartido del proyecto.
- Posibles agregados que José podría querer: guía rápida de 1 página, apartado de seguridad.
