from typing import Dict, List, Optional
from app.infrastructure.external.github import GitHubAdapter
from app.core.config import settings

class ReleaseService:
    def __init__(self, github_adapter: GitHubAdapter):
        self.github_adapter = github_adapter

    async def get_latest_release(self) -> Dict:
        data = await self.github_adapter.get_latest_release()
        
        # We only return the specific assets the user wants: DMG for Mac, EXE for Windows
        assets = []
        for asset in data.get("assets", []):
            name = asset["name"].lower()
            if name.endswith('.dmg') or name.endswith('.exe'):
                assets.append({
                    "id": asset["id"],
                    "name": asset["name"],
                    "size": asset["size"],
                    "browser_download_url": f"https://api-radiolite.onrender.com{settings.API_V1_STR}/releases/download/{asset['id']}"
                })
        
        return {
            "tag_name": data.get("tag_name"),
            "assets": assets
        }

    async def get_download_url(self, asset_id: int) -> Optional[str]:
        return await self.github_adapter.get_asset_redirect(asset_id)
