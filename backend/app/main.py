from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from contextlib import asynccontextmanager
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.api.v1.endpoints import stations, health, releases, analytics, admin, auth, blog, users
from app.core.database import init_db, get_db
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS — allow the Cloudflare Pages domain, local dev, and Tauri
ALLOWED_ORIGINS = [
    # Local dev
    "http://localhost",
    "http://127.0.0.1",
    "http://localhost:1420",
    "http://localhost:5173",
    "http://localhost:3000",
    # Tauri desktop app
    "tauri://localhost",
    "http://tauri.localhost",
    # Cloudflare Pages (landing + admin)
    "https://radiolite.pages.dev",
    "https://radiolite-admin.pages.dev",
    # Custom domain (add yours here when ready)
    "https://radiolite.app",
    "https://www.radiolite.app",
    "https://radiolite.aabidhasan.com.np",
    "https://radiolite.aabidhasan495.workers.dev",
    # Vercel preview deployments
    "https://radiolite-backend.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://radiolite.*\.vercel\.app",  # Allow all Vercel preview URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(stations.router, prefix=f"{settings.API_V1_STR}/stations", tags=["stations"])
app.include_router(health.router, prefix=settings.API_V1_STR, tags=["health"])
app.include_router(releases.router, prefix=f"{settings.API_V1_STR}/releases", tags=["releases"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}", tags=["analytics"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}", tags=["admin"])
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(blog.router, prefix=f"{settings.API_V1_STR}/blog", tags=["blog"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/admin", tags=["users"])


@app.get("/", include_in_schema=False)
async def root():
    return JSONResponse({
        "service": "Radiolite API",
        "version": "1.1.27",
        "docs": "/api/v1/openapi.json",
        "status": "ok"
    })


if __name__ == "__main__":
    import uvicorn
    import sys
    import threading
    import os

    def monitor_parent_process():
        # Read from stdin. When the parent process (Tauri) terminates,
        # stdin will close and read() will return EOF (empty string).
        try:
            sys.stdin.read()
        except Exception:
            pass
        os._exit(0)

    # Start monitoring in a background daemon thread
    threading.Thread(target=monitor_parent_process, daemon=True).start()

    uvicorn.run(app, host="127.0.0.1", port=8000)

