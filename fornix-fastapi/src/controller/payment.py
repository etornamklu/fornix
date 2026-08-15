"""service for the payment feature"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from src.database.models import User, Organization
from src.database.models.payment import Payment, Plan, PlanTypeEnum
from src.database.models.billing_history import BillingHistory, StatusEnum
from src.database.schema.user import TokenData, UserRole
from src.database.schema.payment import PaymentBase, PaymentCreate


# price to credit map
credit_map = {5000: 50, 10000: 100, 20000: 200}

# price to plan map
plan_price_map = {50: "regular", 100: "standard", 200: "premium"}


async def upsert_async(data: PaymentCreate, token: TokenData, db: Session):
    """Create or update payment details"""

    try:
        user = db.query(User).filter(User.email == token.email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        plan_type = plan_price_map.get(int(data.amount))
        if not plan_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payment amount",
            )

        plan = db.query(Plan).filter(Plan.plan_type == plan_type).first()
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Plan {plan_type} not found in system",
            )

        payment = Payment(
            **PaymentBase(
                **data.__dict__, user_id=user.id, name=user.name, email=user.email
            ).model_dump(),
            plan_type=plan_type,
        )
        db.add(payment)
        db.flush()

        if user.organization_id and user.role == UserRole.ADMIN:
            organization = db.query(Organization).filter(Organization.id == user.organization_id).first()
            organization.credits += payment.amount
        else:
            user.credits += payment.amount

        billing_history = BillingHistory(
            status=StatusEnum.success,
            amount=payment.amount,
            credits=payment.amount,
            plan=payment.plan_type,
            payment_id=payment.id,
            user_id=user.id,
        )

        db.add(billing_history)
        db.commit()
        db.refresh(payment)
        db.refresh(user)

        return payment, user
    except Exception as e:
        db.rollback()
        print(str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process payment: {str(e)}",
        )


async def retrieve_async(token: TokenData, db: Session):
    """function for retrieving or fetching user specific patient details"""
    return db.query(Payment).filter(Payment.user_id == token.user_id).all()