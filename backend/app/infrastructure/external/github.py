import urllib.request
import urllib.error
import json
from typing import Dict, List, Optional
from app.core.config import settings
from fastapi import HTTPException


class GitHubAdapter:
    def __init__(self):
        self.repo = settings.GITHUB_REPO.strip() if settings.GITHUB_REPO else ""
        self.token = settings.GITHUB_TOKEN.strip() if settings.GITHUB_TOKEN else ""
        self.base_url = f"https://api.github.com/repos/{self.repo}"
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Radiolite-Backend"
        }
        if self.token:
            self.headers["Authorization"] = f"token {self.token}"

    async def get_latest_release(self) -> Dict:
        if not self.repo:
            raise HTTPException(status_code=500, detail="GITHUB_REPO is not configured")

        req = urllib.request.Request(
            f"{self.base_url}/releases/latest",
            headers=self.headers
        )
        try:
            # We run it synchronously (it's safe and more reliable in serverless environments)
            with urllib.request.urlopen(req, timeout=10.0) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code == 404:
                raise HTTPException(status_code=404, detail="No releases found on GitHub")
            raise HTTPException(
                status_code=e.code,
                detail=f"GitHub API error: {e.read().decode('utf-8')[:200]}"
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch from GitHub: {str(e)}")

    async def get_asset_redirect(self, asset_id: int) -> Optional[str]:
        if not self.repo:
            raise HTTPException(status_code=500, detail="GITHUB_REPO is not configured")

        url = f"{self.base_url}/releases/assets/{asset_id}"
        headers = self.headers.copy()
        headers["Accept"] = "application/octet-stream"

        req = urllib.request.Request(url, headers=headers)
        try:
            class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
                def redirect_request(self, req, fp, code, msg, hdrs, newurl):
                    req.redirect_url = newurl
                    return None

            opener = urllib.request.build_opener(NoRedirectHandler)
            with opener.open(req, timeout=10.0) as response:
                return getattr(req, "redirect_url", response.geturl())
        except Exception:
            try:
                with urllib.request.urlopen(req, timeout=10.0) as response:
                    return response.geturl()
            except Exception:
                return None

    async def get_asset_content(self, asset_id: int) -> str:
        url = await self.get_asset_redirect(asset_id)
        if not url:
            raise HTTPException(status_code=404, detail="Asset not found")

        req = urllib.request.Request(url, headers={"User-Agent": "Radiolite-Backend"})
        try:
            with urllib.request.urlopen(req, timeout=15.0) as response:
                return response.read().decode("utf-8")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch asset content: {str(e)}")
