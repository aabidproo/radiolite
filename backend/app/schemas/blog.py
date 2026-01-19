from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from .admin_user import UserResponse

class BlogBase(BaseModel):
    title: str
    slug: str
    content: str
    image_url: Optional[str] = None
    image_source: Optional[str] = None
    image_link: Optional[str] = None
    seo_title: Optional[str] = None
    meta_description: Optional[str] = None
    is_published: bool = False

class BlogCreate(BlogBase):
    pass

class BlogUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None
    image_source: Optional[str] = None
    image_link: Optional[str] = None
    seo_title: Optional[str] = None
    meta_description: Optional[str] = None
    is_published: Optional[bool] = None

class BlogResponse(BlogBase):
    id: int
    author_id: Optional[int] = None
    author: Optional[UserResponse] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
