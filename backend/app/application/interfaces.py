from abc import ABC, abstractmethod
from typing import List, Optional, Dict
from app.domain.models import Station, Category

class IRadioRepository(ABC):
    @abstractmethod
    async def get_top_stations(self, limit: int = 100) -> List[Station]:
        pass

    @abstractmethod
    async def search_stations(
        self, 
        name: Optional[str] = None, 
        country: Optional[str] = None, 
        language: Optional[str] = None,
        tag: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Station]:
        pass

    @abstractmethod
    async def get_countries(self, limit: int = 100, offset: int = 0, name: Optional[str] = None) -> List[Category]:
        pass

    @abstractmethod
    async def get_languages(self, limit: int = 100, offset: int = 0, name: Optional[str] = None) -> List[Category]:
        pass

    @abstractmethod
    async def get_tags(self, limit: int = 100, offset: int = 0, name: Optional[str] = None) -> List[Category]:
        pass

    @abstractmethod
    async def get_summary_stats(self) -> Dict[str, int]:
        pass

class ICacheRepository(ABC):
    @abstractmethod
    def get(self, key: str) -> Optional[any]:
        pass

    @abstractmethod
    def set(self, key: str, value: any, expire: Optional[int] = None):
        pass

    @abstractmethod
    def clear(self):
        pass
