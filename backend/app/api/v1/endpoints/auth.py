from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.security import create_access_token, verify_password
from app.core.config import settings
from app.core.database import get_db
from app.models.admin_user import AdminUser

from app.api.v1.deps import get_current_user
from app.schemas.admin_user import UserResponse

router = APIRouter()

@router.post("/token")
async def login_for_access_token(
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    try:
        # Use a simpler query first to debug visibility
        from sqlalchemy import text
        # await db.execute(text("SELECT 1")) # Health check
        
        result = await db.execute(select(AdminUser).where(AdminUser.username == form_data.username))
        user = result.scalar_one_or_none()
        
        if user is None or not verify_password(form_data.password, user.hashed_password):
            # This is NOT a 500, it's a 401
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"LOGIN CRASH: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed internal error: {str(e)}"
        )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: AdminUser = Depends(get_current_user)):
    return current_user
