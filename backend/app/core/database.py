import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings
from sqlalchemy import text, select

# Setup logging
logger = logging.getLogger(__name__)

database_url = settings.DATABASE_URL
if database_url:
    # Ensure we use asyncpg driver for postgresql
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

logger.info(f"Connecting to database: {database_url.split('@')[-1] if '@' in database_url else 'SQLite'}")
engine = create_async_engine(
    database_url, 
    echo=False,
    pool_pre_ping=True,      # Check connection health before use
    pool_recycle=3600,       # Recycle connections every hour
)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

from app.models.base import Base
from sqlalchemy import event # Import event

# Import models here to ensure they are registered with Base.metadata
try:
    from app.models.admin_user import AdminUser, UserRole
    from app.models.blog import BlogPost
    from app.models.analytics import DailyStats, DailyStationStats, DailyCountryStats
    from app.core.security import get_password_hash
except ImportError as e:
    logger.error(f"Failed to import models: {e}")

logger.info(f"Registered tables in Metadata: {list(Base.metadata.tables.keys())}")

# Search Path Fix for PostgreSQL
@event.listens_for(engine.sync_engine, "connect")
def set_search_path(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    try:
        cursor.execute("SET search_path TO public")
    except Exception as e:
        logger.warning(f"Failed to set search_path: {e}")
    finally:
        cursor.close()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def init_db():
    logger.info("Starting database initialization...")
    
    # 1. Force registration of models (redundant but safe)
    from app.models.admin_user import AdminUser
    from app.models.blog import BlogPost
    from app.models.analytics import DailyStats, DailyStationStats, DailyCountryStats
    
    # Simple check for existing tables for logs
    async with engine.begin() as conn:
        try:
            diag = await conn.execute(text("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'"))
            existing = [row[0] for row in diag.fetchall()]
            logger.info(f"Public tables before create_all: {existing}")
        except: pass

        # Run Create All
        logger.info("Verifying/Creating tables...")
        await conn.run_sync(Base.metadata.create_all)
        logger.info("✓ Base.metadata.create_all completed")
        
        # 2. Resilient Migrations
        # Migration 1: unique_users column
        try:
            await conn.execute(text("ALTER TABLE daily_stats ADD COLUMN unique_users INTEGER DEFAULT 0"))
        except Exception: pass
            
        # Migration 2: station_name column
        try:
            await conn.execute(text("ALTER TABLE daily_station_stats ADD COLUMN station_name VARCHAR"))
        except Exception: pass

        # Migration 3: author_id column to blog_posts
        try:
            await conn.execute(text("ALTER TABLE blog_posts ADD COLUMN author_id INTEGER REFERENCES admin_users(id)"))
        except Exception: pass

        # Migration 4: image fields to blog_posts
        try:
            await conn.execute(text("ALTER TABLE blog_posts ADD COLUMN image_source VARCHAR"))
        except Exception: pass
        try:
            await conn.execute(text("ALTER TABLE blog_posts ADD COLUMN image_link VARCHAR"))
        except Exception: pass

    logger.info("✓ Database initialization finished")
