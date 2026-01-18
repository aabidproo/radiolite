import asyncio
import httpx
import sys
import os

sys.path.append(os.path.join(os.getcwd(), 'backend'))
from app.dependencies import station_service

async def validate_url(url: str) -> bool:
    if not url: return False
    try:
        async with httpx.AsyncClient(timeout=3.0, follow_redirects=True) as client:
            async with client.stream("GET", url) as resp:
                return resp.status_code == 200
    except:
        return False

async def find_stations():
    queries = ["Heart FM", "Capital FM", "Absolute Radio", "Classic FM", "talkSPORT", "BBC Radio 1", "BBC Radio 2", "Hits Radio"]
    print(f"{'Query':<20} | {'Found Name':<30} | {'URL'}")
    print("-" * 80)
    
    for q in queries:
        results = await station_service.radio_repo.search_stations(name=q, countrycode="GB", limit=5)
        found = False
        for s in results:
            # Prefer HTTPS
            url = s.url
            if url.startswith("http://"):
                https_url = url.replace("http://", "https://")
                if await validate_url(https_url):
                    url = https_url
            
            if await validate_url(url):
                print(f"{q:<20} | {s.name:<30} | {url}")
                found = True
                break
        if not found:
            print(f"{q:<20} | {'NOT FOUND OR BROKEN':<30}")

if __name__ == "__main__":
    asyncio.run(find_stations())
