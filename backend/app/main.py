from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from contextlib import asynccontextmanager
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
import markdown
from app.core.config import settings
from app.api.v1.endpoints import stations, health, releases, analytics, admin, auth, blog, users
from app.core.database import init_db, get_db
from app.models.blog import BlogPost
from app.models.admin_user import AdminUser
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Resolve landing directory path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # app -> backend
PROJECT_ROOT = os.path.dirname(BASE_DIR)
LANDING_DIR = os.path.join(PROJECT_ROOT, "landing")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database
    await init_db()
    yield
    # Shutdown: Add any cleanup here if needed

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Debug paths for production
logger.info(f"BASE_DIR: {BASE_DIR}")
logger.info(f"PROJECT_ROOT: {PROJECT_ROOT}")
logger.info(f"LANDING_DIR: {LANDING_DIR}")
if os.path.exists(LANDING_DIR):
    logger.info(f"LANDING_DIR exists. Contents: {os.listdir(LANDING_DIR)}")
else:
    logger.warning(f"LANDING_DIR DOES NOT EXIST at {LANDING_DIR}")

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

# Mount static files for the landing page
app.mount("/static", StaticFiles(directory=LANDING_DIR), name="static")

# Setup templates
templates = Jinja2Templates(directory=LANDING_DIR)

# Add markdown filter
def render_markdown(text):
    if not text:
        return ""
    return markdown.markdown(text, extensions=['fenced_code', 'tables'])

templates.env.filters["markdown"] = render_markdown

app.include_router(stations.router, prefix=f"{settings.API_V1_STR}/stations", tags=["stations"])
app.include_router(health.router, prefix=settings.API_V1_STR, tags=["health"])
app.include_router(releases.router, prefix=f"{settings.API_V1_STR}/releases", tags=["releases"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}", tags=["analytics"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}", tags=["admin"])
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(blog.router, prefix=f"{settings.API_V1_STR}/blog", tags=["blog"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/admin", tags=["users"])

# landing page SSR route
@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def serve_landing(request: Request, db: AsyncSession = Depends(get_db)):
    try:
        # Fetch 3 latest posts for the homepage
        stmt = select(BlogPost).where(BlogPost.is_published == True).order_by(desc(BlogPost.created_at)).limit(3)
        result = await db.execute(stmt)
        posts = result.scalars().all()
        return templates.TemplateResponse("index.html", {"request": request, "posts": posts})
    except Exception as e:
        logger.error(f"Error loading homepage: {e}")
        # Try to run a quick diagnostic for the logs
        try:
            diag = await db.execute(text("SELECT current_database(), current_schema()"))
            db_info = diag.fetchone()
            logger.info(f"Homepage Error Diagnostic: DB={db_info[0] if db_info else '?'}, Schema={db_info[1] if db_info else '?'}")
        except: pass
        
        # Return index with empty posts if DB is not ready
        return templates.TemplateResponse("index.html", {"request": request, "posts": []})

@app.get("/blog", include_in_schema=False)
async def list_blog(request: Request, db: AsyncSession = Depends(get_db)):
    stmt = select(BlogPost).where(BlogPost.is_published == True).order_by(desc(BlogPost.created_at))
    result = await db.execute(stmt)
    posts = result.scalars().all()
    return templates.TemplateResponse("blog.html", {"request": request, "posts": posts})

@app.get("/blog/{slug}", include_in_schema=False)
async def view_post(slug: str, request: Request, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BlogPost).where(BlogPost.slug == slug))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    return templates.TemplateResponse("post.html", {
        "request": request,
        "post": post,
        "title": post.seo_title or post.title,
        "description": post.meta_description
    })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
