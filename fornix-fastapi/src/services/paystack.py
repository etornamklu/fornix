"""Paystack service module."""

import hashlib
import hmac
import os
from uuid import UUID

import httpx
from fastapi import HTTPException

from src.database.schema.third_party.paystack import (
    CreatePayment,
    InitiatePaymentResponse,
    PaystackVerifyResponse,
)
from src.database.schema.user import TokenData
from src.utils.helpers import Helpers


class PaystackService:
    def __init__(self):
        self.base_url = os.getenv("PAYSTACK_BASE_URL", "")
        self.secret_key = os.getenv("PAYSTACK_TEST_SECRET_KEY", "")

    async def initiate_payment(
        self, create_payment: CreatePayment, amount: float, token: TokenData
    ) -> InitiatePaymentResponse:
        """This function creates a mobile money payment transaction using the Paystack API."""
        if amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be greater than 0")

        try:
            url = f"{self.base_url}transaction/initialize"
            reference = Helpers.generate_n_digit_uuid(16)
            headers = {
                "Authorization": f"Bearer {self.secret_key}",
                "Content-Type": "application/json",
            }
            data = {
                "amount": float(amount * 100),
                "email": create_payment.email,
                "currency": "GHS",
                "channels": ["mobile_money"],
                "metadata": {
                    "custom_fields": [
                        {
                            "display_name": "user_id",
                            "variable_name": "user_id",
                            "value": str(token.user_id),
                        },
                        {
                            "display_name": "name",
                            "variable_name": "name",
                            "value": token.name,
                        },
                        {
                            "display_name": "amount_in_pesewas",
                            "variable_name": "amount_in_pesewas",
                            "value": str(Helpers.cedis_to_pesewas(amount)),
                        },
                        {
                            "display_name": "is_test",
                            "variable_name": "is_test",
                            "value": True,
                        },
                    ]
                },
                "reference": reference,
            }

            async with httpx.AsyncClient() as client:
                response = await client.post(url, headers=headers, json=data)
                response.raise_for_status()

                parsed_response = InitiatePaymentResponse(**response.json())

                return parsed_response

        except httpx.HTTPStatusError as exc:
            raise HTTPException(
                status_code=exc.response.status_code,
                detail=f"Paystack API error: {exc.response.json().get('message', 'Unknown error')}",
            ) from exc
        except Exception as exc:
            print(exc)
            raise HTTPException(
                status_code=500, detail=f"An unexpected error occurred: {str(exc)}"
            ) from exc

    async def verify_transaction(self, reference: str) -> PaystackVerifyResponse:
        """This function verifies a Paystack transaction and returns the parsed response."""
        try:
            url = f"{self.base_url}transaction/verify/{reference}"
            headers = {
                "Authorization": f"Bearer {self.secret_key}",
                "Content-Type": "application/json",
            }

            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers)
                response.raise_for_status()

                paystack_response = PaystackVerifyResponse(**response.json())
                return paystack_response

        except httpx.HTTPStatusError as exc:
            raise HTTPException(
                status_code=exc.response.status_code,
                detail=f"Paystack API error: {exc.response.json().get('message', 'Unknown error')}",
            ) from exc
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"An error occurred while verifying the transaction: {str(exc)}",
            ) from exc

    async def verify_webhook_signature(self, payload: dict, signature: str) -> bool:
        """This function verifies the signature of a webhook payload."""
        computed_signature = hmac.new(
            self.secret_key.encode(), msg=payload, digestmod=hashlib.sha512
        ).hexdigest()

        return computed_signature == signature
