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
async def test_tracking_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Test App Open with Country
        response = await ac.post(
            f"{settings.API_V1_STR}/track/app-open",
            json={"country_code": "US"}
        )
        assert response.status_code == 202
        assert response.json() == {"status": "ok"}

        # Test App Open with Header Fallback
        response = await ac.post(
            f"{settings.API_V1_STR}/track/app-open",
            headers={"cf-ipcountry": "DE"}
        )
        assert response.status_code == 202

        # Test Station Play
        response = await ac.post(
            f"{settings.API_V1_STR}/track/station-play",
            json={"station_id": "test-station-1"}
        )
        assert response.status_code == 202
        assert response.json() == {"status": "ok"}

@pytest.mark.asyncio
async def test_admin_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Login first
        login_response = await ac.post(
            f"{settings.API_V1_STR}/auth/token",
            data={
                "username": settings.ADMIN_USERNAME,
                "password": settings.ADMIN_PASSWORD
            }
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Test Admin Overview (Authenticated)
        response = await ac.get(
            f"{settings.API_V1_STR}/admin/overview",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_app_opens" in data
        assert "total_plays" in data
        assert "recent_daily_stats" in data
        assert "top_countries" in data # New field

        # Test Filter Query Param
        response = await ac.get(
            f"{settings.API_V1_STR}/admin/overview?range=1d",
            headers=headers
        )
        assert response.status_code == 200
