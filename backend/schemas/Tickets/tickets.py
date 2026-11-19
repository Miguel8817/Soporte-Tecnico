from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime

class TicketCategoria(str, Enum):
    hardware = "hardware"
    software = "software"
    redes = "redes"
    impresoras = "impresoras"

class TicketPrioridad(str, Enum):
    baja = "baja"
    media = "media"
    alta = "alta"
    critica = "critica"

class TicketEstado(str, Enum):
    pendiente = "pendiente"
    en_proceso = "en_proceso"
    resuelto = "resuelto"
    cerrado = "cerrado"

class TicketCreate(BaseModel):
    categoria: TicketCategoria
    prioridad: TicketPrioridad = TicketPrioridad.media
    descripcion: str
    evidencia_url: Optional[str] = None

class TicketRechazarRequest(BaseModel):
    motivo: str = Field(..., min_length=5, description="Motivo obligatorio del rechazo")

class TicketResolverRequest(BaseModel):
    solucion_tecnica: str = Field(..., min_length=5, description="Documentación de la solución aplicada")

class TicketFeedbackRequest(BaseModel):
    calificacion: int = Field(..., ge=1, le=5, description="Calificación de 1 a 5 estrellas")
    comentario: Optional[str] = None
    solucionado: bool = Field(..., description="Confirmación si el problema fue resuelto")

class TicketResponse(BaseModel):
    id: str
    codigo_empleado: str
    tecnico_id: Optional[str] = None
    categoria: str
    prioridad: str
    estado: str
    descripcion: str
    motivo_rechazo: Optional[str] = None
    solucion_tecnica: Optional[str] = None
    calificacion: Optional[int] = None
    comentario_feedback: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    tiempo_sla_minutos: Optional[int] = None
    empleado_nombre: Optional[str] = None
    tecnico_nombre: Optional[str] = None

