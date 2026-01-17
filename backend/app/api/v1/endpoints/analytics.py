from fastapi import APIRouter, Depends, Request, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date
from typing import Optional

from app.core.database import get_db
from app.models.analytics import DailyStats, DailyStationStats, DailyCountryStats
from app.schemas.analytics import StationPlayRequest, AppOpenRequest

router = APIRouter()

async def increment_app_open(country_code: str, db: AsyncSession):
    today = date.today()
    
    # 1. Update DailyStats (Aggregate)
    result = await db.execute(select(DailyStats).where(DailyStats.date == today))
    daily_stats = result.scalar_one_or_none()

    if daily_stats:
        daily_stats.app_opens += 1
    else:
        daily_stats = DailyStats(date=today, app_opens=1, total_plays=0)
        db.add(daily_stats)
    
    # 2. Update DailyCountryStats
    result_country = await db.execute(
        select(DailyCountryStats).where(
            (DailyCountryStats.date == today) & 
            (DailyCountryStats.country_code == country_code)
        )
    )
    country_stats = result_country.scalar_one_or_none()
    
    if country_stats:
        country_stats.open_count += 1
    else:
        country_stats = DailyCountryStats(date=today, country_code=country_code, open_count=1)
        db.add(country_stats)
    
    await db.commit()

async def increment_station_play(station_id: str, db: AsyncSession):
    today = date.today()
    
    # 1. Update DailyStats (Aggregate)
    result = await db.execute(select(DailyStats).where(DailyStats.date == today))
    daily_stats = result.scalar_one_or_none()
    
    if daily_stats:
        daily_stats.total_plays += 1
    else:
        daily_stats = DailyStats(date=today, app_opens=0, total_plays=1)
        db.add(daily_stats)

    # 2. Update DailyStationStats (Time Series)
    result_station = await db.execute(
        select(DailyStationStats).where(
            (DailyStationStats.date == today) & 
            (DailyStationStats.station_id == station_id)
        )
    )
    station_stats = result_station.scalar_one_or_none()
    
    if station_stats:
        station_stats.play_count += 1
    else:
        station_stats = DailyStationStats(date=today, station_id=station_id, play_count=1)
        db.add(station_stats)

    await db.commit()

@router.post("/track/app-open", status_code=202)
async def track_app_open(
    request: Request,
    payload: Optional[AppOpenRequest] = Body(default=None), 
    db: AsyncSession = Depends(get_db)
):
    """
    Track when the application is opened.
    Resolves country from CF-IPCountry header or payload.
    """
    country = "Unknown"
    
    # Priority 1: Payload param
    if payload and payload.country_code and payload.country_code != "Unknown":
        country = payload.country_code
    # Priority 2: Header (Cloudflare/Render)
    elif request.headers.get("cf-ipcountry"):
        country = request.headers.get("cf-ipcountry")
    
    await increment_app_open(country, db)
    return {"status": "ok"}

@router.post("/track/station-play", status_code=202)
async def track_station_play(
    request: StationPlayRequest, 
    db: AsyncSession = Depends(get_db)
):
    """
    Track when a station is played.
    """
    await increment_station_play(request.station_id, db)
    return {"status": "ok"}
