from typing import List
from datetime import date
from fastapi import APIRouter, Depends, Query
import holidays
from app.models.user import User
from app.auth import get_current_user

router = APIRouter(prefix="/holidays", tags=["holidays"])


@router.get("/")
async def get_holidays(
    year: int = Query(default=None, description="Year to get holidays for"),
    country: str = Query(default="RO", description="Country code (RO, DE)"),
    current_user: User = Depends(get_current_user)
) -> List[dict]:
    """Get public holidays for a country (default: Romania)"""
    if year is None:
        year = date.today().year

    # Get holidays for the country
    country_holidays = holidays.country_holidays(country, years=year)

    result = []
    for holiday_date, name in sorted(country_holidays.items()):
        result.append({
            "date": holiday_date.isoformat(),
            "name": name,
            "country": country,
        })

    return result


@router.get("/check")
async def check_holiday(
    check_date: date = Query(..., description="Date to check"),
    country: str = Query(default="RO", description="Country code"),
    current_user: User = Depends(get_current_user)
) -> dict:
    """Check if a specific date is a holiday"""
    country_holidays = holidays.country_holidays(country, years=check_date.year)

    is_holiday = check_date in country_holidays
    holiday_name = country_holidays.get(check_date) if is_holiday else None

    return {
        "date": check_date.isoformat(),
        "is_holiday": is_holiday,
        "holiday_name": holiday_name,
        "country": country,
    }
