from datetime import datetime, timezone
from typing import Dict, Any, List

# Estado en memoria
TECNICO_CONFIG: Dict[str, int] = {}  # tecnico_id -> max_tickets (default 5)
SLA_EXTENSION_REQUESTS: Dict[str, Dict[str, Any]] = {} # ticket_id -> request data
EXTENSIONES_APROBADAS: Dict[str, int] = {} # ticket_id -> minutos_adicionales
SLA_START_TIMES: Dict[str, str] = {} # ticket_id -> iso_timestamp

# Sistema de Notificaciones Internas en Tiempo Real
# notificaciones: list of { id, destinatario_codigo, titulo, mensaje, tipo, leido, ticket_id, created_at }
NOTIFICACIONES: List[Dict[str, Any]] = []

# Mensajes / Chat Mini por Ticket entre Técnico y Empleado
# mensajes_chat: list of { id, ticket_id, remitente_codigo, remitente_nombre, rol, mensaje, created_at }
MENSAJES_CHAT: List[Dict[str, Any]] = []

# Auditoría de Sesiones e IP/Dispositivo
# auditoria_sesiones: list of { id, codigo_empleado, ip, user_agent, rol, created_at }
AUDITORIA_SESIONES: List[Dict[str, Any]] = []

# Base de Conocimiento / FAQ Institucional
FAQ_ITEMS: List[Dict[str, Any]] = [
    {
        "id": "faq-1",
        "categoria": "impresoras",
        "titulo": "¿Cómo conectar la impresora de red institucional?",
        "resumen": "Pasos para agregar impresoras departamentales en Windows sin esperar un técnico.",
        "contenido": "1. Presiona la tecla Windows + R y escribe la ruta del servidor de impresión: \\\\inabie-print01\n2. Busca el nombre de tu departamento (ej. PRINT-RRHH-01).\n3. Haz doble clic sobre la impresora para instalar el controlador automáticamente.\n4. Establécela como impresora predeterminada en Panel de Control > Dispositivos e Impresoras.",
        "visitas": 142
    },
    {
        "id": "faq-2",
        "categoria": "software",
        "titulo": "Configuración del Correo Institucional en Outlook y Celular",
        "resumen": "Guía oficial para conectar tu cuenta @inabie.gob.do con Microsoft 365.",
        "contenido": "1. Abre Outlook e ingresa tu correo institucional completo.\n2. Selecciona cuenta 'Exchange / Microsoft 365'.\n3. Ingresa tu contraseña asignada por TI.\n4. Si te solicita autenticación en dos pasos, confirma en la aplicación Microsoft Authenticator.",
        "visitas": 230
    },
    {
        "id": "faq-3",
        "categoria": "redes",
        "titulo": "¿Problemas de conexión a la red Wi-Fi 'INABIE-Colaboradores'?",
        "resumen": "Restablecer conexión y certificados de seguridad en tu equipo.",
        "contenido": "1. En la lista de redes Wi-Fi, haz clic derecho en 'INABIE-Colaboradores' y selecciona 'Olvidar'.\n2. Conéctate nuevamente ingresando tu usuario institucional (sin @inabie.gob.do) y contraseña de dominio.\n3. Acepta el certificado de seguridad del servidor radius.\n4. Si no navega, desconecta el cable de red unos segundos y reconecta.",
        "visitas": 98
    },
    {
        "id": "faq-4",
        "categoria": "hardware",
        "titulo": "El monitor o la pantalla no enciende o parpadea",
        "resumen": "Comprobaciones físicas básicas de cables y energía.",
        "contenido": "1. Verifica que el cable de energía esté firme tanto en la pared como detrás del monitor.\n2. Revisa la conexión HDMI o DisplayPort hacia el CPU o estación de acoplamiento.\n3. Presiona el botón de encendido del monitor asegurándote de que el LED pase de ámbar a azul/blanco.\n4. Prueba la combinación Windows + Ctrl + Shift + B para reiniciar el controlador gráfico de Windows.",
        "visitas": 75
    }
]

def agregar_notificacion(destinatario_codigo: str, titulo: str, mensaje: str, tipo: str = "info", ticket_id: str = ""):
    notif = {
        "id": f"notif-{len(NOTIFICACIONES) + 1}",
        "destinatario_codigo": destinatario_codigo.strip().upper(),
        "titulo": titulo,
        "mensaje": mensaje,
        "tipo": tipo, # 'info', 'success', 'warning', 'danger'
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
