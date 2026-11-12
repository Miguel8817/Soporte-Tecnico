from fastapi import APIRouter, HTTPException, Request, status
from schemas.user import LoginCodigoRequest, TokenResponse, UserResponse
from utils.db import get_supabase
from utils.auth import crear_token_acceso
from utils.memory_state import AUDITORIA_SESIONES
from datetime import datetime, timezone

router = APIRouter(prefix="", tags=["Autenticación"])

@router.post("/api/v1/auth/login-codigo", response_model=TokenResponse)
@router.post("/api/empleados/verificar/")
def login_por_codigo(req: LoginCodigoRequest, request: Request):
    codigo = req.codigo.strip().upper()
    db = get_supabase()
    
    # Buscar usuario en la tabla 'users'
    res = db.table("users").select("*").eq("codigo_empleado", codigo).execute()
    
    if not res.data or len(res.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Código institucional no encontrado. Verifique con el Administrador de TI."
        )
    
    usuario = res.data[0]
    
    if not usuario.get("activo", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo en el sistema. Contacte a Soporte Técnico."
        )
    
    # Auditoría de Sesión: Registrar IP y Dispositivo (User-Agent)
    ip_origen = request.client.host if request.client else "Desconocida"
    user_agent = request.headers.get("user-agent", "Desconocido")
    
    registro_auditoria = {
        "id": f"ses-{len(AUDITORIA_SESIONES) + 1}",
        "codigo_empleado": usuario["codigo_empleado"],
        "nombre": usuario["nombre"],
        "rol": usuario["rol"],
        "ip": ip_origen,
        "user_agent": user_agent,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    AUDITORIA_SESIONES.insert(0, registro_auditoria)
    print(f"🔒 [AUDITORÍA SEGURIDAD INABIE] Login exitoso: {codigo} desde IP: {ip_origen} ({user_agent[:40]}...)")

    # Generar Token JWT con datos del usuario
    token_data = {
        "sub": usuario["codigo_empleado"],
        "id": str(usuario["id"]),
        "rol": usuario["rol"],
        "nombre": usuario["nombre"],
        "departamento": usuario["departamento"]
    }
    
    token = crear_token_acceso(token_data)
    
    user_resp = UserResponse(
        id=str(usuario["id"]),
        codigo_empleado=usuario["codigo_empleado"],
        nombre=usuario["nombre"],
        departamento=usuario["departamento"],
        correo=usuario["correo"],
        extension=usuario.get("extension"),
        rol=usuario["rol"],
        activo=usuario.get("activo", True),
        created_at=usuario.get("created_at")
    )
    
    return {
        "access_token": token,
        "access": token,
        "token_type": "bearer",
        "rol": usuario["rol"],
        "user": user_resp.model_dump()
    }
