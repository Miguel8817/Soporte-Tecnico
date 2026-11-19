from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.auth.user import router as auth_router
from services.tickets.tickets import router as tickets_router
from services.users import router as users_router
from services.dashboard import router as dashboard_router
from services.admin_config import router as admin_config_router
from services.interacciones import router as interacciones_router

app = FastAPI(
    title="API de Soporte Técnico - INABIE",
    description="Backend oficial con FastAPI y Supabase para gestión de incidencias, SLA, notificaciones, chat e historial.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(tickets_router)
app.include_router(users_router)
app.include_router(dashboard_router)
app.include_router(admin_config_router)
app.include_router(interacciones_router)

@app.get("/")
def raiz():
    return {
        "sistema": "Sistema de Soporte Técnico INABIE",
        "version": "2.0.0",
        "estado": "Operativo",
        "documentacion": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
