import asyncio
import os
import sys

sys.path.append(os.path.join(os.getcwd(), 'backend'))
from app.dependencies import station_service

async def f():
    # Search without country code
    print("\nTotal 'Absolute Radio' search:")
    r = await station_service.radio_repo.search_stations(name='Absolute Radio', limit=10)
    for s in r:
        print(f" -> {s.name} | {s.url} | {s.countrycode} | {s.votes} votes")

if __name__ == "__main__":
    asyncio.run(f())
