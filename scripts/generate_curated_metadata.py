import asyncio
import json
import os
import sys
import httpx

# Add the project root to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.core.curated import CURATED_STATIONS
from app.dependencies import station_service

async def validate_url(url: str, name: str) -> bool:
    """Check if the stream URL is actually reachable."""
    if not url:
        return False
    try:
        async with httpx.AsyncClient(timeout=3.0, follow_redirects=True) as client:
            async with client.stream("GET", url) as response:
                if response.status_code == 200:
                    return True
    except Exception as e:
        # print(f"    Validation failed for {name} ({url}): {e}")
        pass
    return False

async def generate_metadata():
    print("Generating curated station metadata with HTTPS-First policy...")
    metadata = {}
    
    for region, stations in CURATED_STATIONS.items():
        print(f"Processing region: {region}")
        region_stations = []
        
        for s in stations:
            print(f"  Fetching: {s['name']}")
            try:
                # Search Radio Browser
                results = await station_service.radio_repo.search_stations(name=s["name"], countrycode=s.get("countryCode"), limit=3)
                
                valid_station_data = None
                for candidate in results:
                    url = candidate.url
                    candidate_name = candidate.name
                    print(f"    Checking candidate: {candidate_name} ({url})")
                    
                    # 1. Try to upgrade to HTTPS if it's HTTP
                    if url.startswith("http://"):
                        https_url = url.replace("http://", "https://")
                        if await validate_url(https_url, candidate_name):
                            print(f"    - Upgraded to HTTPS: {https_url}")
                            candidate.url = https_url
                            candidate.url_resolved = https_url
                            valid_station_data = candidate.model_dump()
                            break
                    
                    # 2. Otherwise validate current URL
                    if await validate_url(url, candidate_name):
                        print(f"    - Validated {url}")
                        valid_station_data = candidate.model_dump()
                        break
                    else:
                        print(f"    - Skipping broken link: {url}")

                if valid_station_data:
                    region_stations.append(valid_station_data)
                    print(f"    Confirmed: {valid_station_data['name']}")
                else:
                    print(f"    Critical: No working links found for {s['name']}")
            except Exception as e:
                print(f"    Error processing {s['name']}: {e}")
        
        metadata[region] = region_stations
    
    output_path = os.path.join('backend', 'app', 'core', 'curated_metadata.json')
    with open(output_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"Done! Metadata saved to {output_path}")

if __name__ == "__main__":
    asyncio.run(generate_metadata())
