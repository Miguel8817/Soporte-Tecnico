from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from utils.db import get_supabase
from utils.auth import obtener_usuario_actual
from schemas.user import UserCreate, UserUpdate, UserResponse

router = APIRouter(prefix="/api/v1/users", tags=["Usuarios"])

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
    return res.data

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
    
    # Validar duplicados
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

@router.delete("/{id}")
def desactivar_usuario(id: str, admin: dict = Depends(verificar_admin)):
    # Soft delete: marca activo = false
    db = get_supabase()
    res = db.table("users").update({"activo": False}).eq("id", id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"mensaje": "Usuario desactivado exitosamente", "id": id}

