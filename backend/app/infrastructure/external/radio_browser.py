import httpx
from typing import List, Optional, Dict
from app.domain.models import Station, Category
from app.application.interfaces import IRadioRepository
from app.core.config import settings

from app.infrastructure.external.mapper import RadioBrowserMapper

class RadioBrowserAdapter(IRadioRepository):
    def __init__(self, mapper: RadioBrowserMapper):
        self.base_url = settings.RADIO_BROWSER_URL
        self.mapper = mapper

    async def get_top_stations(self, limit: int = 100) -> List[Station]:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(f"{self.base_url}/stations/topvote/{limit}")
                response.raise_for_status()
                data = response.json()
                return [self.mapper.map_to_station(s) for s in data]
        except Exception as e:
            print(f"Error in RadioBrowserAdapter.get_top_stations: {e}")
            return []

    async def search_stations(
        self, 
        name: Optional[str] = None, 
        country: Optional[str] = None, 
        countrycode: Optional[str] = None,
        language: Optional[str] = None,
        tag: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Station]:
        params = {
            "limit": limit,
            "offset": offset,
            "hidebroken": "true",
            "order": "clickcount",
            "reverse": "true"
        }
        if name: params["name"] = name
        if country: 
            params["country"] = country
            params["countryexact"] = "true"
        if countrycode:
            params["countrycode"] = countrycode
        if language: params["language"] = language
        if tag: params["tag"] = tag

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(f"{self.base_url}/stations/search", params=params)
                response.raise_for_status()
                data = response.json()
                return [self.mapper.map_to_station(s) for s in data]
        except Exception as e:
            print(f"Error in RadioBrowserAdapter.search_stations: {e}")
            return []

    async def get_countries(self, limit: int = 100, offset: int = 0, name: Optional[str] = None) -> List[Category]:
        params = {
            "limit": limit,
            "offset": offset,
            "order": "stationcount",
            "reverse": "true",
            "hidebroken": "true"
        }
        url = f"{self.base_url}/countries"
        if name:
            url += f"/{name}"

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                return [self.mapper.map_to_category(c) for c in data if c.get('name')]
        except Exception as e:
            print(f"Error in RadioBrowserAdapter.get_countries: {e}")
            return []

    async def get_languages(self, limit: int = 100, offset: int = 0, name: Optional[str] = None) -> List[Category]:
        params = {
            "limit": limit,
            "offset": offset,
            "order": "stationcount",
            "reverse": "true",
            "hidebroken": "true"
        }
        url = f"{self.base_url}/languages"
        if name:
            url += f"/{name}"

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                return [self.mapper.map_to_category(l) for l in data if l.get('name')]
        except Exception as e:
            print(f"Error in RadioBrowserAdapter.get_languages: {e}")
            return []

    async def get_tags(self, limit: int = 100, offset: int = 0, name: Optional[str] = None) -> List[Category]:
        params = {
            "limit": limit,
            "offset": offset,
            "order": "stationcount",
            "reverse": "true",
            "hidebroken": "true"
        }
        url = f"{self.base_url}/tags"
        if name:
            url += f"/{name}"

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                return [self.mapper.map_to_category(t) for t in data if t.get('name')]
        except Exception as e:
            print(f"Error in RadioBrowserAdapter.get_tags: {e}")
            return []

    async def get_summary_stats(self) -> Dict[str, int]:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(f"{self.base_url}/stats")
                response.raise_for_status()
                data = response.json()
                return {
                    "countries": data.get("countries", 0),
                    "languages": data.get("languages", 0),
                    "tags": data.get("tags", 0),
                    "stations": data.get("stations", 0)
                }
        except Exception as e:
            print(f"Error in RadioBrowserAdapter.get_summary_stats: {e}")
            return {"countries": 0, "languages": 0, "tags": 0, "stations": 0}
