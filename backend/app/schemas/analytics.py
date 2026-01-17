from pydantic import BaseModel
from datetime import date
from typing import List, Optional
from enum import Enum

class TimeRange(str, Enum):
    LAST_24_HOURS = "1d"
    LAST_7_DAYS = "7d"
    LAST_30_DAYS = "30d"
    ALL_TIME = "all"

class StationPlayRequest(BaseModel):
    station_id: str

class AppOpenRequest(BaseModel):
    country_code: Optional[str] = "Unknown"

class DailyStatsResponse(BaseModel):
    date: date
    app_opens: int
    total_plays: int

    class Config:
        from_attributes = True

class StationStatsResponse(BaseModel):
    station_id: str
    play_count: int

    class Config:
        from_attributes = True

class CountryStatsResponse(BaseModel):
    country_code: str
    open_count: int

    class Config:
        from_attributes = True

class AdminOverviewResponse(BaseModel):
    total_app_opens: int
    total_plays: int
    recent_daily_stats: List[DailyStatsResponse]
    top_stations: List[StationStatsResponse]
    top_countries: List[CountryStatsResponse]
