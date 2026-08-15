from langchain_core.pydantic_v1 import BaseModel, Field


class PermissionDenied(BaseModel):
    permission_denied: bool = Field(
        ..., description="Permission denied to access the data."
    )
    detail: str = Field(..., description="Reason for permission denial.")
