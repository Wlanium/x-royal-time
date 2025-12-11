from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import shutil
import os
from datetime import datetime

from app.database import get_db
from app.models.user import User, AppSettings
from app.schemas.user import AppSettingsRead, AppSettingsUpdate, UserRead, UserUpdate
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/v1/settings", tags=["settings"])


# App Settings
@router.get("/app", response_model=AppSettingsRead)
async def get_app_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get global app settings"""
    result = await db.execute(select(AppSettings).where(AppSettings.id == 1))
    settings = result.scalar_one_or_none()

    if not settings:
        # Create default settings if not exists
        settings = AppSettings(id=1, display_name_format="full")
        db.add(settings)
        await db.commit()
        await db.refresh(settings)

    return settings


@router.patch("/app", response_model=AppSettingsRead)
async def update_app_settings(
    data: AppSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update global app settings (admin only)"""
    if current_user.role not in ["admin"] and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")

    result = await db.execute(select(AppSettings).where(AppSettings.id == 1))
    settings = result.scalar_one_or_none()

    if not settings:
        settings = AppSettings(id=1)
        db.add(settings)

    if data.display_name_format is not None:
        settings.display_name_format = data.display_name_format

    await db.commit()
    await db.refresh(settings)
    return settings


# User Management (RBAC)
@router.get("/users", response_model=List[UserRead])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all users (admin only)"""
    if current_user.role not in ["admin"] and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")

    result = await db.execute(select(User).order_by(User.full_name))
    return result.scalars().all()


@router.patch("/users/{user_id}", response_model=UserRead)
async def update_user_role(
    user_id: int,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update user role (admin only)"""
    if current_user.role not in ["admin"] and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.role is not None:
        user.role = data.role

    await db.commit()
    await db.refresh(user)
    return user


# Backup
@router.get("/backup")
async def download_backup(
    current_user: User = Depends(get_current_user),
):
    """Download SQLite database backup (admin only)"""
    if current_user.role not in ["admin"] and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")

    db_path = os.environ.get("DATABASE_PATH", "./data/xroyal.db")

    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail="Database file not found")

    # Create backup copy
    backup_dir = "./data/backups"
    os.makedirs(backup_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"xroyal_backup_{timestamp}.db"
    backup_path = os.path.join(backup_dir, backup_filename)

    shutil.copy2(db_path, backup_path)

    return FileResponse(
        path=backup_path,
        filename=backup_filename,
        media_type="application/octet-stream",
    )


# Export data as JSON
@router.get("/export")
async def export_data(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export all data as JSON (admin only)"""
    if current_user.role not in ["admin"] and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")

    from app.models.employee import Employee
    from app.models.project import Project
    from app.models.time_entry import TimeEntry
    from app.models.vacation import VacationRequest

    # Fetch all data
    employees = (await db.execute(select(Employee))).scalars().all()
    projects = (await db.execute(select(Project))).scalars().all()
    time_entries = (await db.execute(select(TimeEntry))).scalars().all()
    vacations = (await db.execute(select(VacationRequest))).scalars().all()

    return {
        "exported_at": datetime.now().isoformat(),
        "employees": [
            {
                "id": e.id,
                "employee_number": e.employee_number,
                "first_name": e.first_name,
                "last_name": e.last_name,
                "nickname": e.nickname,
                "email": e.email,
                "department": e.department,
                "position": e.position,
                "hourly_rate": float(e.hourly_rate) if e.hourly_rate else None,
            }
            for e in employees
        ],
        "projects": [
            {
                "id": p.id,
                "project_number": p.project_number,
                "name": p.name,
                "client_name": p.client_name,
                "is_active": p.is_active,
            }
            for p in projects
        ],
        "time_entries_count": len(time_entries),
        "vacation_requests_count": len(vacations),
    }
