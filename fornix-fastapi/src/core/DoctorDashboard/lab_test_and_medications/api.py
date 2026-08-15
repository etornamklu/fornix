import os
import aiofiles
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, HTMLResponse
from pydantic import BaseModel
from langchain.chat_models import init_chat_model

from src.core.DoctorDashboard.lab_test_and_medications.workflow import (
    DoctorDashboardWorkflow,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PatientSummary(BaseModel):
    summary: str


def get_medical_service():
    return DoctorDashboardWorkflow(
        llm=init_chat_model(
            os.getenv("LLM", "gpt-4o"), streaming=True, stream_usage=True
        )
    )


@app.get("/", response_class=HTMLResponse)
async def read_root():
    async with aiofiles.open(
        "src/core/DoctorDashboard/lab_test_and_medications/index.html", "r"
    ) as f:
        return await f.read()


@app.post("/medication-and-surgical-recommendations")
async def medication_and_surgical_recommendations_endpoint(
    patient_data: PatientSummary,
    medical_service: DoctorDashboardWorkflow = Depends(get_medical_service),
):
    try:
        return StreamingResponse(
            medical_service.medication_and_surgical_recommendations(
                patient_data.summary
            ),
            media_type="application/json",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/lab-test-recommendations")
async def lab_test_recommendations_endpoint(
    patient_data: PatientSummary,
    medical_service: DoctorDashboardWorkflow = Depends(get_medical_service),
):
    try:
        return StreamingResponse(
            medical_service.lab_test_recommendation(patient_data.summary),
            media_type="application/json",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
