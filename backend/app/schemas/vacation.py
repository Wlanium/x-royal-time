from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from app.models.vacation import VacationStatus, VacationType


class VacationRequestBase(BaseModel):
    employee_id: int
    start_date: date
    end_date: date
    vacation_type: VacationType = VacationType.VACATION
    notes: Optional[str] = None


class VacationRequestCreate(VacationRequestBase):
    pass


class VacationRequestUpdate(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    vacation_type: Optional[VacationType] = None
    notes: Optional[str] = None


class VacationRequestRead(VacationRequestBase):
    id: int
    status: VacationStatus
    days_count: int
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    # For display
    employee_name: Optional[str] = None

    class Config:
        from_attributes = True


class VacationApproval(BaseModel):
    approved: bool
    rejection_reason: Optional[str] = None


class VacationBalance(BaseModel):
    employee_id: int
    employee_name: str
    year: int
    total_days: int          # Jahresurlaub
    used_days: int           # Genommen/Genehmigt
    pending_days: int        # Beantragt (pending)
    remaining_days: int      # Verbleibend


class VacationCalendarEntry(BaseModel):
    employee_id: int
    employee_name: str
    start_date: date
    end_date: date
    vacation_type: VacationType
    status: VacationStatus
