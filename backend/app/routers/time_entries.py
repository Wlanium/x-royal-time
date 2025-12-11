from typing import List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.database import get_db
from app.models.user import User
from app.models.time_entry import TimeEntry
from app.schemas.time_entry import TimeEntryCreate, TimeEntryRead, TimeEntryUpdate
from app.auth import get_current_user

router = APIRouter(prefix="/time-entries", tags=["time-entries"])


@router.get("/", response_model=List[TimeEntryRead])
async def list_time_entries(
    employee_id: int = None,
    date_from: date = Query(None),
    date_to: date = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(TimeEntry)

    conditions = []
    if employee_id:
        conditions.append(TimeEntry.employee_id == employee_id)
    if date_from:
        conditions.append(TimeEntry.date >= date_from)
    if date_to:
        conditions.append(TimeEntry.date <= date_to)

    if conditions:
        query = query.where(and_(*conditions))

    query = query.order_by(TimeEntry.date.desc(), TimeEntry.start_time.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=TimeEntryRead)
async def create_time_entry(
    entry_in: TimeEntryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    entry = TimeEntry(**entry_in.model_dump(), created_by=current_user.id)
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.get("/{entry_id}", response_model=TimeEntryRead)
async def get_time_entry(
    entry_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(TimeEntry).where(TimeEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
    return entry


@router.patch("/{entry_id}", response_model=TimeEntryRead)
async def update_time_entry(
    entry_id: int,
    entry_in: TimeEntryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(TimeEntry).where(TimeEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Time entry not found")

    update_data = entry_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(entry, field, value)

    await db.commit()
    await db.refresh(entry)
    return entry


@router.delete("/{entry_id}")
async def delete_time_entry(
    entry_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(TimeEntry).where(TimeEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Time entry not found")

    await db.delete(entry)
    await db.commit()
    return {"ok": True}
