from sqlalchemy import Column, String, Integer, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base

class BlogPost(Base):
    __tablename__ = "blog_posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    content = Column(Text, nullable=False)  # Markdown content
    image_url = Column(String, nullable=True)
    image_source = Column(String, nullable=True)  # Small text under image
    image_link = Column(String, nullable=True)    # Link for the image
    
    # SEO Fields
    seo_title = Column(String, nullable=True)
    meta_description = Column(String, nullable=True)
    
    # Author
    author_id = Column(Integer, ForeignKey("admin_users.id"), nullable=True)
    author = relationship("AdminUser", back_populates="posts")

    # Metadata
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
