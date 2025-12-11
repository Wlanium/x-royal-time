from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    language = Column(String(5), default="de")  # de, en, ro

    # RBAC role: admin, manager, employee
    role = Column(String(20), default="employee")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class AppSettings(Base):
    """Global app settings - single row table"""
    __tablename__ = "app_settings"

    id = Column(Integer, primary_key=True, default=1)
    # Display name format: "full" (Vorname Nachname), "last" (Nachname), "nickname" (Spitzname)
    display_name_format = Column(String(20), default="full")

    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
