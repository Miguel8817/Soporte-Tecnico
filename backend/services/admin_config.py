from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Dict, Any
from utils.auth import obtener_usuario_actual
from utils.memory_state import (
    SLA_EXTENSION_REQUESTS,
    EXTENSIONES_APROBADAS,
    TECNICO_CONFIG,
    agregar_notificacion
)
from utils.notifications import enviar_notificacion_correo
from schemas.admin_ops import SolicitudExtensionRequest, TecnicoConfigUpdate
from utils.db import get_supabase

router = APIRouter(tags=["Admin & SLA Extensions"])

def verificar_admin(usuario: dict = Depends(obtener_usuario_actual)):
    if usuario.get("rol") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso restringido para administradores"
        )
    return usuario

@router.post("/api/v1/tickets/{id}/solicitar-extension")
def solicitar_extension_sla(id: str, req: SolicitudExtensionRequest, usuario: dict = Depends(obtener_usuario_actual)):
    db = get_supabase()
    ticket_res = db.table("tickets").select("*").eq("id", id).execute()
    if not ticket_res.data:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    t = ticket_res.data[0]
    SLA_EXTENSION_REQUESTS[id] = {
        "ticket_id": id,
        "tecnico_id": usuario.get("id"),
        "tecnico_codigo": usuario.get("codigo_empleado"),
        "tecnico_nombre": usuario.get("nombre"),
        "motivo": req.motivo,
        "minutos_adicionales": req.minutos_adicionales,
        "estado": "pendiente",
        "codigo_empleado": t.get("codigo_empleado"),
        "descripcion": t.get("descripcion")
    }

    # Notificar a los administradores
    admins = db.table("users").select("codigo_empleado, correo").eq("rol", "admin").execute()
    for adm in (admins.data or []):
        agregar_notificacion(
            destinatario_codigo=adm.get("codigo_empleado"),
            titulo=f"Solicitud de Extensión SLA (Ticket #{id[:8]})",
            mensaje=f"El técnico {usuario.get('nombre')} solicitó +{req.minutos_adicionales}m. Motivo: {req.motivo}",
            tipo="warning",
            ticket_id=id
        )

    return {"mensaje": "Solicitud de extensión enviada al administrador"}

@router.get("/api/v1/admin/extensiones-pendientes")
def listar_extensiones_pendientes(admin: dict = Depends(verificar_admin)):
    pendientes = [v for v in SLA_EXTENSION_REQUESTS.values() if v.get("estado") == "pendiente"]
    return pendientes

@router.patch("/api/v1/admin/extensiones/{ticket_id}/aprobar")
def aprobar_extension_sla(ticket_id: str, admin: dict = Depends(verificar_admin)):
    if ticket_id not in SLA_EXTENSION_REQUESTS:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    
    req = SLA_EXTENSION_REQUESTS[ticket_id]
    req["estado"] = "aprobada"
    minutos_extra = req["minutos_adicionales"]
    EXTENSIONES_APROBADAS[ticket_id] = EXTENSIONES_APROBADAS.get(ticket_id, 0) + minutos_extra
    
    # 🔔 NOTIFICAR AL TÉCNICO QUE SU SOLICITUD FUE APROBADA
    tec_cod = req.get("tecnico_codigo")
    if tec_cod:
        agregar_notificacion(
            destinatario_codigo=tec_cod,
            titulo=f"✅ Extensión de SLA APROBADA (Ticket #{ticket_id[:8]})",
            mensaje=f"El administrador ha concedido los +{minutos_extra} minutos adicionales solicitados.",
            tipo="success",
            ticket_id=ticket_id
        )

    return {"mensaje": f"Extensión de {minutos_extra} minutos aprobada", "minutos_adicionales": minutos_extra}

@router.patch("/api/v1/admin/extensiones/{ticket_id}/rechazar")
def rechazar_extension_sla(ticket_id: str, admin: dict = Depends(verificar_admin)):
    if ticket_id not in SLA_EXTENSION_REQUESTS:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    
    req = SLA_EXTENSION_REQUESTS[ticket_id]
    req["estado"] = "rechazada"

    # 🔔 NOTIFICAR AL TÉCNICO QUE SU SOLICITUD FUE RECHAZADA
    tec_cod = req.get("tecnico_codigo")
    if tec_cod:
        agregar_notificacion(
            destinatario_codigo=tec_cod,
            titulo=f"❌ Extensión de SLA RECHAZADA (Ticket #{ticket_id[:8]})",
            mensaje="El administrador no ha autorizado la extensión de tiempo para este caso. Debes mantener el plazo original.",
            tipo="danger",
            ticket_id=ticket_id
        )

    return {"mensaje": "Solicitud de extensión rechazada"}

@router.get("/api/v1/admin/config/tecnicos/{tecnico_id}")
def obtener_config_tecnico(tecnico_id: str, admin: dict = Depends(verificar_admin)):
    max_t = TECNICO_CONFIG.get(tecnico_id, 5)
    return {"tecnico_id": tecnico_id, "max_tickets": max_t}

@router.put("/api/v1/admin/config/tecnicos/{tecnico_id}")
def actualizar_config_tecnico(tecnico_id: str, req: TecnicoConfigUpdate, admin: dict = Depends(verificar_admin)):
    TECNICO_CONFIG[tecnico_id] = req.max_tickets
    return {"mensaje": "Configuración actualizada", "tecnico_id": tecnico_id, "max_tickets": req.max_tickets}
