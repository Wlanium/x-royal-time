from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    language: str = "de"
    role: Literal["admin", "manager", "employee"] = "employee"


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    language: Optional[str] = None
    password: Optional[str] = None
    role: Optional[Literal["admin", "manager", "employee"]] = None


class UserRead(UserBase):
    id: int
    is_active: bool
    is_superuser: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# App Settings
class AppSettingsRead(BaseModel):
    display_name_format: Literal["full", "last", "nickname"] = "full"

    class Config:
        from_attributes = True


class AppSettingsUpdate(BaseModel):
    display_name_format: Optional[Literal["full", "last", "nickname"]] = None
