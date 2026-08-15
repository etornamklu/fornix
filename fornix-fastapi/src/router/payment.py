"""payment endpoints"""

from distutils.util import strtobool
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from starlette import status

from src.controller.auth import decode_token
from src.controller.payment import retrieve_async, upsert_async
from src.database.database_connection import get_db
from src.database.models import User
from src.database.schema.payment import PaymentCreate
from src.database.schema.third_party.paystack import (
    CreatePayment,
    InitiatePaymentResponse,
    PaystackVerifyResponse,
    SuccessfulTransaction,
)
from src.database.schema.user import TokenData, UserSchema
from src.services.paystack import PaystackService
from src.utils.helpers import Helpers
from src.router.billing_history import create_billing_entry
from rich import print

router = APIRouter()


@router.post("/", deprecated=True)
async def save_payment(
        resp: Response,
        token: Annotated[TokenData, Depends(decode_token)],
        db: Session = Depends(get_db),
):
    try:
        # payment_instance, doctor = await upsert_async(data, token, db)

        # Call the billing history creation logic
        # await create_billing_entry(payment_instance, db, token)

        # changing functionality, webhook performs payment update
        # this endpoint will just send the new data to frontend
        doctor = db.query(User).filter_by(id=token.user_id).first()

        resp.status_code = status.HTTP_201_CREATED
        return {
            "message": "Payment details saved successfully",
            "data": "",
            "doctor": {
                "name": doctor.name,
                "email": doctor.email,
                "id": doctor.id,
                "credits": doctor.credits,
                "free_trial": doctor.free_trial,
                "role": doctor.role,
            },
        }
    except HTTPException as hx:
        raise HTTPException(status_code=hx.status_code, detail=hx.detail)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.post("/verify")
async def verify_payment(
        reference: str,
        token: Annotated[TokenData, Depends(decode_token)],
        paystack_service: Annotated[PaystackService, Depends(PaystackService)],
        db: Session = Depends(get_db),
) -> PaystackVerifyResponse:
    try:
        response = await paystack_service.verify_transaction(reference)
        if response.status is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail=response.message
            )
        return response
    except HTTPException as hx:
        raise HTTPException(status_code=hx.status_code, detail=hx.detail)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.post("/free")
async def free_trial_payment(
        token: Annotated[TokenData, Depends(decode_token)],
        db: Session = Depends(get_db),
):
    try:
        user = db.query(User).filter_by(id=token.user_id).first()

        if user.free_trial:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Free trial already used."
            )

        user.free_trial = True
        user.credits += 2
        db.commit()
        db.refresh(user)
        return {
            "message": "Free trial initiated",
            "doctor": UserSchema(**user.__dict__),
        }

    except HTTPException as hx:
        raise HTTPException(status_code=hx.status_code, detail=hx.detail)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.get("/")
async def retrieve_user_payments(
        token: Annotated[TokenData, Depends(decode_token)], db: Session = Depends(get_db)
):
    """endpoint to retrieve user payment details"""
    try:
        response = await retrieve_async(token, db)
        return {
            "message": "Payment details for user retrieved successfully",
            "data": response,
        }
    except HTTPException as hx:
        raise HTTPException(status_code=hx.status_code, detail=hx.detail)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def paystack_webhook(
        request: Request,
        paystack_service: Annotated[PaystackService, Depends(PaystackService)],
        db: Session = Depends(get_db),
) -> JSONResponse:
    """This function creates a webhook, that'll receive a response from Paystack."""
    try:
        payload = await request.body()
        signature = request.headers.get("x-paystack-signature")

        if not await paystack_service.verify_webhook_signature(payload, signature):
            raise HTTPException(status_code=400, detail="Invalid signature")

        event = await request.json()
        paystack_event_type = event["event"]
        if paystack_event_type.startswith("charge"):
            transaction_data = SuccessfulTransaction(**event["data"])

            data = PaymentCreate(
                reference=transaction_data.reference,
                transaction=transaction_data.reference,
                trxref=transaction_data.reference,
                amount=int(transaction_data.amount),
            )

            token = TokenData(email=transaction_data.customer.email)
            await upsert_async(data, token, db)

            return JSONResponse(
                content={"message": "Transaction Payment processed successfully"},
                status_code=200,
            )
        else:
            print("Failed to update payment")
            return JSONResponse(
                content={"message": "Invalid Webhook event"},
                status_code=200,
            )
    except HTTPException as e:
        print(e.detail)
        return JSONResponse(
            content={"message": "Error processing transaction"}, status_code=200
        )
    except Exception as e:
        print(e)
        return JSONResponse(
            content={"message": "Error processing transaction"}, status_code=500
        )
