from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from typing import List, Optional
from datetime import date, timedelta
from jose import JWTError, jwt

from app.core.database import get_db
from app.core.config import settings
from app.models.analytics import DailyStats, DailyStationStats, DailyCountryStats
from app.schemas.analytics import (
    AdminOverviewResponse, 
    StationStatsResponse, 
    CountryStatsResponse, 
    TimeRange
)

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token")

async def get_current_admin(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None or username != settings.ADMIN_USERNAME:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return username

def get_date_range(time_range: TimeRange) -> Optional[date]:
    today = date.today()
    if time_range == TimeRange.LAST_24_HOURS: # Treat as today for simplicity in daily stats
        return today
    elif time_range == TimeRange.LAST_7_DAYS:
        return today - timedelta(days=7)
    elif time_range == TimeRange.LAST_30_DAYS:
        return today - timedelta(days=30)
    return None # ALL_TIME

@router.get("/admin/overview", response_model=AdminOverviewResponse, dependencies=[Depends(get_current_admin)])
async def get_overview(
    range: TimeRange = TimeRange.LAST_7_DAYS, 
    db: AsyncSession = Depends(get_db)
):
    start_date = get_date_range(range)
    
    # Base query filters
    daily_filter = []
    if start_date:
        daily_filter.append(DailyStats.date >= start_date)
        
    # 1. Aggregate App Opens, Unique Users & Total Plays
    stmt = select(
        func.sum(DailyStats.app_opens), 
        func.sum(DailyStats.unique_users),
        func.sum(DailyStats.total_plays)
    )
    if daily_filter:
        stmt = stmt.where(*daily_filter)
        
    result_agg = await db.execute(stmt)
    total_opens, total_uniques, total_plays = result_agg.one()
    
    # 2. Recent Daily Stats (Graph data)
    stmt_recent = select(DailyStats).order_by(desc(DailyStats.date))
    if daily_filter:
        stmt_recent = stmt_recent.where(*daily_filter)
    else:
        stmt_recent = stmt_recent.limit(30) # Default limit if all time
        
    result_recent = await db.execute(stmt_recent)
    recent_stats = result_recent.scalars().all()

    # 3. Top Stations (Aggregate from DailyStationStats)
    stmt_stations = select(
        DailyStationStats.station_id, 
        func.sum(DailyStationStats.play_count).label("total_plays")
    ).group_by(DailyStationStats.station_id).order_by(desc("total_plays"))
    
    if start_date:
        stmt_stations = stmt_stations.where(DailyStationStats.date >= start_date)
        
    result_stations = await db.execute(stmt_stations.limit(20))
    top_stations = [
        StationStatsResponse(station_id=row[0], play_count=row[1]) 
        for row in result_stations.all()
    ]

    # 4. Top Countries
    stmt_countries = select(
        DailyCountryStats.country_code,
        func.sum(DailyCountryStats.open_count).label("total_opens")
    ).group_by(DailyCountryStats.country_code).order_by(desc("total_opens"))
    
    if start_date:
        stmt_countries = stmt_countries.where(DailyCountryStats.date >= start_date)
        
    result_countries = await db.execute(stmt_countries.limit(20))
    top_countries = [
        CountryStatsResponse(country_code=row[0], open_count=row[1])
        for row in result_countries.all()
    ]

    return AdminOverviewResponse(
        total_app_opens=total_opens or 0,
        total_unique_users=total_uniques or 0,
        total_plays=total_plays or 0,
        recent_daily_stats=recent_stats,
        top_stations=top_stations,
        top_countries=top_countries
    )

@router.get("/admin/stations", response_model=List[StationStatsResponse], dependencies=[Depends(get_current_admin)])
async def get_top_stations(
    limit: int = 50, 
    range: TimeRange = TimeRange.ALL_TIME,
    db: AsyncSession = Depends(get_db)
):
    start_date = get_date_range(range)
    
    stmt = select(
        DailyStationStats.station_id, 
        func.sum(DailyStationStats.play_count).label("total_plays")
    ).group_by(DailyStationStats.station_id).order_by(desc("total_plays"))
    
    if start_date:
        stmt = stmt.where(DailyStationStats.date >= start_date)
        
    result = await db.execute(stmt.limit(limit))
    return [
        StationStatsResponse(station_id=row[0], play_count=row[1]) 
        for row in result.all()
    ]
