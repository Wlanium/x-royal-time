from sqlalchemy import Column, Integer, String, Date, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    employee_number = Column(String(50), unique=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True)
    phone = Column(String(50))

    # Employment details
    department = Column(String(100))
    position = Column(String(100))
    hire_date = Column(Date)
    termination_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)

    # Working hours config
    weekly_hours = Column(Integer, default=40)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"))

    # Relationships
    time_entries = relationship("TimeEntry", back_populates="employee")
    projects = relationship("Project", secondary="project_employees", back_populates="employees")
