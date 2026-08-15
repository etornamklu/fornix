"""diagnosis controllers"""
from io import BytesIO
from pathlib import Path

from loguru import logger
from fastapi import APIRouter, Body, Depends, HTTPException, UploadFile
from langchain.chat_models import init_chat_model
from sse_starlette import EventSourceResponse


from src.controller.doc_patient import process_audio_chunks
from src.controller.diagnosis import summary_event_gen, diagnosis_from_summary_event_gen, clinical_diagnosis
from src.controller.stream_response import StreamEventHandler
from src.prompts.diagnosis import FORMAT_DOCTOR_NOTES
from src.core.DoctorDashboard.diagnosis.utils import stream_async_iterator
from src.core.DoctorDashboard.lab_test_and_medications.workflow import (
    DoctorDashboardWorkflow,
)
from src.core.DoctorDashboard.patient_data_schema import PatientDataMod
from src.libraries.config import get_settings
from src.services.redis import get_transcribed_text_from_cache, delete_cache
from src.utils.types import ClinicalCompletionRequestBody
from src.controller.external import authenticate_request

router = APIRouter()
# Refactored paths using pathlib.Path
DIAGNOSIS_TEMPLATE_PATH = Path("src/core/DoctorDashboard/templates/diff_diagnosis.json")
CLINICAL_PLAN_TEMPLATE_PATH = Path(
    "src/core/DoctorDashboard/templates/clinical_plan.json"
)

settings = get_settings()

llm = init_chat_model(
    model=settings.llm,
    model_provider=settings.llm_provider,
    temperature=settings.llm_temperature,
    streaming=True,
    stream_usage=True,
)

medical_service = DoctorDashboardWorkflow(llm=llm)


@router.post("/diagnosis/summary")
async def get_patient_summary(
        patient_info: PatientDataMod,
        _authenticated: bool = Depends(authenticate_request)
):
    """endpoint for creating patient summary"""
    try:
        stream_handler = StreamEventHandler(on_chat_model_stream=stream_async_iterator)

        event_gen = summary_event_gen(patient_info)

        return EventSourceResponse(stream_handler.stream_llm_response(event_gen))

    except HTTPException as hx:
        raise hx
    except Exception as e:
        logger.error(str(e))
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/diagnosis/summary/voice")
async def get_summary_from_voice(
        file: UploadFile,
        audio_id: str | None = None,
        _authenticated: bool = Depends(authenticate_request)
):
    try:
        logger.info(f"Received Audio with size: {file.size * 0.000001} mb, type: {file.content_type}")
        raw_audio_bytes = await file.read()
        audio_data = BytesIO(raw_audio_bytes)
        audio_data.name = file.filename

        cached_data = ""
        if audio_id:
            cached_data = get_transcribed_text_from_cache(audio_id)
            delete_cache(audio_id)

        data = cached_data + await process_audio_chunks(audio_data)
        logger.info(f"audio data: {data}")

        structured_llm = llm.with_structured_output(PatientDataMod)
        patient_info = structured_llm.invoke(FORMAT_DOCTOR_NOTES.format(data=data))

        stream_handler = StreamEventHandler(on_chat_model_stream=stream_async_iterator)

        event_gen = summary_event_gen(PatientDataMod(**patient_info))
        return EventSourceResponse(stream_handler.stream_llm_response(event_gen))

    except Exception as e:
        logger.error(str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/diagnosis/diagnose")
async def get_diagnosis_from_summary(
        summary: str = Body(..., embed=True),
        _authenticated: bool = Depends(authenticate_request)
):
    """endpoint for streaming fornix ai diagnosis from patient summary"""
    try:
        stream_handler = StreamEventHandler(on_chat_model_stream=stream_async_iterator)
        event_gen = diagnosis_from_summary_event_gen(summary)

        return EventSourceResponse(stream_handler.stream_llm_response(event_gen))

    except HTTPException as hx:
        raise hx
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e



@router.post("/diagnosis/diagnose/clinical")
async def get_clinical_diagnosis_base(
        body: ClinicalCompletionRequestBody,
        _authenticated: bool = Depends(authenticate_request)
):
    """endpoint for making diagnosis with less control"""
    try:
        return clinical_diagnosis(body)

    except HTTPException as hx:
        logger.error(str(hx))
        raise hx
    except Exception as e:
        logger.error(str(e))
        raise HTTPException(status_code=500, detail=str(e)) from e
