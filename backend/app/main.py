from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
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

# Resolve landing directory path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # app -> backend
PROJECT_ROOT = os.path.dirname(BASE_DIR)
LANDING_DIR = os.path.join(PROJECT_ROOT, "landing")

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
@app.get("/", include_in_schema=False)
async def serve_landing(request: Request, db: AsyncSession = Depends(get_db)):
    # Fetch 3 latest posts for the homepage
    stmt = select(BlogPost).where(BlogPost.is_published == True).order_by(desc(BlogPost.created_at)).limit(3)
    result = await db.execute(stmt)
    posts = result.scalars().all()
    
    return templates.TemplateResponse("index.html", {
        "request": request,
        "posts": posts
    })

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
