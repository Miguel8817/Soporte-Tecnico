"""
Gestión de Solicitudes de Extensión de SLA.
Almacenamiento en memoria para desarrollo.
"""
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

from utils.auth import obtener_usuario_actual

router = APIRouter(tags=["SLA Extensions"])

# ─── Almacenamiento en memoria ───────────────────────────────────────────────
# { ticket_id: { motivo, minutos_adicionales, solicitado_por, estado, created_at } }
SLA_EXTENSION_REQUESTS: dict = {}

# { ticket_id: minutos_adicionales } — solo las aprobadas
EXTENSIONES_APROBADAS: dict = {}


# ─── Schemas ─────────────────────────────────────────────────────────────────
class SolicitudExtensionRequest(BaseModel):
    motivo: str
    minutos_adicionales: int


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.post("/api/v1/tickets/{ticket_id}/solicitar-extension")
def solicitar_extension(
    ticket_id: str,
    req: SolicitudExtensionRequest,
    usuario: dict = Depends(obtener_usuario_actual)
):
    """Técnico solicita extensión de SLA para un ticket."""
    if usuario.get("rol") not in ("tecnico", "admin"):
        raise HTTPException(status_code=403, detail="Solo técnicos o admins pueden solicitar extensión de SLA")

    if req.minutos_adicionales <= 0:
        raise HTTPException(status_code=400, detail="Los minutos adicionales deben ser positivos")

    SLA_EXTENSION_REQUESTS[ticket_id] = {
        "ticket_id": ticket_id,
        "motivo": req.motivo,
        "minutos_adicionales": req.minutos_adicionales,
        "solicitado_por": usuario.get("id"),
        "solicitado_por_nombre": usuario.get("nombre"),
        "estado": "pendiente",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    return {"mensaje": "Solicitud de extensión registrada", "solicitud": SLA_EXTENSION_REQUESTS[ticket_id]}


@router.get("/api/v1/admin/extensiones-pendientes")
def listar_extensiones_pendientes(usuario: dict = Depends(obtener_usuario_actual)):
    """Admin ve todas las solicitudes de extensión pendientes."""
    if usuario.get("rol") != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores")

    pendientes = [v for v in SLA_EXTENSION_REQUESTS.values() if v.get("estado") == "pendiente"]
    return {"extensiones_pendientes": pendientes, "total": len(pendientes)}


@router.patch("/api/v1/admin/extensiones/{ticket_id}/aprobar")
def aprobar_extension(ticket_id: str, usuario: dict = Depends(obtener_usuario_actual)):
    """Admin aprueba una solicitud de extensión de SLA."""
    if usuario.get("rol") != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores")

    solicitud = SLA_EXTENSION_REQUESTS.get(ticket_id)
    if not solicitud:
        raise HTTPException(status_code=404, detail="No existe solicitud de extensión para este ticket")

    minutos = solicitud["minutos_adicionales"]
    # Acumular si ya había una aprobación previa
    EXTENSIONES_APROBADAS[ticket_id] = EXTENSIONES_APROBADAS.get(ticket_id, 0) + minutos

    # Actualizar estado en el registro de solicitud
    SLA_EXTENSION_REQUESTS[ticket_id]["estado"] = "aprobada"
    SLA_EXTENSION_REQUESTS[ticket_id]["aprobado_por"] = usuario.get("id")
    SLA_EXTENSION_REQUESTS[ticket_id]["aprobado_at"] = datetime.now(timezone.utc).isoformat()

    return {
        "mensaje": f"Extensión aprobada: +{minutos} minutos para ticket {ticket_id}",
        "minutos_totales_extra": EXTENSIONES_APROBADAS[ticket_id]
    }


@router.patch("/api/v1/admin/extensiones/{ticket_id}/rechazar")
def rechazar_extension(ticket_id: str, usuario: dict = Depends(obtener_usuario_actual)):
    """Admin rechaza una solicitud de extensión de SLA."""
    if usuario.get("rol") != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores")

    solicitud = SLA_EXTENSION_REQUESTS.get(ticket_id)
    if not solicitud:
        raise HTTPException(status_code=404, detail="No existe solicitud de extensión para este ticket")

    SLA_EXTENSION_REQUESTS[ticket_id]["estado"] = "rechazada"
    SLA_EXTENSION_REQUESTS[ticket_id]["rechazado_por"] = usuario.get("id")
    SLA_EXTENSION_REQUESTS[ticket_id]["rechazado_at"] = datetime.now(timezone.utc).isoformat()

    return {"mensaje": f"Solicitud de extensión rechazada para ticket {ticket_id}"}
