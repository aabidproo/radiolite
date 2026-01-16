import os
from diskcache import Cache
from typing import Optional
from app.application.interfaces import ICacheRepository

class DiskCacheAdapter(ICacheRepository):
    def __init__(self, cache_dir: str):
        self.cache = Cache(cache_dir)

    def get(self, key: str) -> Optional[any]:
        return self.cache.get(key)

    def set(self, key: str, value: any, expire: Optional[int] = None):
        self.cache.set(key, value, expire=expire)

    def clear(self):
        self.cache.clear()
