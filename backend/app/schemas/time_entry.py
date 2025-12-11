from pydantic import BaseModel
from typing import Optional
from datetime import date, time, datetime
from app.models.time_entry import EntryType


class TimeEntryBase(BaseModel):
    employee_id: int
    date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    break_minutes: int = 0
    entry_type: EntryType = EntryType.WORK
    notes: Optional[str] = None


class TimeEntryCreate(TimeEntryBase):
    pass


class TimeEntryUpdate(BaseModel):
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    break_minutes: Optional[int] = None
    entry_type: Optional[EntryType] = None
    notes: Optional[str] = None


class TimeEntryRead(TimeEntryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
