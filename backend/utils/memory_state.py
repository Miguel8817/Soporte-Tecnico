from datetime import datetime, timezone
from typing import Dict, Any, List

# Estado en memoria
TECNICO_CONFIG: Dict[str, int] = {}  # tecnico_id -> max_tickets (default 5)
SLA_EXTENSION_REQUESTS: Dict[str, Dict[str, Any]] = {} # ticket_id -> request data
EXTENSIONES_APROBADAS: Dict[str, int] = {} # ticket_id -> minutos_adicionales
SLA_START_TIMES: Dict[str, str] = {} # ticket_id -> iso_timestamp

# Sistema de Notificaciones Internas en Tiempo Real
NOTIFICACIONES: List[Dict[str, Any]] = []

# Mensajes / Chat Mini por Ticket entre Técnico y Empleado
MENSAJES_CHAT: List[Dict[str, Any]] = []

# Auditoría de Sesiones e IP/Dispositivo
AUDITORIA_SESIONES: List[Dict[str, Any]] = []

# Base de Conocimiento / FAQ Institucional Ampliada y Profesional
FAQ_ITEMS: List[Dict[str, Any]] = [
    {
        "id": "faq-1",
        "categoria": "impresoras",
        "titulo": "¿Cómo agregar e instalar la impresora de red departamental?",
        "resumen": "Guía paso a paso para mapear impresoras compartidas en Windows sin credenciales de administrador.",
        "contenido": "1. Presiona simultáneamente las teclas Windows + R para abrir el comando Ejecutar.\n2. Escribe la ruta del servidor de impresión institucional: \\\\inabie-print01 y pulsa Enter.\n3. En la ventana que aparece, busca el nombre correspondiente a tu piso o departamento (Ejemplo: PRINT-FINANZAS-PISO2 o PRINT-RRHH-01).\n4. Haz doble clic sobre el ícono de la impresora. Windows descargará e instalará el controlador oficial en unos 30 segundos.\n5. Dirígete a Panel de Control > Dispositivos e Impresoras, haz clic derecho sobre la impresora recién agregada y selecciona 'Establecer como impresora predeterminada'.\n6. Si el servidor te solicita usuario y contraseña, ingresa tu cuenta de dominio en formato: INABIE\\tu_usuario.",
        "visitas": 312
    },
    {
        "id": "faq-2",
        "categoria": "impresoras",
        "titulo": "La impresora aparece 'Sin Conexión' o la cola de impresión se queda atascada",
        "resumen": "Solución rápida para reiniciar el servicio de impresión local y purgar documentos trabados.",
        "contenido": "1. En la barra de búsqueda de Windows escribe 'cmd', haz clic derecho y selecciona 'Ejecutar como administrador' (o solicita asistencia rápida si tienes permisos restringidos).\n2. Escribe el comando: net stop spooler y pulsa Enter para pausar el servicio.\n3. Abre el explorador de archivos y navega a la carpeta: C:\\Windows\\System32\\spool\\PRINTERS.\n4. Selecciona y elimina todos los archivos temporales (.SHD y .SPL) dentro de esa carpeta.\n5. Vuelve a la ventana de comando y ejecuta: net start spooler.\n6. Vuelve a mandar tu documento a imprimir. Si la impresora física muestra luz ámbar parpadeando, verifica la bandeja de papel A4/Carta o tóner agotado.",
        "visitas": 189
    },
    {
        "id": "faq-3",
        "categoria": "software",
        "titulo": "Configuración y sincronización del Correo Institucional en Microsoft Outlook 365",
        "resumen": "Asegurar la recepción correcta de correos @inabie.gob.do y sincronización de carpetas compartidas.",
        "contenido": "1. Inicia Microsoft Outlook en tu equipo.\n2. Si es la primera vez, el asistente te pedirá tu dirección: ingresa tu correo completo (ej. nombre.apellido@inabie.gob.do).\n3. Selecciona el tipo de cuenta 'Microsoft 365' o 'Exchange'.\n4. Se abrirá la ventana de inicio de sesión de INABIE: ingresa tu contraseña institucional.\n5. Confirma la solicitud de inicio en la aplicación Microsoft Authenticator en tu dispositivo móvil.\n6. Asegúrate de marcar la casilla 'Permitir que mi organización administre este dispositivo' y haz clic en Listo.\n7. Deja que Outlook descargue el buzón completo. Si no ves tu bandeja actualizada, pulsa F9 o 'Enviar y Recibir todas las carpetas'.",
        "visitas": 450
    },
    {
        "id": "faq-4",
        "categoria": "software",
        "titulo": "Restablecer contraseña institucional y desbloqueo de cuenta de dominio",
        "resumen": "Procedimiento oficial de autogestión de credenciales para colaboradores del INABIE.",
        "contenido": "1. Si recibes el mensaje 'Tu cuenta está bloqueada temporalmente por intentos fallidos', espera 15 minutos sin intentar digitar contraseñas para permitir el desbloqueo automático del Active Directory.\n2. Para cambiar tu clave de acceso preventivamente en tu equipo con sesión iniciada, pulsa Ctrl + Alt + Supr y selecciona 'Cambiar una contraseña'.\n3. La contraseña debe cumplir con los estándares gubernamentales de seguridad:\n   - Mínimo 10 caracteres.\n   - Al menos una letra mayúscula y una minúscula.\n   - Al menos un número.\n   - Al menos un carácter especial (@, #, $, %, etc.).\n   - No puede contener tu nombre ni apellidos.\n4. Si olvidaste tu contraseña por completo, contacta al teléfono interno de Mesa de Ayuda TI ext. 4001 para verificación de identidad.",
        "visitas": 280
    },
    {
        "id": "faq-5",
        "categoria": "redes",
        "titulo": "Conexión a la red Wi-Fi institucional 'INABIE-Colaboradores'",
        "resumen": "Autenticación segura WPA2/WPA3 Enterprise con credenciales institucionales.",
        "contenido": "1. Abre la lista de conexiones de red inalámbricas en la bandeja del sistema (esquina inferior derecha).\n2. Selecciona 'INABIE-Colaboradores' y marca 'Conectar automáticamente'.\n3. En el campo 'Nombre de usuario', ingresa solo tu usuario de red (sin @inabie.gob.do).\n4. En el campo 'Contraseña', ingresa tu clave del sistema.\n5. Si Windows te muestra una alerta: '¿Continuar conectando? El servidor presentó un certificado emitido por auth.inabie.gob.do', haz clic en 'Conectar'.\n6. Si experimentas lentitud, verifica que no tengas activa una conexión por cable Ethernet al mismo tiempo, ya que genera conflicto de métricas de enrutamiento.",
        "visitas": 215
    },
    {
        "id": "faq-6",
        "categoria": "redes",
        "titulo": "Acceso Remoto y Configuración de VPN Institucional para Teletrabajo",
        "resumen": "Cómo conectarse a los sistemas internos de gestión desde fuera de la sede central.",
        "contenido": "1. Asegúrate de contar con el cliente FortiClient VPN o Cisco AnyConnect instalado en tu laptop oficial asignada.\n2. Abre el cliente VPN e introduce la dirección de servidor: vpn.inabie.gob.do:10443.\n3. Ingresa tu usuario y contraseña de red.\n4. Introduce el código de 6 dígitos generado por tu aplicación de doble factor (2FA).\n5. Una vez conectado (estado 'Conectado - 100%'), ya tendrás acceso a los sistemas internos de compras, inventario, carpetas de red y portal SIGEF.\n6. Recuerda desconectar la VPN al finalizar tu jornada para liberar ancho de banda institucional.",
        "visitas": 178
    },
    {
        "id": "faq-7",
        "categoria": "hardware",
        "titulo": "Configuración de Pantalla Doble y Monitores Adicionales en Windows 11",
        "resumen": "Ajuste de resolución, duplicar o extender pantalla en estaciones de trabajo y laptops.",
        "contenido": "1. Conecta el cable HDMI o DisplayPort firmemente al puerto correspondiente de tu CPU o docking station.\n2. En tu teclado presiona el atajo: Windows + P.\n3. Aparecerá un menú lateral con 4 opciones:\n   - Solo pantalla de PC\n   - Duplicar (muestra lo mismo en ambas pantallas)\n   - Extender (recomendado para ampliar tu área de trabajo)\n   - Solo segunda pantalla\n4. Selecciona 'Extender'.\n5. Si el orden de los monitores está invertido (el ratón se mueve al lado contrario), haz clic derecho en el escritorio > 'Configuración de pantalla' y arrastra los rectángulos con los números [1] y [2] hasta que coincidan con su posición física en tu escritorio.",
        "visitas": 164
    },
    {
        "id": "faq-8",
        "categoria": "hardware",
        "titulo": "El teclado o el ratón inalámbrico no responden o tienen retraso",
        "resumen": "Comprobaciones físicas de batería, dongle USB y reinicio de periféricos.",
        "contenido": "1. Revisa el interruptor de encendido (ON/OFF) situado en la parte inferior del ratón y teclado.\n2. Cambia las pilas alcalinas (AA o AAA) por unas nuevas verificando la polaridad (+ / -).\n3. Localiza el receptor USB (dongle) de 2.4 GHz y conéctalo en un puerto USB frontal o directamente en el CPU, evitando hubs o extensiones de baja calidad.\n4. Si el ratón salta o no se desliza suavemente, limpia el sensor óptico inferior con un paño seco y utiliza un mousepad limpio.\n5. Si el periférico es por cable y Windows emite el sonido de desconexión constante, prueba en otro puerto USB posterior.",
        "visitas": 92
    }
]

def agregar_notificacion(destinatario_codigo: str, titulo: str, mensaje: str, tipo: str = "info", ticket_id: str = ""):
    notif = {
        "id": f"notif-{len(NOTIFICACIONES) + 1}",
        "destinatario_codigo": destinatario_codigo.strip().upper(),
        "titulo": titulo,
        "mensaje": mensaje,
        "tipo": tipo,
        "ticket_id": ticket_id,
        "leido": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    NOTIFICACIONES.insert(0, notif)
    return notif

def registrar_historial(db, ticket_id: str, usuario_codigo: str, estado_anterior: str, estado_nuevo: str, comentario: str = ""):
    try:
        db.table("ticket_historial").insert({
            "ticket_id": ticket_id,
            "usuario_codigo": usuario_codigo,
            "estado_anterior": estado_anterior,
            "estado_nuevo": estado_nuevo,
            "comentario": comentario
        }).execute()
    except Exception as e:
        print(f"Error registrando en ticket_historial: {e}")
