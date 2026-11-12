from pydantic import BaseModel, Field
from typing import Optional

class SolicitudExtensionRequest(BaseModel):
    motivo: str = Field(..., min_length=5)
    minutos_adicionales: int = Field(..., gt=0)

class TecnicoConfigUpdate(BaseModel):
    max_tickets: int = Field(..., ge=1, le=50)

class ReasignarTicketRequest(BaseModel):
    tecnico_id: str

