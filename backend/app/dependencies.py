import os
from app.domain.utils import LocationNormalizer
from app.infrastructure.external.radio_browser import RadioBrowserAdapter
from app.infrastructure.external.github import GitHubAdapter
from app.infrastructure.persistence.disk_cache import DiskCacheAdapter
from app.application.services import StationService
from app.application.releases import ReleaseService

from app.infrastructure.external.mapper import RadioBrowserMapper

# 1. Domain Utilities
normalizer = LocationNormalizer()
mapper = RadioBrowserMapper(normalizer=normalizer)

# 2. Infrastructure Layer (Adapters)
radio_repo = RadioBrowserAdapter(mapper=mapper)

# Cache directory configuration
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cache_dir = os.path.join(project_root, ".cache")
cache_repo = DiskCacheAdapter(cache_dir=cache_dir)

# 3. Application Layer (Services)
station_service = StationService(radio_repo=radio_repo, cache_repo=cache_repo)
release_service = ReleaseService(github_adapter=GitHubAdapter())

# Export the application services to be used by the API layer
def get_station_service():
    return station_service

def get_release_service():
    return release_service
