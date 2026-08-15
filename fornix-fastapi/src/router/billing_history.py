from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.database.schema.billing_history import BillingHistoryResponse
from src.database.models.billing_history import BillingHistory, StatusEnum
from src.database.models.payment import PlanTypeEnum
from src.controller.auth import decode_token
from src.database.schema.user import TokenData
from src.database.database_connection import get_db
from src.database.models.payment import Payment
from datetime import date, datetime
from typing import Annotated, List
from sqlalchemy import desc
import traceback

router = APIRouter()


# Function to add billing history entry
async def create_billing_entry(
        payment_instance: Payment,
        db: Session,
        token: Annotated[TokenData, Depends(decode_token)],
):
    try:
        billing_history = BillingHistory(
            status=StatusEnum.success,  # Assuming 'success' for now
            amount=payment_instance.amount,
            plan=payment_instance.plan_type,
            payment_id=payment_instance.id,
            credits=payment_instance.credits,
            user_id=token.user_id
        )

        db.add(billing_history)
        db.commit()
        db.refresh(billing_history)

        return {
            "message": "Billing history created successfully",
            "data": billing_history
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create billing history: {str(e)}"
        )


# Router to retrieve billing history for a user
@router.get("/history", response_model=List[BillingHistoryResponse])
async def get_billing_history(
        token: Annotated[TokenData, Depends(decode_token)],
        db: Session = Depends(get_db)
):
    try:
        # Query user billing history
        user_billing_history = (
            db.query(BillingHistory)
            .filter_by(user_id=token.user_id)
            .order_by(desc(BillingHistory.created_at))
            .all()
        )

        # if not user_billing_history:
        #     raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Billing history not found.")

        return user_billing_history

    except HTTPException as http_err:
        raise http_err

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve billing history: {str(e) or 'An unknown error occurred'}"
        )
