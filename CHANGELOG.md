# Registro de Cambios: Sistema de Soporte Técnico - INABIE
## Actualización V1.3 — Noviembre 2026

Este documento detalla todas las mejoras técnicas, funcionales, de seguridad, arquitectura de datos y diseño implementadas en la plataforma de Mesa de Ayuda y Gestión de Incidencias Técnicas del **Instituto Nacional de Bienestar Estudiantil (INABIE)**.

---

### 1. Nivel de Negocio y Lógica Funcional (Backend FastAPI + Supabase V1.3)

#### A. Corrección y Robustez en Activación / Desactivación de Usuarios
* **Endpoints Optimizados (`backend/services/users.py`)**:
  * `PATCH /api/v1/users/{id}/desactivar` y `PATCH /api/v1/users/{id}/toggle-activo`.
  * Ahora aceptan el esquema `AlternarEstadoRequest` con campo opcional `{ activo: bool }`. Si no se especifica, el backend consulta el estado real en Supabase e invierte el valor booleano de manera atómica.
  * Devuelve respuesta con el objeto de usuario actualizado para confirmación en la UI.
  * Si un usuario tiene tickets o historial asociado e intentan eliminarlo mediante `DELETE /api/v1/users/{id}`, el backend captura la excepción de clave foránea y realiza un soft-delete automático marcándolo como inactivo (`activo = False`) sin arrojar error 500.

#### B. Ampliación Integral de la Base de Conocimientos (FAQ Oficial)
* Se integraron **8 guías técnicas completas paso a paso** clasificadas por categorías para autogestión de colaboradores:
  1. **Impresoras**: Agregar e instalar la impresora de red departamental (`\\inabie-print01`) y comandos de dominio.
  2. **Impresoras**: Solución a cola de impresión atascada y reinicio del servicio Spooler (`net stop/start spooler`).
  3. **Software**: Configuración y sincronización del Correo Institucional en Microsoft Outlook 365 con autenticación multifactor (MFA).
  4. **Software**: Desbloqueo de cuentas en Active Directory y políticas de contraseñas gubernamentales.
  5. **Redes**: Conexión a la red Wi-Fi `INABIE-Colaboradores` con WPA2/WPA3 Enterprise y certificados de servidor.
  6. **Redes**: Configuración y conexión a la VPN institucional (`vpn.inabie.gob.do:10443`) con FortiClient / Cisco AnyConnect.
  7. **Hardware**: Configuración de pantallas duales y monitores extendidos en Windows 11 (`Win + P`).
  8. **Hardware**: Diagnóstico y comprobaciones para ratón y teclado inalámbricos o periféricos USB.

#### C. Módulo de Mensajería y Auditoría (`public.mensajes` y `public.historial_mensajes`)
* **Edición de Mensajes**: Endpoint `PATCH /api/v1/tickets/{ticket_id}/mensajes/{mensaje_id}` con registro de `editado_en`, disparando el trigger `fn_auditar_mensajes()` con la acción `UPDATE`.
* **Eliminación de Mensajes**: Endpoint `DELETE /api/v1/tickets/{ticket_id}/mensajes/{mensaje_id}` con validación de autoría o rol de administrador, disparando la acción `DELETE` en la tabla de auditoría.
* Indicador visual en el chat de mensajes con la marca `(editado)`.

---

### 2. Nivel de Experiencia de Usuario e Interfaz (Frontend Next.js + CSS Modular)

#### A. Sistema Centralizado de Notificaciones en Tarjeta (Toasts & Diálogos Modales)
* **Eliminación Total de `alert()` y `confirm()` del Navegador**:
  * Se erradicó por completo el uso de alertas nativas de JavaScript que mostraban la ventana emergente predeterminada con el texto "localhost dice...".
  * Se implementó un nuevo proveedor de contexto `ToastProvider` (`src/context/ToastContext.tsx`), envuelto a nivel global en el `RootLayout` (`src/app/layout.tsx`).
* **Tarjetas de Notificación Flotantes (Toasts)**:
  * Mensajes emergentes en tarjetas con diseño institucional INABIE (éxito, error, advertencia e información) con barra de progreso, auto-cierre a los 4.5 segundos y botón de descarte rápido.
* **Diálogos de Confirmación Elegantes**:
  * Sustitución de `confirm()` por una tarjeta modal centrada con fondo difuminado (*backdrop-blur*), títulos contextuales y botones semánticos (`danger`, `primary`, `warning`) para confirmaciones críticas:
    * Activar o desactivar usuario.
    * Eliminación definitiva de colaboradores.
    * Eliminación de mensajes en el chat del ticket.

#### B. Botón de Alternar Estado de Acceso de Usuario
* En el panel de Administrador (`usuarios`), el botón **"⏸ Desactivar / ▶ Activar"**:
  * Pide confirmación al administrador antes de ejecutar la acción.
  * Envía el estado explícito a la API (`!u.activo`).
  * Muestra retroalimentación mediante alerta y recarga automáticamente la tabla actualizando los badges de **Activo** / **Inactivo**.

#### B. Eliminación de los Códigos de Demostración en el Login
* Se removió por completo la sección inferior de botones de demostración (`EMP-501`, `TEC-101`, `ADM-001`), dejando una interfaz sobria, segura y estrictamente institucional.

#### C. Rediseño Tipográfico y Espaciado Armónico
* Jerarquía tipográfica depurada con pesos semibold y bold, espaciados generosos en etiquetas e inputs, y diseño adaptativo a temas claro y oscuro.

#### D. Estructura Modular de Estilos en `.css`
* `src/app/styles/auth/login.css`: Tarjeta de cristal, tipografía formal, logo oficial e inputs adaptativos.
* `src/app/styles/Users/faq.css`: Hero card con gradiente oficial, acordeones y pestañas de categorías.
* `src/app/styles/Users/admin.css`: Pestañas, modales y tablas de usuarios.
* `src/app/styles/Users/tecnico.css`: Bandeja SLA y controles de soporte.
* `src/app/styles/Users/user.css`: Panel del colaborador.

---

### 3. Resumen de Archivos Afectados en esta Versión

| Componente | Archivo | Modificación |
|---|---|---|
| **Backend** | `backend/services/users.py` | Soporte de toggle atómico y body opcional en alternar estado de usuario. |
| **Frontend** | `frontend/src/services/userService.ts` | Método `desactivarUsuario(id, nuevoEstado)` adaptado a la API. |
| **Frontend** | `frontend/src/app/usuarios/administrador/page.tsx` | Confirmación, ejecución y refresco automático al alternar estado. |
| **Frontend** | `frontend/src/components/frontend/auth/login.tsx` | Login formal sin botones de demostración. |
| **Frontend** | `frontend/src/app/styles/auth/login.css` | Estilos limpios y organizados del login. |
| **Frontend** | `frontend/src/app/styles/Users/faq.css` | Estilos de acordeones y diseño de la Base de Conocimientos. |

---
*INABIE &bull; Mesa de Ayuda TI &bull; Documentación de Actualización V1.3*
