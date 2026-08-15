from sqlalchemy import select
from sqlalchemy.orm import Session

from src.database.database_connection import SessionLocal
from src.database.models.payment import Plan, PlanTypeEnum


def populate_plans():
    db: Session = SessionLocal()

    try:
        # Query existing plans
        existing_plans = db.scalars(select(Plan.plan_type)).all()

        # Create a dictionary of plan types
        plan_types = [PlanTypeEnum.regular, PlanTypeEnum.standard, PlanTypeEnum.premium]

        for plan_type in plan_types:
            if plan_type not in existing_plans:
                new_plan = Plan(plan_type=plan_type)
                db.add(new_plan)

        db.commit()

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
