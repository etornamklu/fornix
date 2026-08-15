"""patient controllers"""

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session
from starlette import status
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain_openai.chat_models import ChatOpenAI
from pydantic import BaseModel as BaseModel2
from passlib.context import CryptContext

from src.database.schema.patient_static import (
    PatientStaticAddressPage,
    PatientStaticFirst,
    PatientStaticHabits,
    PatientStaticMedicalHistory,
    PatientStaticSecond,
)
from src.controller.auth import decode_token, patient_decode_token
from src.core.PatientDashboard.schema.patient_data_schema import (
    DynamicPatientData,
    StaticPatientData,
)
from src.database.database_connection import get_db
# from src.database.models import PatientDynamicData
# from src.database.models.patient_data import PatientStaticData
from src.core.PatientDashboard.dashboard.dashboard import PatientDataCollectorChain
from src.controller.patient_controller import (
    collect_patient_dynamic_data,
    store_patient_static_data,
    set_auth_cookie
)
from src.database.schema.user import TokenData
from src.libraries.config import get_settings

router = APIRouter()


oauth2_scheme_patient = OAuth2PasswordBearer(tokenUrl="auth")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class Message(BaseModel2):
    """class for message request body"""

    message: str


def load_llm(temperature: float):
    """function for loading chatgpt llm"""
    gpt_llm = ChatOpenAI(
        temperature=temperature,
        streaming=True,
        callbacks=[StreamingStdOutCallbackHandler()],
        model=get_settings().llm,
    )
    return gpt_llm


llm = load_llm(0.7)
collector = PatientDataCollectorChain(llm, True)


@router.post("/questionnaire/")
async def patient_questionnaire(
    message: Message,
    token: Annotated[TokenData, Depends(patient_decode_token)],
    db: Session = Depends(get_db),
    dynamic_data_id: str = "",
):
    """
    `dynamic_data_id` is optional and if provided, it will update the existing dynamic data with new details. Else it will create a new dynamic_data for that patient
    """
    try:
        patient_data = PatientDynamicData()
        db.add(patient_data)
        db.commit()
        db.refresh(patient_data)
        dynamic_id = dynamic_data_id or patient_data.id

        response = await collect_patient_dynamic_data(
            token.user_id, dynamic_id, db, message.message, collector
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


# @router.post("/static", status_code=status.HTTP_201_CREATED)
# async def store_static_data(
#     patient_static_data: StaticPatientData, db: Session = Depends(get_db)
# ):
#     """endpoint to store patient static data"""
#     try:
#         patient = db.query(User).filter(User.email == patient_static_data.email).first()
#         if patient:
#             raise HTTPException(
#                 status_code=status.HTTP_400_BAD_REQUEST,
#                 detail="Patient already exists",
#             )
#         patient_data = PatientStaticData(**patient_static_data.model_dump())
#         db.add(patient_data)
#         db.commit()
#         db.refresh(patient_data)
#         response_data = StaticPatientData(**patient_data.__dict__)

#         return {
#             "message": "Patient Static Data created successfully",
#             "patient_static_data": {"id": patient_data.id, **response_data.__dict__},
#         }

#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail=str(e) or "Patient already exists",
#         ) from e


@router.post("/static/bio/1")
async def save_static_data_demographic(
    patient_static_data: PatientStaticFirst,
    token: Annotated[TokenData, Depends(patient_decode_token)],
    db: Session = Depends(get_db),
):
    """endpoint for storing patient demographic"""
    return store_patient_static_data(
        patient_static_data, PatientStaticFirst, "demographics", token, db
    )


@router.post("/static/bio/2")
async def save_static_data_demographic_second(
    patient_static_data: PatientStaticSecond,
    token: Annotated[TokenData, Depends(patient_decode_token)],
    db: Session = Depends(get_db),
):
    """endpoint for storing patient demographic 2"""
    return store_patient_static_data(
        patient_static_data,
        PatientStaticSecond,
        "occupation and marital status",
        token,
        db,
    )


@router.post("/static/bio/3")
async def save_static_data_demographic_address(
    patient_static_data: PatientStaticAddressPage,
    token: Annotated[TokenData, Depends(patient_decode_token)],
    db: Session = Depends(get_db),
):
    """endpoint for storing patient address"""
    return store_patient_static_data(
        patient_static_data, PatientStaticAddressPage, "address details", token, db
    )


@router.post("/static/bio/4")
async def save_static_data_demographic_medical_history(
    patient_static_data: PatientStaticMedicalHistory,
    token: Annotated[TokenData, Depends(patient_decode_token)],
    db: Session = Depends(get_db),
):
    """endpoint for storing patient medical history"""
    return store_patient_static_data(
        patient_static_data, PatientStaticMedicalHistory, "medical history", token, db
    )


@router.post("/static/bio/5")
async def save_static_data_demographic_habits(
    patient_static_data: PatientStaticHabits,
    token: Annotated[TokenData, Depends(patient_decode_token)],
    db: Session = Depends(get_db),
):
    """endpoint for storing patient habits"""
    return store_patient_static_data(
        patient_static_data, PatientStaticHabits, "patient habits", token, db
    )


@router.get("/static")
async def get_static_data(
    response: Response,
    token: Annotated[TokenData, Depends(patient_decode_token)],
    db: Session = Depends(get_db),
):
    """endpoint to retrieve patient static data"""
    try:
        query = select(PatientStaticData).filter(
            PatientStaticData.patient_id == token.user_id
        )
        result = db.execute(query).scalar()
        response_data = StaticPatientData(**result.__dict__)
        data_res = response_data.__dict__
        count = len(data_res.values())
        completed = 0
        for value in data_res.values():
            if value:
                completed += 1
        percentage_done = round((completed / count) * 100)

        if not result:
            response.status_code = status.HTTP_404_NOT_FOUND
            return {"message": "Patient Data Not Found"}

        return {
            "message": "Patient Static Data retrieved successfully",
            "patient_static_data": {
                "fields_filled": completed,
                "total_fields": count,
                "percent_completed": percentage_done,
                "id": result.id,
                "patient_id": result.patient_id,
                "patient_static_data": response_data,
            },
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/dynamic", status_code=status.HTTP_201_CREATED)
async def store_dynamic_data(
    patient_dynamic_data: DynamicPatientData, db: Session = Depends(get_db)
):
    """endpoint to create dynamic data"""
    try:
        patient_data = PatientDynamicData(**patient_dynamic_data.model_dump())
        db.add(patient_data)
        db.commit()
        db.refresh(patient_data)

        return {
            "message": "Patient Dynamic Data created successfully",
            "patient_dynamic_data": {
                "id": patient_data.id,
                **patient_data.__dict__,
            },
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/test_token")
async def test_token(token: Annotated[TokenData,
                                      Depends(patient_decode_token)],
                     response: Response):
    set_auth_cookie(response,token.access_token)
    return {'message': "token set in cookies"}
