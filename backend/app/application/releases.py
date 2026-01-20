from typing import Dict, List, Optional
from app.infrastructure.external.github import GitHubAdapter
from app.core.config import settings

class ReleaseService:
    def __init__(self, github_adapter: GitHubAdapter):
        self.github_adapter = github_adapter

    async def get_latest_release(self) -> Dict:
        data = await self.github_adapter.get_latest_release()
        tag_name = data.get("tag_name", "")
        
        # Normalize version (remove all leading v's then add exactly one)
        clean_version = tag_name.lstrip('v')
        display_version = f"v{clean_version}"

        # Check if there's a latest.json (Tauri v2 updater format)
        latest_json_asset = next((a for a in data.get("assets", []) if a["name"] == "latest.json"), None)
        
        if latest_json_asset:
            try:
                import json
                content = await self.github_adapter.get_asset_content(latest_json_asset["id"])
                tauri_data = json.loads(content)
                # Keep our custom metadata for the landing page
                tauri_data.update({
                    "tag_name": display_version,
                    "assets": self._get_legacy_assets(data)
                })
                return tauri_data
            except Exception as e:
                print(f"Failed to parse latest.json: {e}")

        # Fallback: Construct a valid Tauri v2 JSON if latest.json is missing
        return {
            "version": display_version,
            "notes": data.get("body", "New version available"),
            "pub_date": data.get("published_at"),
            "platforms": {}, # Tauri will see No Updates if this is empty but valid
            "tag_name": display_version, # Legacy support
            "assets": self._get_legacy_assets(data) # Legacy support
        }

    def _get_legacy_assets(self, data: Dict) -> List[Dict]:
        assets = []
        for asset in data.get("assets", []):
            name = asset["name"].lower()
            if name.endswith('.dmg') or name.endswith('.exe') or name.endswith('.msi'):
                assets.append({
                    "id": asset["id"],
                    "name": asset["name"],
                    "size": asset["size"],
                    "browser_download_url": f"https://radiolite.onrender.com{settings.API_V1_STR}/releases/download/{asset['id']}"
                })
        return assets

    async def get_download_url(self, asset_id: int) -> Optional[str]:
        return await self.github_adapter.get_asset_redirect(asset_id)
