from fastapi import APIRouter, Query
from typing import List
from app.schemas.station import Station
from app.services.radio_service import radio_service

router = APIRouter()

@router.get("/top", response_model=List[Station])
async def get_top_stations(limit: int = 100):
    return await radio_service.get_top_stations(limit)

@router.get("/search", response_model=List[Station])
async def search_stations(
    name: str = Query(None), 
    country: str = Query(None), 
    language: str = Query(None),
    tag: str = Query(None),
    limit: int = 100,
    offset: int = 0
):
    return await radio_service.search_stations(name, country, language, tag, limit, offset)

@router.get("/countries", response_model=List[dict])
async def get_countries():
    return await radio_service.get_countries()

@router.get("/languages", response_model=List[dict])
async def get_languages():
    return await radio_service.get_languages()

@router.get("/tags", response_model=List[dict])
async def get_tags():
    return await radio_service.get_tags()
@router.post("/cache/flush")
async def flush_cache():
    radio_service.flush_cache()
    return {"status": "success", "message": "Cache flushed"}
