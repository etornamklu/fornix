from fastapi import APIRouter, Depends, HTTPException, status, responses
from fastapi.security import APIKeyQuery
from sqlalchemy.orm import Session
from pydantic import BaseModel

from src.database.database_connection import get_db
from src.database.models import CreditConstants

router = APIRouter()


class CreditConstantsBase(BaseModel):
    route: str
    required_credit: float
    input_rates: float
    output_rates: float

    class Config:
        orm_mode = True


@router.post("", response_model=list[CreditConstantsBase] | CreditConstantsBase)
def create_credit_constants(
        credit_constants: list[CreditConstantsBase] | CreditConstantsBase,
        db: Session = Depends(get_db),
):
    if isinstance(credit_constants, list):
        credit_constants = [
            CreditConstants(**item.model_dump()) for item in credit_constants
        ]
        db.add_all(credit_constants)
    else:
        credit_constants = CreditConstants(**credit_constants.model_dump())
        db.add(credit_constants)

    db.commit()
    db.refresh(credit_constants)

    return credit_constants


@router.get("", response_model=CreditConstantsBase | None)
async def get_credit_constant(route: str, db: Session = Depends(get_db)):
    credit_constant = (
        db.query(CreditConstants).filter(CreditConstants.route == route).first()
    )

    if credit_constant:
        return credit_constant

    return None


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_credit_constant(route: str, db: Session = Depends(get_db)):
    credit_constant = db.query(CreditConstants).filter(CreditConstants.route == route).first()

    if credit_constant:
        db.delete(credit_constant)
        db.commit()
        return responses.Response(status_code=status.HTTP_204_NO_CONTENT)

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"{route} was not found"
    )


@router.put("", response_model=CreditConstantsBase, status_code=status.HTTP_200_OK)
def update_credit_constant(
        route: str,
        updated_credit_constant: CreditConstantsBase,
        db: Session = Depends(get_db),
):
    credit_constant = db.query(CreditConstants).filter(CreditConstants.route == route).first()

    if not credit_constant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Route '{route}' was not found"
        )

    for key, value in updated_credit_constant.model_dump().items():
        setattr(credit_constant, key, value)

    db.commit()
    db.refresh(credit_constant)
    return credit_constant
