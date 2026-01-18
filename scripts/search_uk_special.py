import asyncio
import os
import sys

sys.path.append(os.path.join(os.getcwd(), 'backend'))
from app.dependencies import station_service

async def f():
    for n in ['Absolute Radio', 'Hits Radio UK', 'Magic Radio']:
        print(f"\nSearching for: {n}")
        r = await station_service.radio_repo.search_stations(name=n, countrycode='GB', limit=5)
        for s in r:
            print(f" -> {s.name} | {s.url} | {s.votes} votes")

if __name__ == "__main__":
    asyncio.run(f())
