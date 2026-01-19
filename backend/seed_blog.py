import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.blog import BlogPost
from app.core.database import Base, settings

database_url = settings.DATABASE_URL
if database_url:
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(database_url)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def seed_data():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with AsyncSessionLocal() as session:
        # Check if posts already exist to avoid duplicates
        from sqlalchemy import select
        result = await session.execute(select(BlogPost))
        if result.scalars().first():
            print("Database already has posts. Skipping seed.")
            return

        posts = [
            BlogPost(
                title="Best Free Arabic Radio App for Mac 2026",
                slug="best-free-arabic-radio-app-mac",
                content="""# Why Radiolite is the Best Choice for Arabic Radio...""",
                is_published=True,
                image_url="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=1000&auto=format&fit=crop",
                seo_title="Top 10 Arabic Radio Stations on Mac | Free Ad-Free App",
                meta_description="Listen to the best Arabic radio stations on your Mac for free. Radiolite offers ad-free streaming of Holy Quran Radio, Al Jazeera, and more."
            ),
            BlogPost(
                title="Top 5 European Radio Stations for Deep Work",
                slug="top-european-radio-stations-work",
                content="""# Focus Better with European Radio...""",
                is_published=True,
                image_url="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1000&auto=format&fit=crop",
                seo_title="Best European Radio Stations for Productivity | Radiolite",
                meta_description="Discover the top European radio stations for deep work and focus. From BBC Radio 6 to France Inter, stream them all for free on Radiolite."
            ),
            BlogPost(
                title="How to Stream BBC Radio 1 on Windows 11",
                slug="stream-bbc-radio-1-windows-11",
                content="""# Your Guide to BBC Radio on Windows...""",
                is_published=True,
                image_url="https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=1000&auto=format&fit=crop",
                seo_title="Listen to BBC Radio 1 on Windows 11 | No Ads, Fast Stream",
                meta_description="Guide on how to listen to BBC Radio 1 and all UK stations on Windows 11 without using a browser. Download Radiolite for a minimalist experience."
            )
        ]
        session.add_all(posts)
        await session.commit()
        print("✓ 3 Sample blog posts created!")

if __name__ == "__main__":
    asyncio.run(seed_data())
