from fastapi import APIRouter, HTTPException, Header
from fastapi.responses import StreamingResponse
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
        # We modify the asset list to point to our proxy instead of GitHub directly
        assets = []
        for asset in data.get("assets", []):
            assets.append({
                "id": asset["id"],
                "name": asset["name"],
                "size": asset["size"],
                "browser_download_url": f"{settings.API_V1_STR}/releases/download/{asset['id']}"
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
    
    async with httpx.AsyncClient(follow_redirects=True) as client:
        # We use a streaming response to relay the file from GitHub to the user
        req = client.build_request("GET", url, headers=headers)
        response = await client.send(req, stream=True)
        
        if response.status_code != 200:
            await response.aclose()
            raise HTTPException(status_code=response.status_code, detail="Failed to download asset from GitHub")
        
        return StreamingResponse(
            response.aiter_bytes(),
            media_type=response.headers.get("content-type", "application/octet-stream"),
            headers={
                "Content-Disposition": response.headers.get("content-disposition", f"attachment; filename=asset_{asset_id}")
            }
        )
