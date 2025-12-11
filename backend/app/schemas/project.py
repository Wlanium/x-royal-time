from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal


class ProjectBase(BaseModel):
    project_number: Optional[str] = None
    name: str
    description: Optional[str] = None
    client_name: Optional[str] = None
    client_reference: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget_hours: Optional[Decimal] = None
    hourly_rate: Optional[Decimal] = None
    is_billable: bool = True


class ProjectCreate(ProjectBase):
    employee_ids: Optional[List[int]] = None


class ProjectUpdate(BaseModel):
    project_number: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    client_name: Optional[str] = None
    client_reference: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget_hours: Optional[Decimal] = None
    hourly_rate: Optional[Decimal] = None
    is_active: Optional[bool] = None
    is_billable: Optional[bool] = None
    employee_ids: Optional[List[int]] = None


class ProjectRead(ProjectBase):
    id: int
    is_active: bool
    created_at: datetime
    employee_ids: List[int] = []

    class Config:
        from_attributes = True


class ProjectSummary(ProjectRead):
    """Project with time tracking summary"""
    total_hours: Decimal = Decimal("0")
    billable_amount: Decimal = Decimal("0")


class CSVImportResult(BaseModel):
    imported: int
    skipped: int
    errors: List[str]
