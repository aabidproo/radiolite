from typing import Dict, List, Optional
from app.infrastructure.external.github import GitHubAdapter
from app.core.config import settings


# Asset name patterns -> Tauri platform key mapping
PLATFORM_PATTERNS = {
    # macOS
    "aarch64.app.tar.gz": "darwin-aarch64",
    "x64.app.tar.gz": "darwin-x86_64",
    # Windows
    "x64-setup.exe": "windows-x86_64",
    "x64_en-US.msi": "windows-x86_64",
    # Linux
    "amd64.AppImage": "linux-x86_64",
    "x86_64.AppImage": "linux-x86_64",
}

# Signature file patterns -> platform key (Tauri v2 requires .sig files)
SIG_PATTERNS = {
    "aarch64.app.tar.gz.sig": "darwin-aarch64",
    "x64.app.tar.gz.sig": "darwin-x86_64",
    "x64-setup.exe.sig": "windows-x86_64",
    "x64_en-US.msi.sig": "windows-x86_64",
    "amd64.AppImage.sig": "linux-x86_64",
    "x86_64.AppImage.sig": "linux-x86_64",
}


def _normalize_version(tag_name: str) -> str:
    """Strip all leading v's, return clean semver like '1.2.0'."""
    return tag_name.lstrip("v").strip()


class ReleaseService:
    def __init__(self, github_adapter: GitHubAdapter):
        self.github_adapter = github_adapter

    async def get_latest_release(self) -> Dict:
        data = await self.github_adapter.get_latest_release()
        tag_name = data.get("tag_name", "")
        version = _normalize_version(tag_name)
        pub_date = data.get("published_at") or data.get("created_at")
        notes = data.get("body") or "New version available"
        assets = data.get("assets", [])

        # --- Try to load a pre-built latest.json (preferred) ---
        latest_json_asset = next(
            (a for a in assets if a["name"] == "latest.json"), None
        )
        if latest_json_asset:
            try:
                import json
                content = await self.github_adapter.get_asset_content(latest_json_asset["id"])
                tauri_data = json.loads(content)
                # Inject legacy fields for the website download section
                tauri_data["tag_name"] = f"v{version}"
                tauri_data["assets"] = self._get_download_assets(assets)
                tauri_data["html_url"] = data.get("html_url", "")
                return tauri_data
            except Exception as e:
                print(f"[releases] Failed to parse latest.json from GitHub: {e}")

        # --- Build a manifest from individual .sig + asset files ---
        # Collect signature files indexed by platform
        sig_map: Dict[str, str] = {}  # platform -> signature text
        sig_url_map: Dict[str, str] = {}  # platform -> asset download URL

        for asset in assets:
            name = asset["name"]
            for pattern, platform in SIG_PATTERNS.items():
                if name.endswith(pattern):
                    try:
                        content = await self.github_adapter.get_asset_content(asset["id"])
                        sig_map[platform] = content.strip()
                    except Exception:
                        pass

        # Collect updatable binary URLs by platform
        bin_url_map: Dict[str, str] = {}
        for asset in assets:
            name = asset["name"]
            for pattern, platform in PLATFORM_PATTERNS.items():
                if name.endswith(pattern) and not name.endswith(".sig"):
                    bin_url_map[platform] = asset["browser_download_url"]

        # Build platforms section (only include platforms with both binary + sig)
        platforms: Dict[str, Dict] = {}
        for platform, url in bin_url_map.items():
            if platform in sig_map:
                platforms[platform] = {
                    "signature": sig_map[platform],
                    "url": url,
                }

        # --- Response ---
        # If we have a valid platforms map (sig files exist), return full Tauri v2 manifest.
        # If not (no .sig files uploaded), return a manifest with empty platforms so Tauri
        # won't auto-install — but include version + html_url so the frontend can show a
        # "new version available, click to download" notification.
        return {
            # Tauri v2 updater fields
            "version": version,
            "notes": notes,
            "pub_date": pub_date,
            "platforms": platforms,  # empty dict = Tauri sees no auto-update available
            # Extra fields used by our custom frontend updater UI
            "tag_name": f"v{version}",
            "html_url": data.get("html_url", f"https://github.com/aabidproo/radiolite/releases/tag/v{version}"),
            "has_signature": len(platforms) > 0,
            "assets": self._get_download_assets(assets),
        }

    def _get_download_assets(self, assets: List[Dict]) -> List[Dict]:
        """Return installer download links for the website UI."""
        result = []
        for asset in assets:
            name = asset["name"].lower()
            if any(name.endswith(ext) for ext in (".dmg", ".exe", ".msi", ".appimage")):
                result.append({
                    "id": asset["id"],
                    "name": asset["name"],
                    "size": asset["size"],
                    "browser_download_url": asset["browser_download_url"],
                })
        return result

    async def get_download_url(self, asset_id: int) -> Optional[str]:
        return await self.github_adapter.get_asset_redirect(asset_id)
