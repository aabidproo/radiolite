from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from app.dependencies import get_release_service

router = APIRouter()
release_service = get_release_service()

@router.get("/latest")
async def get_latest_release():
    return await release_service.get_latest_release()

@router.get("/download/{asset_id}")
async def download_asset(asset_id: int):
    download_url = await release_service.get_download_url(asset_id)
    if download_url:
        return RedirectResponse(url=download_url)
    
    raise HTTPException(status_code=400, detail="Unable to resolve download redirect")

