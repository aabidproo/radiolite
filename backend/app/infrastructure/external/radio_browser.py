import httpx
from typing import List, Optional, Dict
from app.domain.models import Station, Category
from app.application.interfaces import IRadioRepository
from app.core.config import settings

class RadioBrowserAdapter(IRadioRepository):
    def __init__(self, normalizer):
        self.base_url = settings.RADIO_BROWSER_URL
        self.normalizer = normalizer

    def _sanitize_name(self, name: str) -> str:
        if not name: return ""
        cleaned = name.strip('@*#$%()=!_- .').strip()
        return cleaned or name

    def _map_to_station(self, data: Dict) -> Station:
        # Sanitize and Normalize
        name = self._sanitize_name(data.get('name', ''))
        city, state, country = self.normalizer.normalize(
            data.get('city', ''),
            data.get('state', ''),
            data.get('country', '')
        )
        
        return Station(
            stationuuid=data.get('stationuuid', ''),
            name=name,
            url=data.get('url', ''),
            url_resolved=data.get('url_resolved', data.get('url', '')),
            homepage=data.get('homepage'),
            favicon=data.get('favicon'),
            country=country,
            state=state,
            city=city,
            language=data.get('language', ''),
            tags=[t.strip() for t in data.get('tags', '').split(',') if t.strip()],
            clickcount=data.get('clickcount', 0),
            votes=data.get('votes', 0),
            codec=data.get('codec'),
            bitrate=data.get('bitrate'),
            changeuuid=data.get('changeuuid')
        )

    async def get_top_stations(self, limit: int = 100) -> List[Station]:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(f"{self.base_url}/stations/topvote/{limit}")
                response.raise_for_status()
                data = response.json()
                return [self._map_to_station(s) for s in data]
        except Exception as e:
            print(f"Error in RadioBrowserAdapter.get_top_stations: {e}")
            return []

    async def search_stations(
        self, 
        name: Optional[str] = None, 
        country: Optional[str] = None, 
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
        if language: params["language"] = language
        if tag: params["tag"] = tag

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.get(f"{self.base_url}/stations/search", params=params)
                response.raise_for_status()
                data = response.json()
                return [self._map_to_station(s) for s in data]
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
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                return [Category(name=c['name'], stationcount=c['stationcount']) for c in data if c.get('name')]
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
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                return [Category(name=l['name'], stationcount=l['stationcount']) for l in data if l.get('name')]
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
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                return [Category(name=t['name'], stationcount=t['stationcount']) for t in data if t.get('name')]
        except Exception as e:
            print(f"Error in RadioBrowserAdapter.get_tags: {e}")
            return []

    async def get_summary_stats(self) -> Dict[str, int]:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
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
