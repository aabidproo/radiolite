import httpx
from typing import Dict, List, Optional
from app.core.config import settings
from fastapi import HTTPException

class GitHubAdapter:
    def __init__(self):
        self.repo = settings.GITHUB_REPO
        self.token = settings.GITHUB_TOKEN
        self.base_url = f"https://api.github.com/repos/{self.repo}"
        self.headers = {
            "Authorization": f"token {self.token}",
            "Accept": "application/vnd.github.v3+json"
        }

    async def get_latest_release(self) -> Dict:
        if not self.token or not self.repo:
            raise HTTPException(status_code=500, detail="GitHub configuration missing")
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{self.base_url}/releases/latest", headers=self.headers)
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch from GitHub")
            return response.json()

    async def get_asset_redirect(self, asset_id: int) -> Optional[str]:
        if not self.token or not self.repo:
            raise HTTPException(status_code=500, detail="GitHub configuration missing")
            
        url = f"{self.base_url}/releases/assets/{asset_id}"
        headers = self.headers.copy()
        headers["Accept"] = "application/octet-stream"
        
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=False) as client:
            response = await client.get(url, headers=headers)
            if response.status_code == 302:
                return response.headers.get("Location")
            return None

    async def get_asset_content(self, asset_id: int) -> str:
        url = await self.get_asset_redirect(asset_id)
        if not url:
            raise HTTPException(status_code=404, detail="Asset not found")
        
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            response = await client.get(url)
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch asset content")
            return response.text
