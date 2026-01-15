from fastapi import APIRouter, Query
from typing import List
from app.schemas.station import Station
from app.services.radio_service import radio_service

router = APIRouter()

@router.get("/top", response_model=List[Station])
async def get_top_stations(limit: int = 20):
    return await radio_service.get_top_stations(limit)

@router.get("/search", response_model=List[Station])
async def search_stations(
    name: str = Query(None), 
    country: str = Query(None), 
    limit: int = 20
):
    return await radio_service.search_stations(name, country, limit)

@router.get("/countries", response_model=List[dict])
async def get_countries():
    return await radio_service.get_countries()
