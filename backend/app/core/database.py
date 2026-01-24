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
# Create engine with conditional connect_args
connect_args = {}
if "postgresql" in database_url:
    connect_args = {"server_settings": {"search_path": "public"}}

engine = create_async_engine(
    database_url, 
    echo=False,
    pool_pre_ping=True,
    pool_recycle=3600,
    connect_args=connect_args
)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

from app.models.base import Base

# Import models here to ensure they are registered with Base.metadata
try:
    from app.models.admin_user import AdminUser, UserRole
    from app.models.blog import BlogPost
    from app.models.analytics import DailyStats, DailyStationStats, DailyCountryStats, UserActivity
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
    
    # PHASE 1: Schema Creation
    async with engine.begin() as conn:
        # A. Diagnostic Check for logs
        try:
            diag = await conn.execute(text("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'"))
            existing = [row[0] for row in diag.fetchall()]
            logger.info(f"Public tables at start: {existing}")
        except: pass

        # B. Run Create All
        logger.info("Syncing schema (Base.metadata.create_all)...")
        await conn.run_sync(Base.metadata.create_all)
        
        # C. Reachability Check
        try:
            await conn.execute(text("SELECT 1 FROM blog_posts LIMIT 1"))
            logger.info("✓ Schema Verified: 'blog_posts' is reachable in transaction")
        except Exception as e:
            logger.warning(f"⚠️ Reachability check note: {e}")
            
    logger.info("✓ Schema creation transaction committed")

    # PHASE 2: Seeding (Separate Transaction)
    async with AsyncSessionLocal() as db:
        try:
            logger.info("Starting Seeding...")
            # Check if any user exists
            result = await db.execute(select(AdminUser).where(AdminUser.username == settings.ADMIN_USERNAME))
            existing_admin = result.scalars().first()
            
            if not existing_admin:
                logger.info(f"Seeding new superadmin: {settings.ADMIN_USERNAME}")
                new_admin = AdminUser(
                    username=settings.ADMIN_USERNAME,
                    hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
                    role=UserRole.SUPERADMIN
                )
                db.add(new_admin)
                await db.commit()
                logger.info("✓ New superadmin seeded")
            else:
                logger.info(f"Superadmin '{settings.ADMIN_USERNAME}' exists. Updating password.")
                existing_admin.hashed_password = get_password_hash(settings.ADMIN_PASSWORD)
                await db.commit()
                logger.info("✓ Superadmin updated")
        except Exception as e:
            logger.error(f"Error seeding database: {e}")
            # Don't raise, let the app run since schema is good

    logger.info("✓ Database initialization finished")
