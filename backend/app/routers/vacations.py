from typing import List
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, extract
import holidays
from app.database import get_db
from app.models.user import User
from app.models.employee import Employee
from app.models.vacation import VacationRequest, VacationStatus, VacationType
from app.schemas.vacation import (
    VacationRequestCreate, VacationRequestRead, VacationRequestUpdate,
    VacationApproval, VacationBalance, VacationCalendarEntry
)
from app.auth import get_current_user

router = APIRouter(prefix="/vacations", tags=["vacations"])


def count_working_days(start_date: date, end_date: date, country: str = "RO") -> int:
    """Count working days between two dates (excluding weekends and holidays)"""
    country_holidays = holidays.country_holidays(country, years=[start_date.year, end_date.year])
    working_days = 0
    current = start_date

    while current <= end_date:
        # Skip weekends (5=Saturday, 6=Sunday)
        if current.weekday() < 5 and current not in country_holidays:
            working_days += 1
        current = date(current.year, current.month, current.day + 1) if current.day < 28 else \
                  date(current.year, current.month + 1, 1) if current.month < 12 else \
                  date(current.year + 1, 1, 1)
        # Simpler approach:
        from datetime import timedelta
        current = start_date + timedelta(days=(current - start_date).days + 1)
        if current > end_date:
            break

    # Recalculate properly
    from datetime import timedelta
    working_days = 0
    current = start_date
    while current <= end_date:
        if current.weekday() < 5 and current not in country_holidays:
            working_days += 1
        current += timedelta(days=1)

    return working_days


@router.get("/", response_model=List[VacationRequestRead])
async def list_vacation_requests(
    employee_id: int = None,
    year: int = Query(default=None),
    status: VacationStatus = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List vacation requests with optional filters"""
    query = select(VacationRequest, Employee).join(Employee)

    conditions = []
    if employee_id:
        conditions.append(VacationRequest.employee_id == employee_id)
    if year:
        conditions.append(extract('year', VacationRequest.start_date) == year)
    if status:
        conditions.append(VacationRequest.status == status)

    if conditions:
        query = query.where(and_(*conditions))

    query = query.order_by(VacationRequest.start_date.desc())
    result = await db.execute(query)
    rows = result.all()

    return [
        VacationRequestRead(
            id=vr.id,
            employee_id=vr.employee_id,
            start_date=vr.start_date,
            end_date=vr.end_date,
            vacation_type=vr.vacation_type,
            status=vr.status,
            days_count=vr.days_count,
            notes=vr.notes,
            approved_by=vr.approved_by,
            approved_at=vr.approved_at,
            rejection_reason=vr.rejection_reason,
            created_at=vr.created_at,
            employee_name=f"{emp.first_name} {emp.last_name}"
        )
        for vr, emp in rows
    ]


@router.post("/", response_model=VacationRequestRead)
async def create_vacation_request(
    request_in: VacationRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new vacation request"""
    # Validate employee exists
    result = await db.execute(select(Employee).where(Employee.id == request_in.employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Validate dates
    if request_in.end_date < request_in.start_date:
        raise HTTPException(status_code=400, detail="End date must be after start date")

    # Calculate working days
    days_count = count_working_days(request_in.start_date, request_in.end_date)

    vacation_request = VacationRequest(
        employee_id=request_in.employee_id,
        start_date=request_in.start_date,
        end_date=request_in.end_date,
        vacation_type=request_in.vacation_type,
        days_count=days_count,
        notes=request_in.notes,
        status=VacationStatus.PENDING,
        created_by=current_user.id,
    )
    db.add(vacation_request)
    await db.commit()
    await db.refresh(vacation_request)

    return VacationRequestRead(
        id=vacation_request.id,
        employee_id=vacation_request.employee_id,
        start_date=vacation_request.start_date,
        end_date=vacation_request.end_date,
        vacation_type=vacation_request.vacation_type,
        status=vacation_request.status,
        days_count=vacation_request.days_count,
        notes=vacation_request.notes,
        approved_by=vacation_request.approved_by,
        approved_at=vacation_request.approved_at,
        rejection_reason=vacation_request.rejection_reason,
        created_at=vacation_request.created_at,
        employee_name=f"{employee.first_name} {employee.last_name}"
    )


@router.get("/{request_id}", response_model=VacationRequestRead)
async def get_vacation_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(VacationRequest, Employee)
        .join(Employee)
        .where(VacationRequest.id == request_id)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Vacation request not found")

    vr, emp = row
    return VacationRequestRead(
        id=vr.id,
        employee_id=vr.employee_id,
        start_date=vr.start_date,
        end_date=vr.end_date,
        vacation_type=vr.vacation_type,
        status=vr.status,
        days_count=vr.days_count,
        notes=vr.notes,
        approved_by=vr.approved_by,
        approved_at=vr.approved_at,
        rejection_reason=vr.rejection_reason,
        created_at=vr.created_at,
        employee_name=f"{emp.first_name} {emp.last_name}"
    )


@router.post("/{request_id}/approve", response_model=VacationRequestRead)
async def approve_or_reject_vacation(
    request_id: int,
    approval: VacationApproval,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Approve or reject a vacation request"""
    result = await db.execute(
        select(VacationRequest, Employee)
        .join(Employee)
        .where(VacationRequest.id == request_id)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Vacation request not found")

    vr, emp = row

    if vr.status != VacationStatus.PENDING:
        raise HTTPException(status_code=400, detail="Can only approve/reject pending requests")

    if approval.approved:
        vr.status = VacationStatus.APPROVED
    else:
        vr.status = VacationStatus.REJECTED
        vr.rejection_reason = approval.rejection_reason

    vr.approved_by = current_user.id
    vr.approved_at = datetime.utcnow()

    await db.commit()
    await db.refresh(vr)

    return VacationRequestRead(
        id=vr.id,
        employee_id=vr.employee_id,
        start_date=vr.start_date,
        end_date=vr.end_date,
        vacation_type=vr.vacation_type,
        status=vr.status,
        days_count=vr.days_count,
        notes=vr.notes,
        approved_by=vr.approved_by,
        approved_at=vr.approved_at,
        rejection_reason=vr.rejection_reason,
        created_at=vr.created_at,
        employee_name=f"{emp.first_name} {emp.last_name}"
    )


@router.delete("/{request_id}")
async def cancel_vacation_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel a vacation request"""
    result = await db.execute(select(VacationRequest).where(VacationRequest.id == request_id))
    vr = result.scalar_one_or_none()
    if not vr:
        raise HTTPException(status_code=404, detail="Vacation request not found")

    if vr.status == VacationStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Request already cancelled")

    vr.status = VacationStatus.CANCELLED
    await db.commit()
    return {"ok": True}


@router.get("/balance/{employee_id}", response_model=VacationBalance)
async def get_vacation_balance(
    employee_id: int,
    year: int = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get vacation balance for an employee"""
    if year is None:
        year = date.today().year

    # Get employee
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Get approved vacation days
    result = await db.execute(
        select(VacationRequest)
        .where(
            VacationRequest.employee_id == employee_id,
            VacationRequest.status == VacationStatus.APPROVED,
            extract('year', VacationRequest.start_date) == year,
            VacationRequest.vacation_type == VacationType.VACATION
        )
    )
    approved_requests = result.scalars().all()
    used_days = sum(r.days_count for r in approved_requests)

    # Get pending vacation days
    result = await db.execute(
        select(VacationRequest)
        .where(
            VacationRequest.employee_id == employee_id,
            VacationRequest.status == VacationStatus.PENDING,
            extract('year', VacationRequest.start_date) == year,
            VacationRequest.vacation_type == VacationType.VACATION
        )
    )
    pending_requests = result.scalars().all()
    pending_days = sum(r.days_count for r in pending_requests)

    total_days = employee.vacation_days_per_year
    remaining_days = total_days - used_days

    return VacationBalance(
        employee_id=employee.id,
        employee_name=f"{employee.first_name} {employee.last_name}",
        year=year,
        total_days=total_days,
        used_days=used_days,
        pending_days=pending_days,
        remaining_days=remaining_days
    )


@router.get("/calendar/", response_model=List[VacationCalendarEntry])
async def get_vacation_calendar(
    year: int = Query(default=None),
    month: int = Query(default=None, ge=1, le=12),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get vacation calendar entries for display"""
    if year is None:
        year = date.today().year

    query = select(VacationRequest, Employee).join(Employee).where(
        VacationRequest.status.in_([VacationStatus.APPROVED, VacationStatus.PENDING]),
        extract('year', VacationRequest.start_date) == year
    )

    if month:
        query = query.where(
            (extract('month', VacationRequest.start_date) == month) |
            (extract('month', VacationRequest.end_date) == month)
        )

    query = query.order_by(VacationRequest.start_date)
    result = await db.execute(query)
    rows = result.all()

    return [
        VacationCalendarEntry(
            employee_id=vr.employee_id,
            employee_name=f"{emp.first_name} {emp.last_name}",
            start_date=vr.start_date,
            end_date=vr.end_date,
            vacation_type=vr.vacation_type,
            status=vr.status
        )
        for vr, emp in rows
    ]
