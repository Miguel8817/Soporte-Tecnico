import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "inabie_soporte_tecnico_secret_key_2026_jwt")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

security = HTTPBearer(auto_error=False)

def crear_token_acceso(datos: dict, expira_delta: Optional[timedelta] = None) -> str:
    a_codificar = datos.copy()
    if expira_delta:
        expira = datetime.now(timezone.utc) + expira_delta
    else:
        expira = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    a_codificar.update({"exp": expira})
    return jwt.encode(a_codificar, SECRET_KEY, algorithm=ALGORITHM)

def obtener_usuario_actual(credenciales: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    if not credenciales:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token no proporcionado"
        )
    token = credenciales.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        codigo: str = payload.get("sub")
        rol: str = payload.get("rol")
        if not codigo:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
        return {
            "codigo_empleado": codigo,
            "rol": rol,
            "id": payload.get("id"),
            "nombre": payload.get("nombre"),
            "departamento": payload.get("departamento")
        }
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado o inválido"
        )

