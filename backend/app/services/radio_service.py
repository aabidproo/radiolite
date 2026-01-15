import httpx
import cachetools
from app.core.config import settings
from typing import List, Dict

class RadioService:
    def __init__(self):
        self.cache = cachetools.TTLCache(
            maxsize=settings.CACHE_MAX_SIZE, 
            ttl=settings.CACHE_TTL
        )

    async def get_top_stations(self, limit: int = 20) -> List[Dict]:
        cache_key = f"top_{limit}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{settings.RADIO_BROWSER_URL}/stations/topvote/{limit}")
            data = response.json()
            self.cache[cache_key] = data
            return data

    async def search_stations(self, name: str = None, country: str = None, limit: int = 20) -> List[Dict]:
        cache_key = f"search_{name}_{country}_{limit}"
        if cache_key in self.cache:
            return self.cache[cache_key]

        url = f"{settings.RADIO_BROWSER_URL}/stations"
        if name:
            url += f"/byname/{name}"
        elif country:
            url += f"/bycountry/{country}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{url}?limit={limit}")
            data = response.json()
            self.cache[cache_key] = data
            return data

    async def get_countries(self) -> List[Dict]:
        cache_key = "countries"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        async with httpx.AsyncClient() as client:
            # Get countries and filter for those with reasonable number of stations
            response = await client.get(f"{settings.RADIO_BROWSER_URL}/countries")
            data = response.json()
            # Sort by station count descending
            data.sort(key=lambda x: x.get('stationcount', 0), reverse=True)
            self.cache[cache_key] = data
            return data

radio_service = RadioService()
