from datetime import date, datetime
from typing import Optional


def age_calculator(dob: date, current_date: Optional[date] = None):
    current_date = current_date or datetime.now().date()
    age = (current_date - dob).days // 365
    return age
