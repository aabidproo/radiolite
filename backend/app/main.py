from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.endpoints import stations, health, releases, analytics, admin, auth
from app.core.database import init_db

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

@app.on_event("startup")
async def on_startup():
    await init_db()

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://127.0.0.1",
        "http://localhost:1420",
        "tauri://localhost",
        "http://tauri.localhost",
        "https://radiolite.onrender.com",
        "https://radiolite-web.onrender.com",
        "https://radiolite-admin.onrender.com",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stations.router, prefix=f"{settings.API_V1_STR}/stations", tags=["stations"])
app.include_router(health.router, prefix=settings.API_V1_STR, tags=["health"])
app.include_router(releases.router, prefix=f"{settings.API_V1_STR}/releases", tags=["releases"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}", tags=["analytics"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}", tags=["admin"])
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}", tags=["auth"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
