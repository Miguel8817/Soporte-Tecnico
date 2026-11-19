from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone

from utils.auth import obtener_usuario_actual
from utils.db import get_supabase
from utils.memory_state import (
    NOTIFICACIONES,
    FAQ_ITEMS,
    AUDITORIA_SESIONES,
    agregar_notificacion
)

router = APIRouter(prefix="/api/v1", tags=["Interacciones, FAQ, Mensajes y Notificaciones"])

class MensajeChatCreate(BaseModel):
    mensaje: str = Field(..., min_length=1, max_length=2000)

class MensajeChatUpdate(BaseModel):
    mensaje: str = Field(..., min_length=1, max_length=2000)

class FaqCreate(BaseModel):
    titulo: str
    categoria: str
    resumen: str
    contenido: str

# ----------------- NOTIFICACIONES -----------------
@router.get("/notificaciones")
def obtener_mis_notificaciones(usuario: dict = Depends(obtener_usuario_actual)):
    codigo = usuario.get("codigo_empleado")
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

# ----------------- MENSAJERÍA EN TICKETS (Tabla public.mensajes) -----------------
@router.get("/tickets/{id}/mensajes")
def obtener_mensajes_ticket(id: str, usuario: dict = Depends(obtener_usuario_actual)):
    db = get_supabase()
    try:
        # Consultar la tabla public.mensajes con relación al usuario remitente
        res = db.table("mensajes").select(
            "id, ticket_id, remitente_id, tipo_mensaje, contenido, metadata, leido, creado_en, actualizado_en, editado_en, eliminado_en, users!mensajes_remitente_id_fkey(codigo_empleado, nombre, rol)"
        ).eq("ticket_id", id).is_("eliminado_en", "null").order("creado_en", desc=False).execute()

        mensajes_formateados = []
        for m in (res.data or []):
            u = m.get("users") or {}
            mensajes_formateados.append({
                "id": str(m["id"]),
                "ticket_id": str(m["ticket_id"]),
                "remitente_id": str(m.get("remitente_id") or ""),
                "remitente_codigo": u.get("codigo_empleado", ""),
                "remitente_nombre": u.get("nombre", "Usuario"),
                "rol": u.get("rol", "empleado"),
                "mensaje": m["contenido"],
                "editado": m.get("editado_en") is not None,
                "created_at": m.get("creado_en")
            })
        return mensajes_formateados
    except Exception as e:
        print(f"Error consultando mensajes de Supabase: {e}")
        return []

@router.post("/tickets/{id}/mensajes")
def enviar_mensaje_ticket(id: str, req: MensajeChatCreate, usuario: dict = Depends(obtener_usuario_actual)):
    db = get_supabase()
    ticket_res = db.table("tickets").select("*, users!tickets_codigo_empleado_fkey(nombre, correo)").eq("id", id).execute()
    if not ticket_res.data:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    ticket = ticket_res.data[0]
    remitente_id = usuario.get("id")
    remitente_cod = usuario.get("codigo_empleado")
    remitente_rol = usuario.get("rol")
    remitente_nom = usuario.get("nombre")

    nuevo_row = {
        "ticket_id": id,
        "remitente_id": remitente_id,
        "tipo_mensaje": "texto",
        "contenido": req.mensaje,
        "metadata": {"enviado_desde": "web_frontend"}
    }

    res = db.table("mensajes").insert(nuevo_row).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Error al guardar el mensaje en base de datos")

    mensaje_guardado = res.data[0]

    # Notificaciones según rol
    if remitente_rol in ["tecnico", "admin"]:
        destinatario = ticket.get("codigo_empleado")
        agregar_notificacion(
            destinatario_codigo=destinatario,
            titulo=f"Mensaje del Técnico sobre Ticket #{id[:8]}",
            mensaje=f"{remitente_nom}: {req.mensaje}",
            tipo="info",
            ticket_id=id
        )
    else:
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

    return {
        "id": str(mensaje_guardado["id"]),
        "ticket_id": id,
        "remitente_id": str(remitente_id),
        "remitente_codigo": remitente_cod,
        "remitente_nombre": remitente_nom,
        "rol": remitente_rol,
        "mensaje": mensaje_guardado["contenido"],
        "editado": False,
        "created_at": mensaje_guardado.get("creado_en")
    }

@router.patch("/tickets/{ticket_id}/mensajes/{mensaje_id}")
def editar_mensaje_ticket(ticket_id: str, mensaje_id: str, req: MensajeChatUpdate, usuario: dict = Depends(obtener_usuario_actual)):
    db = get_supabase()
    # Verificar que el mensaje pertenece al usuario o es admin
    msg_res = db.table("mensajes").select("*").eq("id", mensaje_id).eq("ticket_id", ticket_id).execute()
    if not msg_res.data:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado")
    
    msg = msg_res.data[0]
    if str(msg.get("remitente_id")) != str(usuario.get("id")) and usuario.get("rol") != "admin":
        raise HTTPException(status_code=403, detail="No puedes editar un mensaje de otro usuario")

    ahora = datetime.now(timezone.utc).isoformat()
    res = db.table("mensajes").update({
        "contenido": req.mensaje,
        "editado_en": ahora,
        "actualizado_en": ahora
    }).eq("id", mensaje_id).execute()

    return {"mensaje": "Mensaje editado correctamente", "id": mensaje_id, "contenido": req.mensaje}

@router.delete("/tickets/{ticket_id}/mensajes/{mensaje_id}")
def eliminar_mensaje_ticket(ticket_id: str, mensaje_id: str, usuario: dict = Depends(obtener_usuario_actual)):
    db = get_supabase()
    msg_res = db.table("mensajes").select("*").eq("id", mensaje_id).eq("ticket_id", ticket_id).execute()
    if not msg_res.data:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado")
    
    msg = msg_res.data[0]
    if str(msg.get("remitente_id")) != str(usuario.get("id")) and usuario.get("rol") != "admin":
        raise HTTPException(status_code=403, detail="No puedes eliminar un mensaje de otro usuario")

    ahora = datetime.now(timezone.utc).isoformat()
    # Soft delete marcando eliminado_en (para que el trigger fn_auditar_mensajes lo registre o delete directo)
    # También podemos hacer delete para que se dispare el trigger TG_OP = 'DELETE'
    res = db.table("mensajes").delete().eq("id", mensaje_id).execute()

    return {"mensaje": "Mensaje eliminado exitosamente", "id": mensaje_id}

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
