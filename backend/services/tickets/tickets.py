from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime, timezone
import random

from utils.db import get_supabase
from utils.auth import obtener_usuario_actual
from utils.notifications import SLA_LIMITS_MINUTOS, enviar_notificacion_correo
from utils.memory_state import (
    TECNICO_CONFIG,
    SLA_START_TIMES,
    EXTENSIONES_APROBADAS,
    registrar_historial,
    agregar_notificacion
)
from schemas.tickets import (
    TicketCreate,
    TicketRechazarRequest,
    TicketResolverRequest,
    TicketFeedbackRequest
)
from schemas.admin_ops import ReasignarTicketRequest

router = APIRouter(prefix="/api/v1/tickets", tags=["Tickets"])

def autoasignar_tecnico(db) -> Optional[dict]:
    tecnicos_res = db.table("users").select("id, nombre, correo, codigo_empleado").eq("rol", "tecnico").eq("activo", True).execute()
    tecnicos = tecnicos_res.data or []
    if not tecnicos:
        return None

    tickets_activos_res = db.table("tickets").select("tecnico_id").in_("estado", ["pendiente", "en_proceso"]).execute()
    tickets_activos = tickets_activos_res.data or []
    
    conteo_cargas = {}
    for t in tickets_activos:
        tid = t.get("tecnico_id")
        if tid:
            conteo_cargas[tid] = conteo_cargas.get(tid, 0) + 1

    disponibles = []
    for tec in tecnicos:
        tid = tec["id"]
        carga_actual = conteo_cargas.get(tid, 0)
        max_permitido = TECNICO_CONFIG.get(tid, 5)
        if carga_actual < max_permitido:
            disponibles.append((carga_actual, tec))

    if disponibles:
        disponibles.sort(key=lambda x: x[0])
        return disponibles[0][1]

    tecnicos_ordenados = sorted(tecnicos, key=lambda tec: conteo_cargas.get(tec["id"], 0))
    return tecnicos_ordenados[0]

@router.get("", response_model=List[dict])
def listar_tickets(
    codigo: Optional[str] = None,
    estado: Optional[str] = None,
    categoria: Optional[str] = None,
    usuario: Optional[dict] = Depends(obtener_usuario_actual)
):
    db = get_supabase()
    query = db.table("tickets").select("*, users!tickets_codigo_empleado_fkey(nombre, departamento, correo)")
    
    rol = usuario.get("rol") if usuario else None
    user_cod = usuario.get("codigo_empleado") if usuario else codigo
    user_id = usuario.get("id") if usuario else None

    if rol == "empleado":
        query = query.eq("codigo_empleado", user_cod)
    elif rol == "tecnico":
        query = query.or_(f"tecnico_id.eq.{user_id},estado.eq.pendiente")
    elif codigo:
        query = query.eq("codigo_empleado", codigo)

    if estado:
        query = query.eq("estado", estado)
    if categoria:
        query = query.eq("categoria", categoria)

    res = query.order("created_at", desc=True).execute()
    
    resultados = []
    for item in res.data:
        tid = item["id"]
        prio = item.get("prioridad", "media")
        sla_base = SLA_LIMITS_MINUTOS.get(prio, 240)
        extra = EXTENSIONES_APROBADAS.get(tid, 0)
        item["tiempo_sla_minutos"] = sla_base + extra
        item["sla_start_at"] = SLA_START_TIMES.get(tid)
        
        if "users" in item and item["users"]:
            item["empleado_nombre"] = item["users"].get("nombre")
            item["empleado_departamento"] = item["users"].get("departamento")
        resultados.append(item)

    return resultados

@router.get("/{id}/historial")
def ver_historial_ticket(id: str, usuario: dict = Depends(obtener_usuario_actual)):
    db = get_supabase()
    res = db.table("ticket_historial").select("*").eq("ticket_id", id).order("created_at", desc=False).execute()
    return res.data or []

@router.get("/{id}", response_model=dict)
def detalle_ticket(id: str, usuario: dict = Depends(obtener_usuario_actual)):
    db = get_supabase()
    res = db.table("tickets").select("*, users!tickets_codigo_empleado_fkey(nombre, departamento, correo, extension)").eq("id", id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    ticket = res.data[0]
    prio = ticket.get("prioridad", "media")
    sla_base = SLA_LIMITS_MINUTOS.get(prio, 240)
    extra = EXTENSIONES_APROBADAS.get(id, 0)
    ticket["tiempo_sla_minutos"] = sla_base + extra
    ticket["sla_start_at"] = SLA_START_TIMES.get(id)
    return ticket

@router.post("", response_model=dict)
def crear_ticket(req: TicketCreate, usuario: dict = Depends(obtener_usuario_actual)):
    db = get_supabase()
    codigo = usuario.get("codigo_empleado")
    nombre_emp = usuario.get("nombre")
    
    tecnico = autoasignar_tecnico(db)
    tecnico_id = tecnico["id"] if tecnico else None

    nuevo_ticket = {
        "codigo_empleado": codigo,
        "tecnico_id": tecnico_id,
        "categoria": req.categoria.value,
        "prioridad": req.prioridad.value,
        "estado": "pendiente",
        "descripcion": req.descripcion
    }

    res = db.table("tickets").insert(nuevo_ticket).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Error al crear el ticket")

    ticket_creado = res.data[0]
    tid = ticket_creado["id"]

    registrar_historial(
        db,
        ticket_id=tid,
        usuario_codigo=codigo,
        estado_anterior="ninguno",
        estado_nuevo="pendiente",
        comentario=f"Incidencia reportada con prioridad {req.prioridad.value}"
    )

    # 🔔 Notificar al técnico asignado en el sistema
    if tecnico:
        agregar_notificacion(
            destinatario_codigo=tecnico.get("codigo_empleado"),
            titulo=f"🎫 Nueva Tarea Asignada (Ticket #{tid[:8]})",
            mensaje=f"Se te asignó un nuevo caso de {req.categoria.value.upper()} reportado por {nombre_emp}.",
            tipo="info",
            ticket_id=tid
        )
        enviar_notificacion_correo(
            destinatario=tecnico.get("correo", "tecnico@inabie.gob.do"),
            asunto=f"Nuevo Ticket Asignado: [{req.prioridad.value.upper()}] {req.categoria.value}",
            cuerpo=f"Se te ha asignado el ticket {tid}.\nSolicitante: {nombre_emp} ({codigo})\nDescripción: {req.descripcion}"
        )

    return ticket_creado

@router.patch("/{id}/aceptar")
def aceptar_ticket(id: str, usuario: dict = Depends(obtener_usuario_actual)):
    db = get_supabase()
    ticket_res = db.table("tickets").select("*, users!tickets_codigo_empleado_fkey(nombre, correo)").eq("id", id).execute()
    if not ticket_res.data:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    ticket = ticket_res.data[0]
    estado_ant = ticket.get("estado")
    
    # Inicio de SLA
    SLA_START_TIMES[id] = datetime.now(timezone.utc).isoformat()

    update_data = {
        "estado": "en_proceso",
        "tecnico_id": usuario.get("id")
    }
    res = db.table("tickets").update(update_data).eq("id", id).execute()

    registrar_historial(
        db,
        ticket_id=id,
        usuario_codigo=usuario.get("codigo_empleado"),
        estado_anterior=estado_ant,
        estado_nuevo="en_proceso",
        comentario=f"Caso aceptado por técnico {usuario.get('nombre')}. Temporizador SLA iniciado."
    )

    # 🔔 Notificar al empleado que su ticket fue aceptado
    agregar_notificacion(
        destinatario_codigo=ticket.get("codigo_empleado"),
        titulo=f"🛠 Ticket #{id[:8]} en Proceso",
        mensaje=f"El técnico {usuario.get('nombre')} ha aceptado tu solicitud y está trabajando en ella.",
        tipo="info",
        ticket_id=id
    )

    return {"mensaje": "Ticket aceptado y puesto en proceso", "ticket": res.data[0], "sla_start_at": SLA_START_TIMES[id]}

@router.patch("/{id}/rechazar")
def rechazar_ticket(id: str, req: TicketRechazarRequest, usuario: dict = Depends(obtener_usuario_actual)):
    db = get_supabase()
    ticket_res = db.table("tickets").select("*").eq("id", id).execute()
    if not ticket_res.data:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    estado_ant = ticket_res.data[0].get("estado")
    
    tecnicos = db.table("users").select("id, nombre, correo, codigo_empleado").eq("rol", "tecnico").neq("id", usuario.get("id")).eq("activo", True).execute()
    nuevo_tecnico = random.choice(tecnicos.data) if tecnicos.data else None
    
    if id in SLA_START_TIMES:
        del SLA_START_TIMES[id]

    update_data = {
        "estado": "pendiente",
        "motivo_rechazo": req.motivo,
        "tecnico_id": nuevo_tecnico["id"] if nuevo_tecnico else None
    }
    res = db.table("tickets").update(update_data).eq("id", id).execute()

    registrar_historial(
        db,
        ticket_id=id,
        usuario_codigo=usuario.get("codigo_empleado"),
        estado_anterior=estado_ant,
        estado_nuevo="pendiente",
        comentario=f"Rechazado por {usuario.get('nombre')}. Motivo: {req.motivo}"
    )

    # 🔔 Notificar al nuevo técnico reasignado
    if nuevo_tecnico:
        agregar_notificacion(
            destinatario_codigo=nuevo_tecnico.get("codigo_empleado"),
            titulo=f"🔄 Ticket Reasignado a tu Bandeja (#{id[:8]})",
            mensaje=f"Se te reasignó un caso devuelto por {usuario.get('nombre')}. Motivo: {req.motivo}",
            tipo="warning",
            ticket_id=id
        )

    return {"mensaje": "Ticket rechazado y reasignado", "ticket": res.data[0]}

@router.patch("/{id}/resolver")
def resolver_ticket(id: str, req: TicketResolverRequest, usuario: dict = Depends(obtener_usuario_actual)):
    db = get_supabase()
    ticket_res = db.table("tickets").select("*, users!tickets_codigo_empleado_fkey(correo, nombre)").eq("id", id).execute()
    if not ticket_res.data:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    ticket = ticket_res.data[0]
    estado_ant = ticket.get("estado")
    
    update_data = {
        "estado": "resuelto",
        "solucion_tecnica": req.solucion_tecnica
    }
    res = db.table("tickets").update(update_data).eq("id", id).execute()

    registrar_historial(
        db,
        ticket_id=id,
        usuario_codigo=usuario.get("codigo_empleado"),
        estado_anterior=estado_ant,
        estado_nuevo="resuelto",
        comentario=f"Solución documentada: {req.solucion_tecnica}"
    )

    # 🔔 Notificar al empleado para calificar
    codigo_emp = ticket.get("codigo_empleado")
    agregar_notificacion(
        destinatario_codigo=codigo_emp,
        titulo=f"🎉 Ticket #{id[:8]} Resuelto",
        mensaje=f"Tu incidencia ha sido resuelta por {usuario.get('nombre')}. Ingresa para calificar el servicio.",
        tipo="success",
        ticket_id=id
    )

    correo_emp = ticket.get("users", {}).get("correo") if ticket.get("users") else None
    if correo_emp:
        enviar_notificacion_correo(
            destinatario=correo_emp,
            asunto="Incidencia Resuelta - INABIE Soporte TI",
            cuerpo=f"Hola {ticket.get('users', {}).get('nombre')},\nTu caso #{id[:8]} ha sido marcado como RESUELTO.\nSolución: {req.solucion_tecnica}\nPor favor ingresa para calificar la atención."
        )

    return {"mensaje": "Ticket resuelto exitosamente", "ticket": res.data[0]}

@router.post("/{id}/feedback")
def feedback_ticket(id: str, req: TicketFeedbackRequest, usuario: dict = Depends(obtener_usuario_actual)):
    db = get_supabase()
    ticket_res = db.table("tickets").select("*").eq("id", id).execute()
    if not ticket_res.data:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    ticket = ticket_res.data[0]
    estado_ant = ticket.get("estado")

    if not req.solucionado:
        nuevo_estado = "pendiente"
        msg = "Ticket reabierto automáticamente porque el problema persiste."
        if id in SLA_START_TIMES:
            del SLA_START_TIMES[id]
        
        # 🔔 Notificar al técnico que el caso fue reabierto
        tec_id = ticket.get("tecnico_id")
        if tec_id:
            tec_res = db.table("users").select("codigo_empleado").eq("id", tec_id).execute()
            if tec_res.data:
                agregar_notificacion(
                    destinatario_codigo=tec_res.data[0].get("codigo_empleado"),
                    titulo=f"⚠️ Ticket Reabierto (#{id[:8]})",
                    mensaje=f"El empleado indicó que la avería no quedó solucionada. Requiere revisión adicional.",
                    tipo="danger",
                    ticket_id=id
                )
    else:
        nuevo_estado = "cerrado"
        msg = "Servicio calificado y ticket cerrado definitivamente."

    update_data = {
        "calificacion": req.calificacion,
        "comentario_feedback": req.comentario,
        "estado": nuevo_estado
    }
    res = db.table("tickets").update(update_data).eq("id", id).execute()

    registrar_historial(
        db,
        ticket_id=id,
        usuario_codigo=usuario.get("codigo_empleado"),
        estado_anterior=estado_ant,
        estado_nuevo=nuevo_estado,
        comentario=f"Feedback: {req.calificacion}★. Solucionado: {req.solucionado}. Comentario: {req.comentario or 'N/A'}"
    )

    return {"mensaje": msg, "ticket": res.data[0]}

@router.patch("/{id}/reasignar")
def reasignar_ticket_admin(id: str, req: ReasignarTicketRequest, usuario: dict = Depends(obtener_usuario_actual)):
    if usuario.get("rol") != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden reasignar tickets")
    db = get_supabase()
    res = db.table("tickets").update({"tecnico_id": req.tecnico_id}).eq("id", id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    # Notificar al nuevo técnico
    tec_res = db.table("users").select("codigo_empleado, nombre").eq("id", req.tecnico_id).execute()
    if tec_res.data:
        agregar_notificacion(
            destinatario_codigo=tec_res.data[0].get("codigo_empleado"),
            titulo=f"📋 Ticket Reasignado por Admin (#{id[:8]})",
            mensaje=f"El Administrador te ha asignado este caso directamente.",
            tipo="info",
            ticket_id=id
        )

    registrar_historial(
        db,
        ticket_id=id,
        usuario_codigo=usuario.get("codigo_empleado"),
        estado_anterior="n/a",
        estado_nuevo="reasignado",
        comentario=f"Reasignado manualmente por administrador a técnico ID {req.tecnico_id}"
    )
    return {"mensaje": "Ticket reasignado exitosamente", "ticket": res.data[0]}
