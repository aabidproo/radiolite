import asyncio
import httpx
import sys
import os

sys.path.append(os.path.join(os.getcwd(), 'backend'))
from app.dependencies import station_service

async def test_heart():
    print("Searching for 'Heart' in GB...")
    results = await station_service.radio_repo.search_stations(name="Heart", countrycode="GB", limit=10)
    
    for s in results:
        print(f"\nStation: {s.name}")
        print(f"URL: {s.url}")
        print(f"Codec: {s.codec}, Bitrate: {s.bitrate}")
        
        # Test with browser-like user agent
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://www.heart.co.uk/"
        }
        
        try:
            async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
                # Try with headers
                async with client.stream("GET", s.url, headers=headers) as resp:
                    print(f"  Browser-like GET: {resp.status_code}")
                    # No need to read content
                
                # Try without headers (like a basic player)
                async with client.stream("GET", s.url) as resp_basic:
                    print(f"  Basic GET: {resp_basic.status_code}")
                
        except Exception as e:
            print(f"  Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_heart())
