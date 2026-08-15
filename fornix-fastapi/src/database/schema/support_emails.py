from enum import Enum
from pydantic import BaseModel

class EmailType(str, Enum):
    DEFAULT = "default"
    SUPPORT = "support"
    DEMO_REQUEST = "demo_request"
    SALES = "sales"

class EmailRequest(BaseModel):
    message: dict
    email_type: EmailType = EmailType.DEFAULT
