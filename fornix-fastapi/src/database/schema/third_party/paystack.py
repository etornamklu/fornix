"""Paystack schema module."""

from decimal import Decimal
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, field_validator


class Authorization(BaseModel):
    authorization_code: str
    bin: str
    last4: str
    exp_month: str
    exp_year: str
    channel: str
    card_type: str
    bank: Optional[str] = None
    country_code: str
    brand: str
    reusable: bool
    signature: str
    account_name: Optional[str] = None


class Customer(BaseModel):
    id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: str
    customer_code: str
    phone: Optional[str] = None
    metadata: Optional[Any] = None
    risk_action: str
    international_format_phone: Optional[str] = None


class LogHistoryItem(BaseModel):
    type: str
    message: str
    time: int


class Log(BaseModel):
    start_time: int
    time_spent: int
    attempts: int
    errors: int
    success: bool
    mobile: bool
    input: List[Any]
    history: List[LogHistoryItem]


class PaystackTransactionData(BaseModel):
    id: int
    domain: str
    status: str
    reference: str
    receipt_number: Optional[str] = None
    amount: int
    message: Optional[str] = None
    gateway_response: str
    paid_at: Optional[str]
    created_at: Optional[str]
    channel: str
    currency: str
    ip_address: Optional[str]
    metadata: Optional[str] = None
    log: Optional[Log] = None
    fees: int
    fees_split: Optional[Any] = None
    authorization: Optional[Authorization] = None
    customer: Optional[Customer] = None
    plan: Optional[Any] = None
    split: Dict[str, Any]
    order_id: Optional[str] = None
    paidAt: Optional[str]
    createdAt: Optional[str]
    requested_amount: int
    pos_transaction_data: Optional[Any] = None
    source: Optional[Any] = None
    fees_breakdown: Optional[Any] = None
    connect: Optional[Any] = None
    transaction_date: Optional[str]
    plan_object: Dict[str, Any]
    subaccount: Dict[str, Any]


class PaystackVerifyResponse(BaseModel):
    status: bool
    message: str
    data: PaystackTransactionData


#  Initiating payment
class PaymentData(BaseModel):
    authorization_url: str
    access_code: str
    reference: str


class InitiatePaymentResponse(BaseModel):
    status: bool
    message: str
    data: PaymentData


class CreatePayment(BaseModel):
    email: EmailStr
    amount: float


# Payment webhook verification
class CustomerData(BaseModel):
    """A model for the customer data."""

    email: str


class CustomField(BaseModel):
    """Custom field for paystack."""

    display_name: str
    variable_name: str
    value: str


class Metadata(BaseModel):
    """Metadata for paystack."""

    custom_fields: list[CustomField]


class SuccessfulTransaction(BaseModel):
    """A model for a successful transaction."""

    id: int
    status: str
    reference: str
    amount: float
    paid_at: str
    currency: str
    created_at: str
    customer: CustomerData
    metadata: Metadata | str | dict

    @field_validator(
        "amount",
    )
    def divide_amount_by_100(cls, v: Decimal) -> Decimal:
        """Divide the amount by 100."""
        return v / 100
