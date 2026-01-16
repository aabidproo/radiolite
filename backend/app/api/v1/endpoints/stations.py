from fastapi import APIRouter, Query
from typing import List
from app.schemas.station import Station
from app.domain.models import Category, SummaryStats
from app.dependencies import get_station_service

station_service = get_station_service()

router = APIRouter()

@router.get("/stats", response_model=SummaryStats)
async def get_stats():
    return await station_service.get_summary_stats()

@router.get("/top", response_model=List[Station])
async def get_top_stations(limit: int = 100):
    return await station_service.get_top_stations(limit)

@router.get("/search", response_model=List[Station])
async def search_stations(
    name: str = Query(None), 
    country: str = Query(None), 
    language: str = Query(None),
    tag: str = Query(None),
    limit: int = 100,
    offset: int = 0
):
    return await station_service.search_stations(name, country, language, tag, limit, offset)

@router.get("/countries", response_model=List[Category])
async def get_countries(limit: int = 24, offset: int = 0, name: str = None):
    return await station_service.get_countries(limit, offset, name)

@router.get("/languages", response_model=List[Category])
async def get_languages(limit: int = 24, offset: int = 0, name: str = None):
    return await station_service.get_languages(limit, offset, name)

@router.get("/tags", response_model=List[Category])
async def get_tags(limit: int = 24, offset: int = 0, name: str = None):
    return await station_service.get_tags(limit, offset, name)

@router.get("/global-search")
async def search_global(query: str):
    return await station_service.search_global(query)

@router.post("/cache/flush")
async def flush_cache():
    station_service.flush_cache()
    return {"status": "success", "message": "Cache flushed"}
