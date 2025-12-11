from pydantic import BaseModel
from typing import Optional
from datetime import date, time, datetime
from app.models.time_entry import EntryType


class TimeEntryBase(BaseModel):
    employee_id: int
    project_id: Optional[int] = None  # Projekt für Abrechnung
    date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    break_minutes: int = 0
    entry_type: EntryType = EntryType.WORK
    notes: Optional[str] = None


class TimeEntryCreate(TimeEntryBase):
    pass


class TimeEntryUpdate(BaseModel):
    project_id: Optional[int] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    break_minutes: Optional[int] = None
    entry_type: Optional[EntryType] = None
    notes: Optional[str] = None


class TimeEntryRead(TimeEntryBase):
    id: int
    created_at: datetime
    project_name: Optional[str] = None  # Für Anzeige

    class Config:
        from_attributes = True
