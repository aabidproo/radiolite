from pydantic import BaseModel
from typing import List, Optional

class Station(BaseModel):
    stationuuid: str
    name: str
    url: str
    url_resolved: str
    homepage: Optional[str] = None
    favicon: Optional[str] = None
    country: str
    countrycode: Optional[str] = None
    state: str
    city: str
    language: str
    tags: List[str]
    clickcount: int
    votes: int
    codec: Optional[str] = None
    bitrate: Optional[int] = None
    changeuuid: Optional[str] = None

class Category(BaseModel):
    name: str
    stationcount: int

class SummaryStats(BaseModel):
    countries: int
    languages: int
    tags: int
    stations: int

class GlobalSearchResult(BaseModel):
    countries: List[Category]
    languages: List[Category]
    tags: List[Category]
    stations: List[Station]
    locations: List[Station] = []
