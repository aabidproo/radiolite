from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

database_url = settings.DATABASE_URL
if database_url:
    # Ensure we use asyncpg driver for postgresql
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(database_url, echo=True)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

from sqlalchemy import text

async def init_db():
    async with engine.begin() as conn:
        # 1. Create all new tables (like user_activity)
        await conn.run_sync(Base.metadata.create_all)
        print("✓ Database tables created/verified")
        
        # 2. Resilient Migrations: Add missing columns to existing tables
        # Migration 1: unique_users column
        try:
            await conn.execute(text("ALTER TABLE daily_stats ADD COLUMN IF NOT EXISTS unique_users INTEGER DEFAULT 0"))
            print("✓ Migration: unique_users column added/verified in daily_stats")
        except Exception as e:
            print(f"⚠ Migration (unique_users): {e}")
            
        # Migration 2: station_name column
        try:
            await conn.execute(text("ALTER TABLE daily_station_stats ADD COLUMN IF NOT EXISTS station_name VARCHAR"))
            print("✓ Migration: station_name column added/verified in daily_station_stats")
        except Exception as e:
            print(f"⚠ Migration (station_name): {e}")
