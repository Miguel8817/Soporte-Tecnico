from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import List, Optional
from utils.db import get_supabase
from utils.auth import obtener_usuario_actual
from schemas.user import UserCreate, UserUpdate, UserResponse

router = APIRouter(prefix="/api/v1/users", tags=["Usuarios"])

class AlternarEstadoRequest(BaseModel):
    activo: Optional[bool] = None

def verificar_admin(usuario: dict = Depends(obtener_usuario_actual)):
    if usuario.get("rol") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso restringido solo para administradores."
        )
    return usuario

@router.get("", response_model=List[UserResponse])
def listar_usuarios(rol: Optional[str] = None, departamento: Optional[str] = None, admin: dict = Depends(verificar_admin)):
    db = get_supabase()
    query = db.table("users").select("*")
    if rol:
        query = query.eq("rol", rol)
    if departamento:
        query = query.eq("departamento", departamento)
    
    res = query.order("created_at", desc=True).execute()
    return res.data or []

@router.get("/{id}", response_model=UserResponse)
def detalle_usuario(id: str, admin: dict = Depends(verificar_admin)):
    db = get_supabase()
    res = db.table("users").select("*").eq("id", id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return res.data[0]

@router.post("", response_model=UserResponse)
def crear_usuario(usuario: UserCreate, admin: dict = Depends(verificar_admin)):
    db = get_supabase()
    datos = usuario.model_dump()
    datos["codigo_empleado"] = datos["codigo_empleado"].strip().upper()
    
    existe = db.table("users").select("id").eq("codigo_empleado", datos["codigo_empleado"]).execute()
    if existe.data:
        raise HTTPException(status_code=400, detail="El código de empleado ya está registrado")
    
    res = db.table("users").insert(datos).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Error al crear usuario en la base de datos")
    return res.data[0]

@router.put("/{id}", response_model=UserResponse)
def actualizar_usuario(id: str, usuario: UserUpdate, admin: dict = Depends(verificar_admin)):
    db = get_supabase()
    datos = {k: v for k, v in usuario.model_dump().items() if v is not None}
    
    if not datos:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar")
    
    res = db.table("users").update(datos).eq("id", id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return res.data[0]

@router.patch("/{id}/desactivar")
@router.patch("/{id}/toggle-activo")
def alternar_estado_usuario(id: str, req: Optional[AlternarEstadoRequest] = None, admin: dict = Depends(verificar_admin)):
    db = get_supabase()
    
    # 1. Obtener estado actual
    user_actual = db.table("users").select("id, codigo_empleado, nombre, activo").eq("id", id).execute()
    if not user_actual.data:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    actual = user_actual.data[0]
    
    # Si viene explícito en el body, usarlo; de lo contrario invertir el booleano actual
    if req and req.activo is not None:
        nuevo_estado = bool(req.activo)
    else:
        nuevo_estado = not bool(actual.get("activo", True))
    
    # 2. Actualizar en Supabase
    res = db.table("users").update({"activo": nuevo_estado}).eq("id", id).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="No se pudo actualizar el estado en la base de datos")
    
    return {
        "mensaje": f"Usuario {'activado' if nuevo_estado else 'desactivado'} exitosamente",
        "id": id,
        "activo": nuevo_estado,
        "user": res.data[0]
    }

# Compatibilidad con DELETE soft-delete si alguna llamada anterior lo usaba
@router.delete("/{id}")
def eliminar_usuario(id: str, admin: dict = Depends(verificar_admin)):
    db = get_supabase()
    try:
        # Intentar eliminación física
        res = db.table("users").delete().eq("id", id).execute()
        return {"mensaje": "Usuario eliminado definitivamente", "id": id}
    except Exception as e:
        # Si falla por restricciones de FK en tickets, cambiar a inactivo automáticamente
        db.table("users").update({"activo": False}).eq("id", id).execute()
        return {
            "mensaje": "El usuario posee tickets o historial asociado, por seguridad fue desactivado en lugar de eliminado.",
            "id": id,
            "activo": False
        }
