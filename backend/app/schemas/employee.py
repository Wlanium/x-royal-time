from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime
from decimal import Decimal


class EmployeeBase(BaseModel):
    employee_number: Optional[str] = None
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    hire_date: Optional[date] = None
    weekly_hours: int = 40
    hourly_rate: Optional[Decimal] = None  # €/Stunde
    vacation_days_per_year: int = 25  # Urlaubstage pro Jahr


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    employee_number: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    hire_date: Optional[date] = None
    termination_date: Optional[date] = None
    is_active: Optional[bool] = None
    weekly_hours: Optional[int] = None
    hourly_rate: Optional[Decimal] = None
    vacation_days_per_year: Optional[int] = None


class EmployeeRead(EmployeeBase):
    id: int
    is_active: bool
    termination_date: Optional[date] = None
    created_at: datetime

    class Config:
        from_attributes = True
