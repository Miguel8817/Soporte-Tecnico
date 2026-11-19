from pydantic import BaseModel
from typing import Optional
from enum import Enum
from datetime import datetime

class LoginCodigoRequest(BaseModel):
    codigo: str


class UserRole(str, Enum):
    empleado = "empleado"
    tecnico = "tecnico"
    admin = "admin"


class UserCreate(BaseModel):
    codigo_empleado: str
    nombre: str
    departamento: str
    correo: str
    extension: Optional[str] = None
    rol: UserRole = UserRole.empleado
    activo: bool = True

class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    departamento: Optional[str] = None
    correo: Optional[str] = None
    extension: Optional[str] = None
    rol: Optional[UserRole] = None
    activo: Optional[bool] = None

class UserResponse(BaseModel):
    id: str
    codigo_empleado: str
    nombre: str
    departamento: str
    correo: str
    extension: Optional[str] = None
    rol: str
    activo: bool
    created_at: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

