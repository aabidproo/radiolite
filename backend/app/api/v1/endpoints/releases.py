from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
import httpx
from app.core.config import settings

router = APIRouter()

@router.get("/latest")
async def get_latest_release():
    if not settings.GITHUB_TOKEN or not settings.GITHUB_REPO:
        raise HTTPException(status_code=500, detail="GitHub configuration missing")
    
    url = f"https://api.github.com/repos/{settings.GITHUB_REPO}/releases/latest"
    headers = {
        "Authorization": f"token {settings.GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch from GitHub")
        
        data = response.json()
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

@router.get("/download/{asset_id}")
async def download_asset(asset_id: int):
    if not settings.GITHUB_TOKEN or not settings.GITHUB_REPO:
        raise HTTPException(status_code=500, detail="GitHub configuration missing")
    
    # GitHub requires 'Accept: application/octet-stream' to download binary assets
    url = f"https://api.github.com/repos/{settings.GITHUB_REPO}/releases/assets/{asset_id}"
    headers = {
        "Authorization": f"token {settings.GITHUB_TOKEN}",
        "Accept": "application/octet-stream"
    }
    
    async with httpx.AsyncClient(follow_redirects=False) as client:
        response = await client.get(url, headers=headers)
        
        # GitHub returns a 302 redirect to the actual binary (usually on S3)
        if response.status_code == 302:
            download_url = response.headers.get("Location")
            return RedirectResponse(url=download_url)
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to initiate download from GitHub")
        
        # If no redirect, fallback to a direct redirect to browser_download_url if possible
        # or just return the current response (though 302 is expected)
        raise HTTPException(status_code=400, detail="Unable to resolve download redirect")
