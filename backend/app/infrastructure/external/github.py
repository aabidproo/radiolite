import httpx
from typing import Dict, List, Optional
from app.core.config import settings
from fastapi import HTTPException


class GitHubAdapter:
    def __init__(self):
        self.repo = settings.GITHUB_REPO
        self.token = settings.GITHUB_TOKEN
        self.base_url = f"https://api.github.com/repos/{self.repo}"
        # For public repos, the token is optional. If present, it raises the rate limit
        # from 60 to 5000 req/hour. We send it only if configured.
        self.headers = {"Accept": "application/vnd.github.v3+json"}
        if self.token:
            self.headers["Authorization"] = f"token {self.token}"

    async def get_latest_release(self) -> Dict:
        if not self.repo:
            raise HTTPException(status_code=500, detail="GITHUB_REPO is not configured")

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{self.base_url}/releases/latest", headers=self.headers
            )
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="No releases found on GitHub")
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"GitHub API error: {response.text[:200]}"
                )
            return response.json()

    async def get_asset_redirect(self, asset_id: int) -> Optional[str]:
        if not self.repo:
            raise HTTPException(status_code=500, detail="GITHUB_REPO is not configured")

        url = f"{self.base_url}/releases/assets/{asset_id}"
        headers = self.headers.copy()
        headers["Accept"] = "application/octet-stream"

        async with httpx.AsyncClient(timeout=10.0, follow_redirects=False) as client:
            response = await client.get(url, headers=headers)
            if response.status_code in (301, 302):
                return response.headers.get("Location")
            # For public repos without token, GitHub may return 200 with stream
            if response.status_code == 200:
                return str(response.url)
            return None

    async def get_asset_content(self, asset_id: int) -> str:
        url = await self.get_asset_redirect(asset_id)
        if not url:
            raise HTTPException(status_code=404, detail="Asset not found")

        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(url)
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Failed to fetch asset content"
                )
            return response.text
