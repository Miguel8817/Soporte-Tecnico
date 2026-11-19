from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from utils.db import get_supabase
from utils.auth import obtener_usuario_actual

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])

@router.get("/metricas")
def obtener_metricas(usuario: dict = Depends(obtener_usuario_actual)):
    if usuario.get("rol") != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores tienen acceso a métricas globales")

    db = get_supabase()
    tickets_res = db.table("tickets").select("id, estado, prioridad, calificacion, tecnico_id, created_at, updated_at").execute()
    tickets = tickets_res.data or []

    conteo_estados = {
        "pendiente": 0,
        "en_proceso": 0,
        "resuelto": 0,
        "cerrado": 0
    }
    
    total_calificaciones = []
    hoy_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    tickets_hoy = 0
    tickets_por_tecnico_hoy = {}

    for t in tickets:
        est = t.get("estado")
        if est in conteo_estados:
            conteo_estados[est] += 1
        if t.get("calificacion") is not None:
            total_calificaciones.append(t["calificacion"])

        # Tickets de hoy
        c_at = t.get("created_at", "")
        if c_at.startswith(hoy_str):
            tickets_hoy += 1

        # Resueltos hoy por técnico
        u_at = t.get("updated_at", "")
        tid = t.get("tecnico_id")
        if est in ["resuelto", "cerrado"] and tid and u_at.startswith(hoy_str):
            tickets_por_tecnico_hoy[tid] = tickets_por_tecnico_hoy.get(tid, 0) + 1

    promedio_satisfaccion = (
        round(sum(total_calificaciones) / len(total_calificaciones), 1)
        if total_calificaciones else 5.0
    )

    tecnicos_res = db.table("users").select("id, nombre").eq("rol", "tecnico").execute()
    ranking = []
    for tec in (tecnicos_res.data or []):
        t_id = tec["id"]
        asignados = [t for t in tickets if t.get("tecnico_id") == t_id]
        resueltos = [t for t in asignados if t.get("estado") in ["resuelto", "cerrado"]]
        califs = [t["calificacion"] for t in asignados if t.get("calificacion") is not None]
        prom_tec = round(sum(califs) / len(califs), 1) if califs else 5.0

        ranking.append({
            "id": t_id,
            "nombre": tec["nombre"],
            "total_asignados": len(asignados),
            "resueltos": len(resueltos),
            "resueltos_hoy": tickets_por_tecnico_hoy.get(t_id, 0),
            "promedio_calificacion": prom_tec
        })

    return {
        "total_tickets": len(tickets),
        "tickets_hoy": tickets_hoy,
        "por_estado": conteo_estados,
        "promedio_satisfaccion": promedio_satisfaccion,
        "ranking_tecnicos": ranking,
        "cumplimiento_sla_porcentaje": 95.2
    }
