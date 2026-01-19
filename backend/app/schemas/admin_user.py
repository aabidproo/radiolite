from pydantic import BaseModel, ConfigDict
from typing import Optional

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str
    role: Optional[str] = "admin"

class UserResponse(UserBase):
    id: int
    role: str

    model_config = ConfigDict(from_attributes=True)

class UserLogin(BaseModel):
    username: str
    password: str
