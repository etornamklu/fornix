"""Doctors controllers"""

import asyncio
import base64
import json
from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, UploadFile, Form
from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.output_parsers import JsonOutputToolsParser
from loguru import logger
from openai import OpenAIError
from pydantic import ValidationError
from sqlalchemy import desc
from sqlalchemy.orm import Session
from sse_starlette import EventSourceResponse
from starlette import status

from src.controller.auth import radiologist_decode_token
from src.controller.stream_response import StreamEventHandler
from src.core.DoctorDashboard.diagnosis.utils import stream_async_iterator
from src.database.database_connection import get_db
from src.database.models.files import ImageUpload
from src.database.models.radiologist import LabReports
from src.database.schema.lab_reports import ReportUpdate, GeneralLabReport, ReportType, ReportMetadata
from src.database.schema.user import TokenData
from src.libraries.config import get_settings
from src.prompts.lab_reports import LAB_REPORT_PROMPT

router = APIRouter()
settings = get_settings()

llm = init_chat_model(
    model=settings.llm,
    model_provider=settings.llm_provider,
    temperature=settings.llm_temperature,
    streaming=True,
    stream_usage=True,
)


@router.post("/reports", response_class=EventSourceResponse)
async def stream_image_analysis(
        files: list[UploadFile],
        request: str = Form(...),
        token_data: TokenData = Depends(radiologist_decode_token),
        db: Session = Depends(get_db),
) -> EventSourceResponse:
    try:
        try:
            request_dict = json.loads(request)
            metadata = ReportMetadata(**request_dict)
        except ValidationError as e:
            logger.error(f"Metadata validation error: {e}")
            raise HTTPException(status_code=422, detail=str(e))

        report_id = str(uuid4())
        report_type = metadata.report_type

        report = LabReports(
            id=report_id,
            technician_id=token_data.user_id,
            patient_id=metadata.patient_id,
            clinical_context=metadata.clinical_context,
            name=f'{report_type.upper()} REPORT_{datetime.now().strftime("%Y-%m-%d_%H:%M:%S")}',
            type=report_type,
            content={},
        )
        db.add(report)
        db.flush()

        image_messages = []

        for file in files:
            file_content = await file.read()
            image_data = base64.b64encode(file_content).decode("utf-8")
            report_type = metadata.report_type

            upload = ImageUpload(
                id=str(uuid4()),
                user_id=token_data.user_id,
                lab_report_id=report_id,
                filename=f"{report_type.upper()} REPORT_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                content_type=file.content_type or "application/octet-stream",
                content=file_content,
            )
            db.add(upload)

            image_messages.append(
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:{file.content_type};base64,{image_data}"
                    },
                }
            )

        db.flush()

        report_schema, prompt = GeneralLabReport, LAB_REPORT_PROMPT

        messages = [
            SystemMessage(content=prompt.format(
                clinical_context=metadata.clinical_context,
                report_type=report_type,
            )),
            HumanMessage(
                content=[
                    {
                        "type": "text",
                        "text": f"Attached are the {report_type} image files for analysis. Use the images to generate the comprehensive report.",
                    },
                    *image_messages,
                ]
            ),
        ]

        chain = (
                llm.bind_tools(
                    tools=[report_schema], tool_choice=report_schema.__name__
                ).with_config(config={"tags": ["analysis"]})
                | JsonOutputToolsParser(first_tool_only=True)
                | (lambda x: report_schema(**x["args"]))
        )

        stream_handler = StreamEventHandler(on_chat_model_stream=stream_async_iterator)
        event_gen = chain.astream_events(
            messages, version="v2", include_tags=["analysis"]
        )

        chunks = []

        async def event_stream():
            yield json.dumps({"report_id": report_id})

            async for chunk in stream_handler.stream_llm_response(event_gen):
                if "token_stat" not in chunk:
                    chunks.append(chunk)
                yield chunk

            processed_chunks = "".join(chunks)
            data_dict = json.loads(processed_chunks)
            report_content = report_schema.model_validate(data_dict)

            report.content = report_content.model_dump(exclude_unset=True)
            db.commit()

        return EventSourceResponse(event_stream(), media_type="text/event-stream")
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid metadata JSON format",
        ) from e
    except HTTPException as e:
        raise e
    except OpenAIError as e:
        logger.error(f"OpenAI API error: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e),
        ) from e
    except asyncio.CancelledError as e:
        logger.error(f"Report generation cancelled: {e}")
        raise HTTPException(
            status_code=499,
            detail="Report generation cancelled by client(fornix backend cancelled request)",
        )
    except Exception as e:
        logger.error(f"Error generating report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e


@router.get("/reports")
async def get_image_reports(
        report_type: ReportType | None = None,
        token_data: TokenData = Depends(radiologist_decode_token),
        db: Session = Depends(get_db),
):
    try:
        query = db.query(LabReports).filter(
            LabReports.technician_id == token_data.user_id
        )

        if not report_type:
            # If no report type is specified, return all reports
            reports = query.order_by(desc(LabReports.updated_at)).all()

            return [
                {
                    "id": report.id,
                    "name": report.name,
                    "created_at": report.created_at,
                    "updated_at": report.updated_at,
                    "patient_id": report.patient_id,
                    "type": report.type,
                }
                for report in reports
            ]

        reports = (
            query.filter(LabReports.type == report_type)
            .order_by(desc(LabReports.updated_at))
            .all()
        )
        return [
            {
                "id": report.id,
                "name": report.name,
                "created_at": report.created_at,
                "updated_at": report.updated_at,
                "patient_id": report.patient_id,
            }
            for report in reports
        ]

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error fetching reports: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reports/{report_id}")
async def get_image_report(
        report_id: str,
        token_data: TokenData = Depends(radiologist_decode_token),
        db: Session = Depends(get_db),
):
    try:
        report = (
            db.query(LabReports)
            .filter(
                LabReports.id == report_id,
                LabReports.technician_id == token_data.user_id,
            )
            .first()
        )
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

        return report
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error fetching report: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/reports/{report_id}")
async def update_image_report(
        report_id: str,
        request: ReportUpdate,
        token_data: TokenData = Depends(radiologist_decode_token),
        db: Session = Depends(get_db),
):
    try:
        report = (
            db.query(LabReports)
            .filter(
                LabReports.id == report_id,
                LabReports.technician_id == token_data.user_id,
            )
            .first()
        )
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

        for key, value in request.model_dump().items():
            if value is not None:
                setattr(report, key, value)

        db.commit()
        db.refresh(report)
        return report
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error updating report: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reports/{report_id}/unlink-patient")
async def unlink_patient_from_diagnosis(
        report_id: str,
        token_data: TokenData = Depends(radiologist_decode_token),
        db: Session = Depends(get_db),
):
    try:
        report = (
            db.query(LabReports).
            filter(LabReports.id == report_id,
                   LabReports.technician_id == token_data.user_id).
            first()
        )

        if not report:
            raise HTTPException(
                status_code=404, detail=f"Report with id {report_id} not found"
            )

        # Unlink patient by setting patient_id to None
        report.patient_id = None
        db.commit()
        db.refresh(report)

        return report

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/reports/{report_id}")
async def delete_image_report(
        report_id: str,
        token_data: TokenData = Depends(radiologist_decode_token),
        db: Session = Depends(get_db),
):
    try:
        report = (
            db.query(LabReports)
            .filter(
                LabReports.id == report_id,
                LabReports.technician_id == token_data.user_id,
            )
            .first()
        )
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        db.delete(report)
        db.commit()
        return {"message": "Report deleted successfully"}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error deleting report: {e}")
        raise HTTPException(status_code=500, detail=str(e))
