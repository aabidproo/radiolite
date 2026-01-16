import httpx
import os
from diskcache import Cache
from app.core.config import settings
from typing import List, Dict

class LocationNormalizer:
    STATE_MAP = {
        'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
        'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
        'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
        'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
        'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
        'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
        'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
        'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
        'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
        'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
        'DC': 'District of Columbia'
    }

    GLOBAL_ALIASES = {
        'Panjab': 'Punjab',
        'Rajashtan': 'Rajasthan',
        'Nyc': 'New York',
        'New York City': 'New York',
        'Ny City': 'New York',
        'Calfornia': 'California',
        'Colarado': 'Colorado',
    }

    @classmethod
    def normalize(cls, city: str, state: str, country: str) -> tuple:
        # 1. Basic cleaning and title casing
        city = (city or "").strip().strip(',. ').title()
        state = (state or "").strip().strip(',. ').title()
        country = (country or "").strip().strip(',. ').title()

        # 2. Map aliases and common misspellings
        if city in cls.GLOBAL_ALIASES:
            city = cls.GLOBAL_ALIASES[city]
        if state in cls.GLOBAL_ALIASES:
            state = cls.GLOBAL_ALIASES[state]

        # 3. Map abbreviations to full names (for US and others)
        if state.upper() in cls.STATE_MAP:
            state = cls.STATE_MAP[state.upper()]
        
        # 4. Handle city names that contain redundant state/region info
        # e.g., "Los Angeles, California" -> "Los Angeles"
        # We loop through all known states/regions to strip them from city names
        all_regions = list(cls.STATE_MAP.values()) + list(cls.STATE_MAP.keys())
        for region in all_regions:
            prefixes = [f"{region} ", f"{region}, "]
            suffixes = [f" {region}", f", {region}"]
            
            # Case-insensitive stripping
            for p in prefixes:
                if city.lower().startswith(p.lower()):
                    city = city[len(p):].strip().strip(',. ')
            for s in suffixes:
                if city.lower().endswith(s.lower()):
                    city = city[:city.lower().rfind(s.lower())].strip().strip(',. ')

        # 5. Handle state field containing City info (common in this API)
        if ',' in state:
            state_parts = [p.strip() for p in state.split(',')]
            if len(state_parts) >= 2:
                if not city or city.lower() in [p.lower() for p in state_parts]:
                    # Heuristic: First part is usually more specific (City)
                    potential_city = state_parts[0].title()
                    potential_state = state_parts[1].title()
                    if potential_state.upper() in cls.STATE_MAP:
                        potential_state = cls.STATE_MAP[potential_state.upper()]
                    city = potential_city
                    state = potential_state

        # 6. Redundancy check: If city and state are the same, or one is inside the other
        if city.lower() == state.lower() or (city and state and city.lower() in state.lower()):
            state = "" # Consolidate to city
        elif state and city and state.lower() in city.lower():
            city = state # Consolidate to state/region
        
        # 7. Final Aliases Check (in case normalization revealed new target)
        if city in cls.GLOBAL_ALIASES: city = cls.GLOBAL_ALIASES[city]
        if state in cls.GLOBAL_ALIASES: state = cls.GLOBAL_ALIASES[state]

        # 8. Force Title Case and final cleanup
        city = city.title().strip().strip(',. ')
        state = state.title().strip().strip(',. ')
        country = country.title().strip().strip(',. ')
        
        return city or "", state or "", country or ""

class RadioService:
    def __init__(self):
        # Persistent disk cache in the project root
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        cache_dir = os.path.join(project_root, ".cache")
        self.cache = Cache(cache_dir)
        self.normalizer = LocationNormalizer()

    def flush_cache(self):
        self.cache.clear()
        return True

    def _sanitize_name(self, name: str) -> str:
        if not name:
            return ""
        # Remove a wide range of messy leading/trailing characters and extra whitespace
        # Target: @ * # $ % ( ) = ! _ - .
        cleaned = name.strip('@*#$%()=!_- .').strip()
        return cleaned or name
    
    def _normalize_station(self, station: Dict) -> Dict:
        # Sanitize name
        station['name'] = self._sanitize_name(station.get('name', ''))
        
        # Normalize location
        city, state, country = self.normalizer.normalize(
            station.get('city', ''),
            station.get('state', ''),
            station.get('country', '')
        )
        station['city'] = city
        station['state'] = state
        station['country'] = country
        return station

    async def get_top_stations(self, limit: int = 100) -> List[Dict]:
        cache_key = f"top_{limit}"
        cached = self.cache.get(cache_key)
        if cached:
            return cached
        
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{settings.RADIO_BROWSER_URL}/stations/topvote/{limit}")
            data = response.json()
            # Clean and normalize stations
            for i in range(len(data)):
                data[i] = self._normalize_station(data[i])
            self.cache.set(cache_key, data, expire=settings.CACHE_TTL)
            return data

    async def search_stations(
        self, 
        name: str = None, 
        country: str = None, 
        language: str = None,
        tag: str = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict]:
        cache_key = f"search_{name}_{country}_{language}_{tag}_{limit}_{offset}"
        cached = self.cache.get(cache_key)
        if cached:
            return cached

        # Use the robust search endpoint which handles filters better
        url = f"{settings.RADIO_BROWSER_URL}/stations/search"
        params = {
            "limit": limit,
            "offset": offset,
            "hidebroken": "true",
            "order": "clickcount",
            "reverse": "true"
        }
        
        if name: params["name"] = name
        if country:
            # Normalize country for USA to match API standard name
            if country.lower() in ["usa", "the united states of america", "united states of america", "united states", "us"]:
                country = "The United States Of America"
            params["country"] = country
        if language: params["language"] = language
        if tag: params["tag"] = tag
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            data = response.json()

            # Robustness: If category browse returns 0 results, try lowercase as fallback
            # Some entries in the API are stored in lowercase even if they appear title-cased in the category list
            if not data and not name and (language or tag):
                if language: params["language"] = language.lower()
                if tag: params["tag"] = tag.lower()
                response = await client.get(url, params=params)
                data = response.json()

            # Clean and normalize stations
            for i in range(len(data)):
                data[i] = self._normalize_station(data[i])
            
            # Cache for a longer duration (24h) if it's a category browse, otherwise default TTL
            # IMPORTANT: Only cache if we actually found results
            if data:
                expire = 86400 if (country or language or tag) and not name else settings.CACHE_TTL
                self.cache.set(cache_key, data, expire=expire)
            
            return data

    async def get_countries(self) -> List[Dict]:
        cache_key = "countries"
        cached = self.cache.get(cache_key)
        if cached:
            return cached
        
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{settings.RADIO_BROWSER_URL}/countries")
            data = response.json()
            
            # Clean and merge
            merged = {}
            for item in data:
                name = item.get('name', '').strip().strip('/. ').title()
                if not name: continue
                
                count = item.get('stationcount', 0)
                if name in merged:
                    merged[name]['stationcount'] += count
                else:
                    item['name'] = name
                    merged[name] = item
            
            clean_data = list(merged.values())
            clean_data.sort(key=lambda x: x.get('stationcount', 0), reverse=True)
            # Countries change slowly, cache for 1 week
            self.cache.set(cache_key, clean_data, expire=604800)
            return clean_data

    async def get_languages(self) -> List[Dict]:
        cache_key = "languages"
        cached = self.cache.get(cache_key)
        if cached:
            return cached
        
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{settings.RADIO_BROWSER_URL}/languages")
            data = response.json()
            
            # Clean and merge
            merged = {}
            for item in data:
                name = item.get('name', '').strip().strip('/. ').title()
                if not name: continue
                
                count = item.get('stationcount', 0)
                if name in merged:
                    merged[name]['stationcount'] += count
                else:
                    item['name'] = name
                    merged[name] = item
            
            clean_data = list(merged.values())
            clean_data.sort(key=lambda x: x.get('stationcount', 0), reverse=True)
            # Take top 150 languages after cleaning
            clean_data = clean_data[:150]
            # Cache for 1 week
            self.cache.set(cache_key, clean_data, expire=604800)
            return clean_data

    async def get_tags(self) -> List[Dict]:
        cache_key = "tags"
        cached = self.cache.get(cache_key)
        if cached:
            return cached
        
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{settings.RADIO_BROWSER_URL}/tags")
            data = response.json()
            
            # Clean and merge
            merged = {}
            for item in data:
                name = item.get('name', '').strip().strip('/. ').title()
                if not name: continue
                
                count = item.get('stationcount', 0)
                if name in merged:
                    merged[name]['stationcount'] += count
                else:
                    item['name'] = name
                    merged[name] = item
            
            clean_data = list(merged.values())
            clean_data.sort(key=lambda x: x.get('stationcount', 0), reverse=True)
            # Take top 150 tags after cleaning
            clean_data = clean_data[:150]
            # Cache for 1 week
            self.cache.set(cache_key, clean_data, expire=604800)
            return clean_data

radio_service = RadioService()
