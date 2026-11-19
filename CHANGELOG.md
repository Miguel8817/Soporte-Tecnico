# Registro de Cambios: Sistema de Soporte Técnico - INABIE
## Actualización V1.0 — Noviembre 2026

Este documento detalla todas las mejoras técnicas, funcionales, de seguridad y de diseño implementadas en la plataforma de Mesa de Ayuda y Gestión de Incidencias Técnicas del **Instituto Nacional de Bienestar Estudiantil (INABIE)**.

---

### 1. Nivel de Negocio y Lógica Funcional (Backend FastAPI + Supabase)

#### A. Reglas de SLA y Temporizador Condicional
* **Inicio de SLA exclusivamente al aceptar**: El temporizador se mantiene en pausa (**"⏸ SLA en Espera"**) hasta que el técnico presiona **"Aceptar Caso"**. Al momento de aceptación, el sistema registra el timestamp exacto (`sla_start_at`) e inicia el cómputo regresivo según la prioridad:
  * **Crítica**: 30 minutos.
  * **Alta**: 1 hora (60 minutos).
  * **Media**: 4 horas (240 minutos).
  * **Baja**: 24 horas (1440 minutos).

#### B. Límite de Carga de Trabajo por Técnico
* **Tope máximo configurable**: Se incorporó un parámetro configurable por el Administrador (por defecto: 5 tickets simultáneos) por cada técnico activo.
* **Algoritmo de balanceo inteligente**: Al reportarse un ticket, el sistema consulta la carga de incidencias activas (`pendiente` y `en_proceso`) de todos los técnicos del personal de soporte y asigna automáticamente al que tenga menor carga, siempre y cuando no exceda su límite permitido.

#### C. Solicitudes y Aprobación de Extensión de Tiempo SLA
* **Petición del técnico**: Se habilitó el endpoint `POST /api/v1/tickets/{id}/solicitar-extension` que permite al técnico justificar ante el administrador la necesidad de minutos adicionales (30m, 1h, 2h, 4h).
* **Gestión administrativa**: El Administrador cuenta con endpoints dedicados (`GET /api/v1/admin/extensiones-pendientes`, `PATCH /api/v1/admin/extensiones/{id}/aprobar` y `PATCH /api/v1/admin/extensiones/{id}/rechazar`) para evaluar y sumar automáticamente el tiempo solicitado al límite del ticket.

#### D. Sistema de Notificaciones en Tiempo Real
* **Centro de Notificaciones con polling reactivo**:
  * Notificación automática al Técnico cuando se le asigna un ticket nuevo.
  * Notificación al Técnico cuando el Administrador **aprueba o rechaza** una solicitud de extensión de tiempo SLA.
  * Notificación al Técnico cuando un empleado **reabre un caso** indicando que el problema persiste.
  * Notificación al Empleado cuando el Técnico acepta el ticket o cuando documenta la solución.
  * Notificación al Administrador cuando un técnico solicita extensión de tiempo o rechaza un caso.

#### E. Mini Chat / Mensajería Directa por Ticket
* **Canal de comunicación bidireccional**: Técnico y solicitante pueden intercambiar mensajes directos sobre la incidencia en tiempo real sin salir de la plataforma (`POST /api/v1/tickets/{id}/mensajes` y `GET /api/v1/tickets/{id}/mensajes`).
* Cada mensaje genera una notificación inmediata en el panel del destinatario.

#### F. Base de Conocimientos / FAQ Integrada
* **Módulo de autogestión de usuarios**: Catálogo de tutoriales oficiales paso a paso (`/usuarios/faq`) clasificados en hardware, software, redes e impresoras para reducir la carga de soporte antes de generar tickets:
  * Conexión a impresoras de red departamentales (`\\inabie-print01`).
  * Configuración de cuentas de correo institucional en Outlook y teléfonos móviles.
  * Conexión y certificados Wi-Fi `INABIE-Colaboradores`.
  * Verificación de conexiones de pantalla y monitores.

#### G. Control de Sesiones y Auditoría de IP / Dispositivo
* **Registro de seguridad gubernamental**: Cada inicio de sesión mediante código institucional registra la dirección IP del equipo y la cadena del navegador/dispositivo (`User-Agent`) en `backend/services/auth/user.py`.
* **Panel de Auditoría para Administradores**: Vista dedicada en el panel de control con el histórico de ingresos, fecha, hora, IP y usuario.

#### H. Notificaciones por Correo Institucional
* **Soporte SMTP Transaccional**: Módulo en `backend/utils/notifications.py` preparado para conectarse al servidor SMTP de la institución o servicios externos (Resend/SendGrid), con registro detallado en consola.

---

### 2. Nivel de Experiencia de Usuario e Interfaz (Frontend Next.js + Tailwind CSS)

#### A. Identidad Institucional Oficial (Gobierno Dominicano / INABIE)
* **Paleta oficial aplicada**:
  * Azul Marino Institucional: `#002D62` (Sidebar, encabezados y botones primarios).
  * Azul Secundario / Acento: `#1D70B8` (Navegación activa y estados de hover).
  * Verde Éxito: `#10B981` (Resolución y SLA cumplido).
  * Ámbar Alerta: `#F59E0B` (SLA en riesgo y calificaciones).
  * Rojo Peligro: `#EF4444` (Prioridades críticas y rechazos).
  * Fondos: `#F8FAFC` en modo claro y `#0F172A` en modo oscuro.
  * Tarjetas: `#FFFFFF` en modo claro y `#1E293B` en modo oscuro.

#### B. Componente Base `DashboardLayout` con Sidebar Fijo
* Sidebar fijo institucional con el isotipo de INABIE, distintivo visual por rol (`empleado`, `tecnico`, `admin`), nombre y código del usuario activo.
* Soporte nativo para pantallas móviles con menú hamburguesa colapsable y backdrop oscurecido.

#### C. Corrección y Funcionamiento del Modo Oscuro (Dark Mode)
* Se integró la directiva `@custom-variant dark (&:where(.dark, .dark *));` en `globals.css` para compatibilidad completa con Tailwind CSS v4.
* Botón funcional en el Navbar con persistencia en `localStorage` (clave `'theme'`) y sincronización automática.

#### D. Rediseño Atractivo de la Pantalla de Login
* Tarjeta moderna con efecto de desenfoque de cristal (`backdrop-blur-md`), gradiente institucional profundo, distintivo oficial del Gobierno Dominicano y accesos rápidos de prueba (`EMP-501`, `TEC-101`, `ADM-001`).

#### E. Búsqueda y Filtros en Tiempo Real
* **En el Panel del Empleado**: Búsqueda por texto libre, filtrado por estado y categoría.
* **En la Bandeja del Técnico**: Búsqueda por solicitante o ID, filtrado por urgencia/prioridad y estado.
* **En el Panel de Administrador**: Búsqueda en vivo en la tabla de tickets y en el directorio institucional.

---

### 3. Resumen de Archivos Principales Afectados

| Componente | Archivo | Funcionalidad Clave |
|---|---|---|
| **Backend** | `backend/main.py` | Punto de entrada con routers de tickets, admin, interacciones y auditoría. |
| **Backend** | `backend/services/interacciones.py` | Endpoints de notificaciones, mini chat de tickets, FAQ y auditoría. |
| **Backend** | `backend/services/auth/user.py` | Login por código con registro automático de IP y User-Agent. |
| **Backend** | `backend/utils/memory_state.py` | Estado centralizado de notificaciones, mensajes, FAQs y auditorías. |
| **Backend** | `backend/utils/notifications.py` | Envío de correos SMTP institucionales y logs formateados. |
| **Frontend** | `frontend/src/app/globals.css` | Soporte dark mode para Tailwind v4 con variables CSS. |
| **Frontend** | `frontend/src/components/shared/DashboardLayout.tsx` | Layout institucional con campana de notificaciones y toggle dark mode. |
| **Frontend** | `frontend/src/components/frontend/auth/login.tsx` | Pantalla de login rediseñada con estética gubernamental moderna. |
| **Frontend** | `frontend/src/components/tickets/ChatTicketModal.tsx` | Modal de chat interactivo entre técnico y empleado. |
| **Frontend** | `frontend/src/app/usuarios/faq/page.tsx` | Base de conocimientos integrada con buscador y guías acordeón. |
| **Frontend** | `frontend/src/app/usuarios/Tecnico/page.tsx` | Bandeja de técnico con alertas, solicitudes SLA y chat directo. |
| **Frontend** | `frontend/src/app/usuarios/usuario/page.tsx` | Panel de solicitante con acceso a chat y feedback. |
| **Frontend** | `frontend/src/app/usuarios/administrador/page.tsx` | Dashboard con auditoría de sesiones e IPs y gestión de extensiones. |

---
*INABIE &bull; Mesa de Ayuda TI &bull; Documentación de Actualización V1.0*
