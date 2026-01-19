from sqlalchemy import Column, String, Integer, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class UserRole(str, enum.Enum):
    SUPERADMIN = "superadmin"
    ADMIN = "admin"

class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default=UserRole.ADMIN)  # Stored as string for simplicity

    # Relationships
    posts = relationship("BlogPost", back_populates="author")
