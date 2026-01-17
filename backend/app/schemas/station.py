from pydantic import BaseModel
from typing import Optional

class StationBase(BaseModel):
    stationuuid: str
    name: str
    url: str
    url_resolved: Optional[str] = None
    favicon: Optional[str] = None
    country: Optional[str] = None
    countrycode: Optional[str] = None
    language: Optional[str] = None
    codec: Optional[str] = None
    bitrate: Optional[int] = None
    state: Optional[str] = None
    city: Optional[str] = None
    geo_lat: Optional[float] = None
    geo_long: Optional[float] = None

class Station(StationBase):
    pass
