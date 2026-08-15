"""main.py root file"""

import os
from contextlib import asynccontextmanager
from logging.config import dictConfig
import logging

import alembic.config
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
# from sqlalchemy.orm import Session
from starlette.middleware.cors import CORSMiddleware

from src.database.database_connection import (
    DB_USER,
    DB_PASSWORD,
    DB_HOST,
    DB_PORT,
    DB_NAME,
)
from src.libraries.config import get_settings
from src.middleware.credit_system import CreditMiddleware
from src.router import auth, doctor_dashboard_diagnosis, user_connections
from src.router import billing_history
from src.router import (
    files,
    test_connection,
    diagnosis,
    doctor,
    payment,
    ai_patient,
    doc_patient,
    patient_data,
    support_emails,
    radiologist,
    lab_reports,
    organization,
    external
)
from src.utils.populate_plans import populate_plans

# from src.database.schema.doctor import UserSignup

load_dotenv()
port = int(os.getenv("PORT", default=8000))  # type:ignore
settings = get_settings()

sample_logger = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "access": {
            "()": "uvicorn.logging.AccessFormatter",
            "fmt": (
                '%(levelprefix)s %(asctime)s :: %(client_addr)s - "%(request_line)s" %(status_code)s'
            ),
            "use_colors": True,
        },
    },
    "handlers": {
        "access": {
            "formatter": "access",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stdout",
        },
    },
    "loggers": {
        "uvicorn.access": {"handlers": ["access"], "level": "INFO", "propagate": False},
    },
}

dictConfig(sample_logger)


def run_migrations() -> None:
    print('trying migrations...')
    try:
        logging.getLogger('alembic').setLevel(logging.INFO)
        alembicArgs = [
            '--raiseerr',
            'upgrade', 'head',
        ]
        alembic.config.main(argv=alembicArgs)
    except Exception as e:
        logging.getLogger('alembic').setLevel(logging.ERROR)
        print('migrations failed:')
        print(e)
        raise
    print('migrations complete')


@asynccontextmanager
async def lifespan(_app: FastAPI):
    print("beginning lifespan, starting server")
    # async with AsyncPostgresSaver.from_conn_string(
    #         settings.database_url
    # ) as checkpointer:
    #     await checkpointer.setup()
    run_migrations()
    populate_plans()
    print('running server')
    yield
    print("ending lifespan")


app = FastAPI(
    docs_url=os.getenv("DOCS", None),
    redoc_url=os.getenv("DOCS", None),
    lifespan=lifespan,
)

app.add_middleware(CreditMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["x-credits"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
# app.include_router(
#     credit_constants.router, prefix="/credit-constants", tags=["credit-constants"]
# )
app.include_router(test_connection.router, tags=["test"])
app.include_router(files.router, tags=["files"])
app.include_router(diagnosis.router, prefix="/diagnosis", tags=["diagnosis"])
app.include_router(doctor.router, prefix="/doctor", tags=["doctor"])
app.include_router(radiologist.router, prefix="/radiologist", tags=["Radiology And Labs"])
app.include_router(lab_reports.router, prefix="/labs", tags=["Radiology And Labs"])
app.include_router(doc_patient.router, prefix="/doc-patient", tags=["doc patient"])
# app.include_router(patient.router, prefix="/patient", tags=["patient"])
app.include_router(ai_patient.router, prefix="/patient", tags=["patient"])
app.include_router(payment.router, prefix="/payment", tags=["payments"])
app.include_router(
    doctor_dashboard_diagnosis.router,
    prefix="/ddd",
    tags=["doctor dashboard diagnosis"],
)
app.include_router(billing_history.router, prefix="/billing", tags=["billing-history"])
app.include_router(patient_data.router, prefix="/patient", tags=["patient"])
app.include_router(user_connections.router, tags=["connections"])
app.include_router(support_emails.router, tags=["Support"])
app.include_router(organization.router, tags=["organization"])
app.include_router(external.router, prefix="/external",tags=["external"])

SQLALCHEMY_DATABASE_URL = (
    f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

if __name__ == "__main__":
    print("running app")
    uvicorn.run(app, host="0.0.0.0", port=port, log_config=sample_logger)
