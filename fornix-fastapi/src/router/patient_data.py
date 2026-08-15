from fastapi import APIRouter, Depends, HTTPException, status, Path
from loguru import logger
from sqlalchemy import desc
from sse_starlette import EventSourceResponse

from src.controller.auth import decode_token
from src.controller.patient_data import validate_patient, get_patient_data_response
from src.database.models import User
from src.database.schema.user import TokenData
from sqlalchemy.orm import Session
from src.database.database_connection import get_db
from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage
from langchain_core.output_parsers.openai_tools import JsonOutputToolsParser
from src.libraries.config import get_settings
from typing import Annotated, Optional
from src.controller.user_connections import validate_user_access
from src.controller.stream_response import StreamEventHandler
from src.database.models.patient_data import (
    PersonalInformation, FamilyHistory,
    SocialHistory, SystemicEnquiry,
    ChiefComplaint, MedicalHistory, DrugHistoryAndAllergies
)
from uuid import UUID

from src.controller.patient_controller import get_patient_medfind_data
from src.core.DoctorDashboard.doctor_patient_conversation.report.output_schemas import PatientHistory
from src.core.DoctorDashboard.doctor_patient_conversation.report.prompt import REPORT_PROMPT_TEMPLATE
from src.core.DoctorDashboard.diagnosis.utils import stream_async_iterator

router = APIRouter()

settings = get_settings()

llm = init_chat_model(
    model=settings.llm,
    model_provider=settings.llm_provider,
    temperature=settings.llm_temperature,
    streaming=True,
    stream_usage=True,
)


@router.get("/personal-info/{patient_id}/")
def personal_info(
        patient_id: UUID,
        token: Annotated[TokenData, Depends(validate_user_access)],
        db: Session = Depends(get_db)
):
    try:
        personal_info = db.query(PersonalInformation).filter(PersonalInformation.patient_id == patient_id).first()

        if not personal_info:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Personal information not found.")

        return {
            "message": "Personal information retrieved successfully",
            "data": personal_info,
        }

    except HTTPException as http_err:
        raise http_err

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve personal information: {str(e) or 'An unknown error occurred'}"
        )


@router.get("/family-history/{patient_id}/")
def family_history(
        patient_id: UUID,
        token: Annotated[TokenData, Depends(validate_user_access)],
        # token: Annotated[TokenData, Depends(decode_token)],
        db: Session = Depends(get_db)
):
    try:
        family_history = db.query(FamilyHistory).filter(FamilyHistory.patient_id == patient_id).first()

        if not family_history:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family history not found.")

        return {
            "message": "Family history retrieved successfully",
            "data": family_history,
        }

    except HTTPException as http_err:
        raise http_err

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve family history: {str(e) or 'An unknown error occurred'}"
        )


@router.get("/social-history/{patient_id}/")
def social_history(
        patient_id: UUID,
        # token: Annotated[TokenData, Depends(decode_token)],
        token: Annotated[TokenData, Depends(validate_user_access)],
        db: Session = Depends(get_db)
):
    try:
        social_history = db.query(SocialHistory).filter(SocialHistory.patient_id == patient_id).first()

        if not social_history:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Social history not found.")

        return {
            "message": "Social history retrieved successfully",
            "data": social_history,
        }

    except HTTPException as http_err:
        raise http_err

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve social history: {str(e) or 'An unknown error occurred'}"
        )


@router.get("/chief-complaint/{patient_id}/")
def get_chief_complaint(
        patient_id: UUID,
        # token: Annotated[TokenData, Depends(decode_token)],
        token: Annotated[TokenData, Depends(validate_user_access)],
        db: Session = Depends(get_db)
):
    try:
        chief_complaints = (
            db.query(ChiefComplaint)
            .filter(ChiefComplaint.patient_id == patient_id)
            .order_by(desc(ChiefComplaint.created_at)).all()
        )

        if not chief_complaints:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chief complaint not found.")

        return {
            "message": "Chief complaints retrieved successfully",
            "data": chief_complaints,
        }

    except HTTPException as http_err:
        raise http_err

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve chief complaint: {str(e) or 'An unknown error occurred'}"
        )


@router.get("/medical-history/{patient_id}/")
def get_medical_history(
        patient_id: UUID,
        # token: Annotated[TokenData, Depends(decode_token)],
        token: Annotated[TokenData, Depends(validate_user_access)],
        db: Session = Depends(get_db)):
    try:
        medical_history = db.query(MedicalHistory).filter(MedicalHistory.patient_id == patient_id).first()

        if not medical_history:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medical history not found.")

        return {
            "message": "Medical history retrieved successfully",
            "data": medical_history,
        }

    except HTTPException as http_err:
        raise http_err

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve medical history: {str(e) or 'An unknown error occurred'}"
        )


@router.get("/systemic-enquiry/{patient_id}/")
def get_systemic_enquiry(
        patient_id: UUID,
        # token: Annotated[TokenData, Depends(decode_token)],
        token: Annotated[TokenData, Depends(validate_user_access)],
        db: Session = Depends(get_db)
):
    try:
        systemic_enquiry = db.query(SystemicEnquiry).filter(SystemicEnquiry.patient_id == patient_id).first()

        if not systemic_enquiry:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Systemic enquiry not found.")

        return {
            "message": "Systemic enquiry retrieved successfully",
            "data": systemic_enquiry,
        }

    except HTTPException as http_err:
        raise http_err

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve systemic enquiry: {str(e) or 'An unknown error occurred'}"
        )


@router.get("/drug-history-and-allergies/{patient_id}/")
def get_drug_history_and_allergies(
        patient_id: UUID,
        # token: Annotated[TokenData, Depends(decode_token)],
        token: Annotated[TokenData, Depends(validate_user_access)],
        db: Session = Depends(get_db)):
    try:
        drug_history_and_allergies = db.query(DrugHistoryAndAllergies).filter(
            DrugHistoryAndAllergies.patient_id == patient_id).first()

        if not drug_history_and_allergies:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drug history and allergies not found.")

        return {
            "message": "Drug history and allergies retrieved successfully",
            "data": drug_history_and_allergies,
        }

    except HTTPException as http_err:
        raise http_err

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve drug history and allergies: {str(e) or 'An unknown error occurred'}"
        )


@router.get("/patient-data")
def get_current_patient_data(
        token: Annotated[TokenData, Depends(decode_token)],
        db: Session = Depends(get_db)
):
    try:
        user = db.query(User).filter(User.id == token.user_id).first()
        validate_patient(user)
        return get_patient_data_response(user)
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve patient data: {str(e) or 'An unknown error occurred'}"
        )


@router.get("/patient-data/{patient_id}/")
def get_specific_patient_data(
        patient_id: UUID,
        token: Annotated[TokenData, Depends(validate_user_access)],
        db: Session = Depends(get_db)
):
    try:
        user = db.query(User).filter(User.id == patient_id).first()
        validate_patient(user)
        return get_patient_data_response(user)
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve patient data: {str(e) or 'An unknown error occurred'}"
        )


@router.get("/patient-data/{patient_id}/narrative")
async def get_patient_summary(
        patient_id: UUID,
        # token: Annotated[TokenData, Depends(validate_user_access)],
        db: Session = Depends(get_db),
):
    """endpoint for creating patient summary"""
    try:

        patient_data = get_patient_medfind_data(patient_id=str(patient_id), db=db)
        if not patient_data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient data not found.")

        messages = [
            HumanMessage(content=REPORT_PROMPT_TEMPLATE.format(**{"transcript": patient_data}))
        ]
        chain = (
                llm.bind_tools(
                    tools=[PatientHistory], tool_choice=PatientHistory.__name__
                ).with_config(config={"tags": ["analysis"]})
                | JsonOutputToolsParser(first_tool_only=True)
                | (lambda x: PatientHistory(**x["args"]))
        )

        stream_handler = StreamEventHandler(on_chat_model_stream=stream_async_iterator)

        event_gen = chain.astream_events(
            messages, version="v2", include_tags=["analysis"]
        )
        return EventSourceResponse(stream_handler.stream_llm_response(event_gen))

    except HTTPException as hx:
        raise hx
    except Exception as e:
        logger.error(str(e))
        raise HTTPException(status_code=500, detail=str(e)) from e
