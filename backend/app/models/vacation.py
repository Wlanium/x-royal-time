from sqlalchemy import Column, Integer, String, Date, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.database import Base


class VacationStatus(str, enum.Enum):
    PENDING = "pending"       # Beantragt
    APPROVED = "approved"     # Genehmigt
    REJECTED = "rejected"     # Abgelehnt
    CANCELLED = "cancelled"   # Storniert


class VacationType(str, enum.Enum):
    VACATION = "vacation"           # Normaler Urlaub
    SPECIAL_LEAVE = "special_leave" # Sonderurlaub
    UNPAID = "unpaid"              # Unbezahlter Urlaub
    SICK = "sick"                  # Krank (zur Info)


class VacationRequest(Base):
    __tablename__ = "vacation_requests"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)

    # Zeitraum
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    # Details
    vacation_type = Column(Enum(VacationType), default=VacationType.VACATION)
    status = Column(Enum(VacationStatus), default=VacationStatus.PENDING)
    days_count = Column(Integer, nullable=False)  # Anzahl Arbeitstage (ohne WE/Feiertage)
    notes = Column(String(500))

    # Genehmigung
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(String(500), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"))

    # Relationships
    employee = relationship("Employee", back_populates="vacation_requests")
