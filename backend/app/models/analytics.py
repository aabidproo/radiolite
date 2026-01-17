from sqlalchemy import Column, Integer, String, Date
from app.core.database import Base

class DailyStats(Base):
    __tablename__ = "daily_stats"

    date = Column(Date, primary_key=True)
    app_opens = Column(Integer, default=0)
    total_plays = Column(Integer, default=0)

class DailyStationStats(Base):
    __tablename__ = "daily_station_stats"

    date = Column(Date, primary_key=True)
    station_id = Column(String, primary_key=True)
    play_count = Column(Integer, default=0)

class DailyCountryStats(Base):
    __tablename__ = "daily_country_stats"

    date = Column(Date, primary_key=True)
    country_code = Column(String, primary_key=True)
    open_count = Column(Integer, default=0)
