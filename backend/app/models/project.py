from sqlalchemy import Column, Integer, String, Date, DateTime, Boolean, ForeignKey, Numeric, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


# Many-to-Many: Projects <-> Employees
project_employees = Table(
    "project_employees",
    Base.metadata,
    Column("project_id", Integer, ForeignKey("projects.id"), primary_key=True),
    Column("employee_id", Integer, ForeignKey("employees.id"), primary_key=True),
)


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)

    # Basic info
    project_number = Column(String(50), unique=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(1000))

    # Client/Customer for billing
    client_name = Column(String(255))
    client_reference = Column(String(100))  # Kundenreferenz/Bestellnummer

    # Dates
    start_date = Column(Date)
    end_date = Column(Date)

    # Budget & Billing
    budget_hours = Column(Numeric(10, 2))  # Geplante Stunden
    hourly_rate = Column(Numeric(10, 2))   # Stundensatz für Abrechnung

    # Status
    is_active = Column(Boolean, default=True)
    is_billable = Column(Boolean, default=True)  # Abrechenbar?

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"))

    # Relationships
    employees = relationship("Employee", secondary=project_employees, back_populates="projects")
    time_entries = relationship("TimeEntry", back_populates="project")
