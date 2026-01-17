import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings
from app.core.database import init_db

@pytest_asyncio.fixture(autouse=True)
async def lifespan():
    await init_db()
    yield

@pytest.mark.asyncio
async def test_login():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Successful Login
        response = await ac.post(
            f"{settings.API_V1_STR}/auth/token",
            data={
                "username": settings.ADMIN_USERNAME,
                "password": settings.ADMIN_PASSWORD
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

        # 2. Incorrect Password
        response = await ac.post(
            f"{settings.API_V1_STR}/auth/token",
            data={
                "username": settings.ADMIN_USERNAME,
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 401

        # 3. Incorrect Username
        response = await ac.post(
            f"{settings.API_V1_STR}/auth/token",
            data={
                "username": "wronguser",
                "password": settings.ADMIN_PASSWORD
            }
        )
        assert response.status_code == 401
