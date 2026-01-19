from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.core.database import get_db
from app.models.blog import BlogPost
from app.models.admin_user import AdminUser
from app.schemas.blog import BlogCreate, BlogUpdate, BlogResponse
from app.api.v1.deps import get_current_user

router = APIRouter()

# --- Public Endpoints ---

@router.get("/", response_model=List[BlogResponse])
async def list_posts(
    skip: int = 0, 
    limit: int = 10, 
    published_only: bool = True,
    db: AsyncSession = Depends(get_db)
):
    """
    List blog posts for the landing page.
    """
    stmt = select(BlogPost).options(selectinload(BlogPost.author)).order_by(desc(BlogPost.created_at)).offset(skip).limit(limit)
    if published_only:
        stmt = stmt.where(BlogPost.is_published == True)
        
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{slug}", response_model=BlogResponse)
async def get_post_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    """
    Get a single post by slug for SSR.
    """
    result = await db.execute(select(BlogPost).options(selectinload(BlogPost.author)).where(BlogPost.slug == slug))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

# --- Admin Endpoints (Protected) ---

@router.post("/", response_model=BlogResponse)
async def create_post(
    post_in: BlogCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """
    Create a new blog post.
    """
    # Check for slug uniqueness
    existing = await db.execute(select(BlogPost).where(BlogPost.slug == post_in.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Slug already exists")
        
    db_post = BlogPost(**post_in.model_dump(), author_id=current_user.id)
    db.add(db_post)
    await db.commit()
    await db.refresh(db_post)
    return db_post

@router.patch("/{post_id}", response_model=BlogResponse)
async def update_post(
    post_id: int, 
    post_in: BlogUpdate, 
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """
    Update an existing blog post.
    """
    result = await db.execute(select(BlogPost).where(BlogPost.id == post_id))
    db_post = result.scalar_one_or_none()
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    update_data = post_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_post, field, value)
        
    await db.commit()
    await db.refresh(db_post)
    return db_post

@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """
    Delete a blog post.
    """
    result = await db.execute(select(BlogPost).where(BlogPost.id == post_id))
    db_post = result.scalar_one_or_none()
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    await db.delete(db_post)
    await db.commit()
    return None
