from typing import Dict
from langchain_core.pydantic_v1 import BaseModel, Field, root_validator


class BaseSchema(BaseModel):
    pass

    @root_validator(pre=True)
    def validate_fields(cls, values: Dict) -> Dict:
        for key, value in values.items():
            if not value and not isinstance(value, bool):
                values[key] = None
        return values