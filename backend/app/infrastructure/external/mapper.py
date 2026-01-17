from typing import List, Dict
from app.domain.models import Station, Category

class RadioBrowserMapper:
    def __init__(self, normalizer):
        self.normalizer = normalizer

    def _sanitize_name(self, name: str) -> str:
        if not name: return ""
        cleaned = name.strip('@*#$%()=!_- .').strip()
        return cleaned or name

    def map_to_station(self, data: Dict) -> Station:
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
            countrycode=data.get("countrycode", ""),
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

    def map_to_category(self, data: Dict) -> Category:
        return Category(
            name=data.get('name', ''),
            stationcount=data.get('stationcount', 0)
        )
