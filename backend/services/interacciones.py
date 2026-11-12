from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone

from utils.auth import obtener_usuario_actual
from utils.db import get_supabase
from utils.memory_state import (
    NOTIFICACIONES,
    MENSAJES_CHAT,
    FAQ_ITEMS,
    AUDITORIA_SESIONES,
    agregar_notificacion
)

router = APIRouter(prefix="/api/v1", tags=["Interacciones, FAQ y Notificaciones"])

class MensajeChatCreate(BaseModel):
    mensaje: str = Field(..., min_length=1, max_length=1000)

class FaqCreate(BaseModel):
    titulo: str
    categoria: str
    resumen: str
    contenido: str

# ----------------- NOTIFICACIONES -----------------
@router.get("/notificaciones")
def obtener_mis_notificaciones(usuario: dict = Depends(obtener_usuario_actual)):
    codigo = usuario.get("codigo_empleado")
    # Retorna notificaciones para este usuario o globales
    mis_notifs = [n for n in NOTIFICACIONES if n.get("destinatario_codigo") == codigo]
    return mis_notifs

@router.patch("/notificaciones/{id}/leer")
def marcar_notificacion_leida(id: str, usuario: dict = Depends(obtener_usuario_actual)):
    for n in NOTIFICACIONES:
        if n.get("id") == id:
            n["leido"] = True
            return {"mensaje": "Notificación leída", "id": id}
    return {"mensaje": "Notificación no encontrada"}

@router.patch("/notificaciones/leer-todas")
def marcar_todas_leidas(usuario: dict = Depends(obtener_usuario_actual)):
    codigo = usuario.get("codigo_empleado")
    for n in NOTIFICACIONES:
        if n.get("destinatario_codigo") == codigo:
            n["leido"] = True
    return {"mensaje": "Todas marcadas como leídas"}

# ----------------- MINI CHAT / MENSAJES DE TICKET -----------------
@router.get("/tickets/{id}/mensajes")
def obtener_mensajes_ticket(id: str, usuario: dict = Depends(obtener_usuario_actual)):
    mensajes = [m for m in MENSAJES_CHAT if m.get("ticket_id") == id]
    return mensajes

@router.post("/tickets/{id}/mensajes")
def enviar_mensaje_ticket(id: str, req: MensajeChatCreate, usuario: dict = Depends(obtener_usuario_actual)):
    db = get_supabase()
    ticket_res = db.table("tickets").select("*, users!tickets_codigo_empleado_fkey(nombre, correo)").eq("id", id).execute()
    if not ticket_res.data:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    ticket = ticket_res.data[0]
    remitente_cod = usuario.get("codigo_empleado")
    remitente_rol = usuario.get("rol")
    remitente_nom = usuario.get("nombre")

    nuevo_mensaje = {
        "id": f"msg-{len(MENSAJES_CHAT) + 1}",
        "ticket_id": id,
        "remitente_codigo": remitente_cod,
        "remitente_nombre": remitente_nom,
        "rol": remitente_rol,
        "mensaje": req.mensaje,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    MENSAJES_CHAT.append(nuevo_mensaje)

    # Si quien envía es el TÉCNICO -> Notificar al EMPLEADO solicitante
    if remitente_rol in ["tecnico", "admin"]:
        destinatario = ticket.get("codigo_empleado")
        agregar_notificacion(
            destinatario_codigo=destinatario,
            titulo=f"Mensaje del Técnico sobre Ticket #{id[:8]}",
            mensaje=f"{remitente_nom}: {req.mensaje}",
            tipo="info",
            ticket_id=id
        )
    # Si quien envía es el EMPLEADO -> Notificar al TÉCNICO asignado
    else:
        # Buscar código del técnico asignado
        tec_id = ticket.get("tecnico_id")
        if tec_id:
            tec_res = db.table("users").select("codigo_empleado").eq("id", tec_id).execute()
            if tec_res.data:
                dest_tec = tec_res.data[0].get("codigo_empleado")
                agregar_notificacion(
                    destinatario_codigo=dest_tec,
                    titulo=f"Respuesta de {remitente_nom} (Ticket #{id[:8]})",
                    mensaje=req.mensaje,
                    tipo="info",
                    ticket_id=id
                )

    return nuevo_mensaje

# ----------------- BASE DE CONOCIMIENTOS (FAQ) -----------------
@router.get("/faq")
def listar_faq(categoria: Optional[str] = None, busqueda: Optional[str] = None):
    items = FAQ_ITEMS
    if categoria and categoria != "todas":
        items = [f for f in items if f.get("categoria") == categoria]
    if busqueda:
        b = busqueda.lower()
        items = [f for f in items if b in f.get("titulo", "").lower() or b in f.get("resumen", "").lower() or b in f.get("contenido", "").lower()]
    return items

@router.post("/faq")
def crear_faq(req: FaqCreate, usuario: dict = Depends(obtener_usuario_actual)):
    if usuario.get("rol") != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden crear artículos en la base de conocimientos")
    nuevo_faq = {
        "id": f"faq-{len(FAQ_ITEMS) + 1}",
        "categoria": req.categoria,
        "titulo": req.titulo,
        "resumen": req.resumen,
        "contenido": req.contenido,
        "visitas": 0
    }
    FAQ_ITEMS.append(nuevo_faq)
    return nuevo_faq

# ----------------- AUDITORÍA DE SEGURIDAD Y SESIONES -----------------
@router.get("/admin/auditoria-sesiones")
def obtener_auditoria_sesiones(usuario: dict = Depends(obtener_usuario_actual)):
    if usuario.get("rol") != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden consultar registros de auditoría")
    return AUDITORIA_SESIONES

