from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings
from sqlalchemy import text, select

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

async def init_db():
    from app.models.admin_user import AdminUser, UserRole
    from app.models.blog import BlogPost
    from app.models.analytics import DailyStats, DailyStationStats, DailyCountryStats
    from app.core.security import get_password_hash
    
    async with engine.begin() as conn:
        # 1. Create all new tables
        await conn.run_sync(Base.metadata.create_all)
        print("✓ Database tables created/verified")
        
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

    # 3. Seed Superadmin if not exists
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(AdminUser).limit(1))
        if not result.scalars().first():
            print("→ Seeding default superadmin...")
            superadmin = AdminUser(
                username=settings.ADMIN_USERNAME,
                hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
                role=UserRole.SUPERADMIN
            )
            db.add(superadmin)
            await db.commit()
            print("✓ Default superadmin seeded")
