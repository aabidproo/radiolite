from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.admin_user import AdminUser, UserRole
from app.schemas.admin_user import UserCreate, UserResponse
from app.api.v1.deps import get_superadmin

router = APIRouter()

@router.get("/users", response_model=List[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    superadmin: AdminUser = Depends(get_superadmin)
):
    result = await db.execute(select(AdminUser))
    return result.scalars().all()

@router.post("/users", response_model=UserResponse)
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    superadmin: AdminUser = Depends(get_superadmin)
):
    # Check if user already exists
    result = await db.execute(select(AdminUser).where(AdminUser.username == user_in.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already registered")
    
    user = AdminUser(
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role or UserRole.ADMIN
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    superadmin: AdminUser = Depends(get_superadmin)
):
    user = await db.get(AdminUser, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.username == superadmin.username:
        raise HTTPException(status_code=400, detail="Cannot delete self")
    
    await db.delete(user)
    await db.commit()
    return None
