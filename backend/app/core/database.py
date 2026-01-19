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

# Import models here to ensure they are registered with Base.metadata
try:
    from app.models.admin_user import AdminUser, UserRole
    from app.models.blog import BlogPost
    from app.models.analytics import DailyStats, DailyStationStats, DailyCountryStats
    from app.core.security import get_password_hash
except ImportError as e:
    logger.error(f"Failed to import models: {e}")

logger.info(f"Registered tables in Metadata: {list(Base.metadata.tables.keys())}")

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def init_db():
    logger.info("Starting database initialization...")
    
    # 1. Force registration of models (redundant but safe)
    from app.models.admin_user import AdminUser
    from app.models.blog import BlogPost
    from app.models.analytics import DailyStats, DailyStationStats, DailyCountryStats
    
    logger.info(f"SQLAlchemy Metadata has {len(Base.metadata.tables)} tables registered: {list(Base.metadata.tables.keys())}")
    
    async with engine.begin() as conn:
        # A. Identity Diagnostics
        try:
            diag = await conn.execute(text("SELECT current_database(), current_user, current_schema(), setting FROM pg_settings WHERE name = 'search_path'"))
            db_diag = diag.fetchone()
            if db_diag:
                logger.info(f"DB Identity: DB={db_diag[0]}, User={db_diag[1]}, Schema={db_diag[2]}, SearchPath={db_diag[3]}")
        except Exception as e:
            logger.warning(f"Could not run identity diagnostics: {e}")

        # B. Verify what tables actually exist in the DB right now
        try:
            result = await conn.execute(text("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'"))
            existing_tables = [row[0] for row in result.fetchall()]
            logger.info(f"Tables currently in 'public' schema BEFORE create_all: {existing_tables}")
        except Exception as e:
            logger.warning(f"Could not verify existing tables via pg_catalog: {e}")

        # C. Run Create All
        logger.info("Running Base.metadata.create_all...")
        await conn.run_sync(Base.metadata.create_all)
        logger.info("✓ Base.metadata.create_all completed")
        
        # D. Verify again AFTER create_all
        try:
            result = await conn.execute(text("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'"))
            existing_tables = [row[0] for row in result.fetchall()]
            logger.info(f"Tables currently in 'public' schema AFTER create_all: {existing_tables}")
        except Exception: pass

        # 2. Resilient Migrations
        # Migration 1: unique_users column
        try:
            await conn.execute(text("ALTER TABLE daily_stats ADD COLUMN unique_users INTEGER DEFAULT 0"))
            logger.info("Added unique_users to daily_stats")
        except Exception: pass
            
        # Migration 2: station_name column
        try:
            await conn.execute(text("ALTER TABLE daily_station_stats ADD COLUMN station_name VARCHAR"))
            logger.info("Added station_name to daily_station_stats")
        except Exception: pass

        # Migration 3: author_id column to blog_posts
        try:
            await conn.execute(text("ALTER TABLE blog_posts ADD COLUMN author_id INTEGER REFERENCES admin_users(id)"))
            logger.info("Added author_id to blog_posts")
        except Exception: pass

        # Migration 4: image fields to blog_posts
        try:
            await conn.execute(text("ALTER TABLE blog_posts ADD COLUMN image_source VARCHAR"))
            logger.info("Added image_source to blog_posts")
        except Exception: pass
        try:
            await conn.execute(text("ALTER TABLE blog_posts ADD COLUMN image_link VARCHAR"))
            logger.info("Added image_link to blog_posts")
        except Exception: pass

    logger.info("✓ Database initialization finished (Automatic seeding skipped as requested)")
