import asyncio
from typing import List, Optional
from app.domain.models import Station, Category, GlobalSearchResult, SummaryStats
from app.application.interfaces import IRadioRepository, ICacheRepository
from app.core.config import settings
from app.core.curated import CURATED_STATIONS

class StationService:
    def __init__(self, radio_repo: IRadioRepository, cache_repo: ICacheRepository):
        self.radio_repo = radio_repo
        self.cache_repo = cache_repo

    async def get_featured_stations(self, region: str) -> List[Station]:
        cache_key = f"featured_{region.lower().replace(' ', '_')}"
        cached = self.cache_repo.get(cache_key)
        if cached:
            return [Station(**s) for s in cached]

        curated_list = CURATED_STATIONS.get(region, [])
        if not curated_list:
            return []

        # Fetch all in parallel
        tasks = [
            self.radio_repo.search_stations(name=s["name"], countrycode=s.get("countryCode"), limit=1)
            for s in curated_list
        ]
        
        results = await asyncio.gather(*tasks)
        
        stations = []
        for res in results:
            if res:
                stations.append(res[0])

        if stations:
            self.cache_repo.set(cache_key, [s.dict() for s in stations], expire=settings.CACHE_TTL)
        
        return stations

    async def get_top_stations(self, limit: int = 100) -> List[Station]:
        cache_key = f"top_{limit}_v2"
        cached = self.cache_repo.get(cache_key)
        if cached: return [Station(**s) for s in cached]
        
        stations = await self.radio_repo.get_top_stations(limit)
        if stations:
            self.cache_repo.set(cache_key, [s.dict() for s in stations], expire=settings.CACHE_TTL)
        return stations

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
        # We don't cache individual searches to avoid cache bloat, 
        # but categories are cached in their respective repo/adapter logic if needed.
        # However, for consistency with old behavior, we might cache browse-by-category.
        is_category_browse = (country or language or tag or countrycode) and not name
        cache_key = f"browse_{country}_{countrycode}_{language}_{tag}_{limit}_{offset}" if is_category_browse else None
        
        if cache_key:
            cached = self.cache_repo.get(cache_key)
            if cached: return [Station(**s) for s in cached]

        stations = await self.radio_repo.search_stations(name, country, countrycode, language, tag, limit, offset)
        
        if cache_key and stations:
            self.cache_repo.set(cache_key, [s.dict() for s in stations], expire=86400) # 24h for browse
            
        return stations

    async def get_countries(self, limit: int = 24, offset: int = 0, name: str = None) -> List[Category]:
        cache_key = f"countries_{limit}_{offset}_{name or 'all'}"
        cached = self.cache_repo.get(cache_key)
        
        if cached:
            return [Category(**c) for c in cached]

        countries = await self.radio_repo.get_countries(limit=limit, offset=offset, name=name)
        if countries:
            self.cache_repo.set(cache_key, [c.dict() for c in countries], expire=86400) # 24h
            
        return countries

    async def get_languages(self, limit: int = 24, offset: int = 0, name: str = None) -> List[Category]:
        cache_key = f"languages_{limit}_{offset}_{name or 'all'}"
        cached = self.cache_repo.get(cache_key)
        
        if cached:
            return [Category(**l) for l in cached]

        languages = await self.radio_repo.get_languages(limit=limit, offset=offset, name=name)
        if languages:
            self.cache_repo.set(cache_key, [l.dict() for l in languages], expire=86400)
            
        return languages

    async def get_tags(self, limit: int = 24, offset: int = 0, name: str = None) -> List[Category]:
        cache_key = f"tags_{limit}_{offset}_{name or 'all'}"
        cached = self.cache_repo.get(cache_key)
        
        if cached:
            return [Category(**t) for t in cached]

        tags = await self.radio_repo.get_tags(limit=limit, offset=offset, name=name)
        if tags:
            self.cache_repo.set(cache_key, [t.dict() for t in tags], expire=86400)
            
        return tags

    async def search_global(self, query: str) -> GlobalSearchResult:
        if not query or len(query) < 2:
            return GlobalSearchResult(countries=[], languages=[], tags=[], stations=[])

        # Execute searches in parallel
        countries_task = self.get_countries(limit=4, name=query)
        languages_task = self.get_languages(limit=4, name=query)
        tags_task = self.get_tags(limit=4, name=query)
        stations_task = self.search_stations(name=query, limit=20)

        countries, languages, tags, stations = await asyncio.gather(
            countries_task, languages_task, tags_task, stations_task
        )

        return GlobalSearchResult(
            countries=countries,
            languages=languages,
            tags=tags,
            stations=stations
        )

    async def get_summary_stats(self) -> SummaryStats:
        cache_key = "summary_stats"
        cached = self.cache_repo.get(cache_key)
        if cached: return SummaryStats(**cached)

        stats = await self.radio_repo.get_summary_stats()
        if stats:
            self.cache_repo.set(cache_key, stats, expire=settings.CACHE_TTL)
        return SummaryStats(**stats)

    def flush_cache(self):
        self.cache_repo.clear()
