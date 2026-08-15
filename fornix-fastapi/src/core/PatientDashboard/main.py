from pydantic import BaseModel as BaseModel2
from langchain_openai.chat_models import ChatOpenAI
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from fastapi import FastAPI, status, HTTPException
from dashboard.dashboard import PatientDataCollectorChain
from schema.patient_data_schema import StaticPatientData
import uvicorn
from dotenv import load_dotenv
import asyncio

load_dotenv()


app = FastAPI()


class Message(BaseModel2):
    message: str


def load_llm(temperature: float):
    llm = ChatOpenAI(
        temperature=temperature,
        streaming=True,
        callbacks=[StreamingStdOutCallbackHandler()],
        model="gpt-3.5-turbo",
    )
    return llm


def get_patient(patient_id: int):
    try:
        return patient_id, database["static_data"][patient_id]
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with id {patient_id} not found! Fill static data first.",
        )


database = {}
llm = load_llm(0.7)
collector = PatientDataCollectorChain(llm, True)


@app.post("/get_static_data", status_code=status.HTTP_201_CREATED)
def get_static_data(patient_id: int, patient: StaticPatientData):
    database[patient_id] = patient.model_dump()
    return {"message": "Data successfully stored!"}


@app.post("/collect_data")
async def collect_data(
    patient_id: int,
    message: Message,
):
    query = message.message
    static_data = database.get(patient_id)
    response = await collector.get_completion(query, static_data)

    async def update_database():
        await collector.invoke_task
        database[patient_id] = collector.patient.model_dump()

    asyncio.create_task(update_database())

    return response


@app.get("/patient/{patient_id}", status_code=status.HTTP_200_OK)
def show_patient(patient_id: int):
    patient = database.get(patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with id {patient_id} not in database",
        )
    return patient


if __name__ == "__main__":
    uvicorn.run(app, port=5000)
