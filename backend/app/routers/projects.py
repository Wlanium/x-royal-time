from typing import List
from decimal import Decimal
import csv
import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.employee import Employee
from app.models.time_entry import TimeEntry
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate, ProjectSummary, CSVImportResult
from app.auth import get_current_user

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/", response_model=List[ProjectRead])
async def list_projects(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Project).options(selectinload(Project.employees))
    if active_only:
        query = query.where(Project.is_active == True)
    query = query.offset(skip).limit(limit).order_by(Project.name)
    result = await db.execute(query)
    projects = result.scalars().all()

    # Convert to response with employee_ids
    return [
        ProjectRead(
            id=p.id,
            project_number=p.project_number,
            name=p.name,
            description=p.description,
            client_name=p.client_name,
            client_reference=p.client_reference,
            start_date=p.start_date,
            end_date=p.end_date,
            budget_hours=p.budget_hours,
            hourly_rate=p.hourly_rate,
            is_billable=p.is_billable,
            is_active=p.is_active,
            created_at=p.created_at,
            employee_ids=[e.id for e in p.employees]
        )
        for p in projects
    ]


@router.post("/", response_model=ProjectRead)
async def create_project(
    project_in: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Create project
    project_data = project_in.model_dump(exclude={"employee_ids"})
    project = Project(**project_data, created_by=current_user.id)

    # Add employees if provided
    if project_in.employee_ids:
        result = await db.execute(
            select(Employee).where(Employee.id.in_(project_in.employee_ids))
        )
        employees = result.scalars().all()
        project.employees = list(employees)

    db.add(project)
    await db.commit()

    # Reload with employees relationship
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.employees))
        .where(Project.id == project.id)
    )
    project = result.scalar_one()

    return ProjectRead(
        id=project.id,
        project_number=project.project_number,
        name=project.name,
        description=project.description,
        client_name=project.client_name,
        client_reference=project.client_reference,
        start_date=project.start_date,
        end_date=project.end_date,
        budget_hours=project.budget_hours,
        hourly_rate=project.hourly_rate,
        is_billable=project.is_billable,
        is_active=project.is_active,
        created_at=project.created_at,
        employee_ids=[e.id for e in project.employees]
    )


@router.get("/{project_id}", response_model=ProjectSummary)
async def get_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.employees))
        .where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Calculate total hours from time entries
    hours_result = await db.execute(
        select(
            func.sum(
                (func.julianday(TimeEntry.end_time) - func.julianday(TimeEntry.start_time)) * 24
                - TimeEntry.break_minutes / 60.0
            )
        )
        .where(TimeEntry.project_id == project_id)
        .where(TimeEntry.end_time.isnot(None))
    )
    total_hours = hours_result.scalar() or Decimal("0")

    # Calculate billable amount
    billable_amount = Decimal("0")
    if project.hourly_rate and project.is_billable:
        billable_amount = Decimal(str(total_hours)) * project.hourly_rate

    return ProjectSummary(
        id=project.id,
        project_number=project.project_number,
        name=project.name,
        description=project.description,
        client_name=project.client_name,
        client_reference=project.client_reference,
        start_date=project.start_date,
        end_date=project.end_date,
        budget_hours=project.budget_hours,
        hourly_rate=project.hourly_rate,
        is_billable=project.is_billable,
        is_active=project.is_active,
        created_at=project.created_at,
        employee_ids=[e.id for e in project.employees],
        total_hours=Decimal(str(round(float(total_hours), 2))),
        billable_amount=Decimal(str(round(float(billable_amount), 2)))
    )


@router.patch("/{project_id}", response_model=ProjectRead)
async def update_project(
    project_id: int,
    project_in: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.employees))
        .where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = project_in.model_dump(exclude_unset=True, exclude={"employee_ids"})
    for field, value in update_data.items():
        setattr(project, field, value)

    # Update employees if provided
    if project_in.employee_ids is not None:
        result = await db.execute(
            select(Employee).where(Employee.id.in_(project_in.employee_ids))
        )
        employees = result.scalars().all()
        project.employees = list(employees)

    await db.commit()
    await db.refresh(project)

    return ProjectRead(
        id=project.id,
        project_number=project.project_number,
        name=project.name,
        description=project.description,
        client_name=project.client_name,
        client_reference=project.client_reference,
        start_date=project.start_date,
        end_date=project.end_date,
        budget_hours=project.budget_hours,
        hourly_rate=project.hourly_rate,
        is_billable=project.is_billable,
        is_active=project.is_active,
        created_at=project.created_at,
        employee_ids=[e.id for e in project.employees]
    )


@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Soft delete
    project.is_active = False
    await db.commit()
    return {"ok": True}


@router.post("/{project_id}/employees/{employee_id}")
async def add_employee_to_project(
    project_id: int,
    employee_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add an employee to a project"""
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.employees))
        .where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    if employee not in project.employees:
        project.employees.append(employee)
        await db.commit()

    return {"ok": True}


@router.delete("/{project_id}/employees/{employee_id}")
async def remove_employee_from_project(
    project_id: int,
    employee_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove an employee from a project"""
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.employees))
        .where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    if employee in project.employees:
        project.employees.remove(employee)
        await db.commit()

    return {"ok": True}


@router.post("/import/csv", response_model=CSVImportResult)
async def import_projects_from_csv(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Import projects from CSV file.

    Expected CSV format (with header row):
    project_number,name,description,client_name,client_reference,budget_hours,hourly_rate,is_billable

    Example:
    project_number,name,description,client_name,client_reference,budget_hours,hourly_rate,is_billable
    PRJ-001,Website Redesign,Komplettes Redesign,Kunde AG,REF-123,100,85.00,true
    PRJ-002,Mobile App,App Entwicklung,Firma GmbH,REF-456,200,95.00,true
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    content = await file.read()
    try:
        decoded = content.decode('utf-8')
    except UnicodeDecodeError:
        decoded = content.decode('latin-1')

    reader = csv.DictReader(io.StringIO(decoded))

    imported = 0
    skipped = 0
    errors = []

    for row_num, row in enumerate(reader, start=2):  # Start at 2 because of header
        try:
            # Check if project_number already exists
            if row.get('project_number'):
                existing = await db.execute(
                    select(Project).where(Project.project_number == row['project_number'])
                )
                if existing.scalar_one_or_none():
                    skipped += 1
                    errors.append(f"Row {row_num}: Project {row['project_number']} already exists")
                    continue

            # Parse boolean
            is_billable = row.get('is_billable', 'true').lower() in ('true', '1', 'yes', 'ja')

            # Parse numeric values
            budget_hours = None
            if row.get('budget_hours'):
                try:
                    budget_hours = Decimal(row['budget_hours'])
                except:
                    pass

            hourly_rate = None
            if row.get('hourly_rate'):
                try:
                    hourly_rate = Decimal(row['hourly_rate'])
                except:
                    pass

            project = Project(
                project_number=row.get('project_number') or None,
                name=row['name'],
                description=row.get('description') or None,
                client_name=row.get('client_name') or None,
                client_reference=row.get('client_reference') or None,
                budget_hours=budget_hours,
                hourly_rate=hourly_rate,
                is_billable=is_billable,
                created_by=current_user.id,
            )
            db.add(project)
            imported += 1

        except KeyError as e:
            errors.append(f"Row {row_num}: Missing required field {e}")
            skipped += 1
        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")
            skipped += 1

    await db.commit()

    return CSVImportResult(
        imported=imported,
        skipped=skipped,
        errors=errors[:10]  # Limit error messages
    )
