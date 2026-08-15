from datetime import datetime
from sqlalchemy import Column, DateTime, String, Float, Integer, event
from sqlalchemy.orm import Session

from src.database.models import Base


class CreditConstants(Base):
    __tablename__ = "credit_constants"

    id = Column(Integer, primary_key=True, autoincrement=True)
    route = Column(String, nullable=False)
    required_credit = Column(Float, nullable=False, default=1.0)
    input_rates = Column(Float, nullable=False, default=0.0)
    output_rates = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, nullable=False, default=datetime.now)


DEFAULT_CREDIT_CONSTANTS = [
    {
        "route": "summary",
        "required_credit": 0.001,
        "input_rates": 0.0000425,
        "output_rates": 0.00017,
    },
    {
        "route": "diagnose",
        "required_credit": 0.01,
        "input_rates": 0.000425,
        "output_rates": 0.0017,
    },
    {
        "route": "clinical",
        "required_credit": 0.01,
        "input_rates": 0.000425,
        "output_rates": 0.0017,
    },
    {
        "route": "items",
        "required_credit": 0.001,
        "input_rates": 0.0000425,
        "output_rates": 0.00017,
    },
    {
        "route": "static",
        "required_credit": 0.001,
        "input_rates": 0.0000425,
        "output_rates": 0.00017,
    },
    {
        "route": "chat",
        "required_credit": 0.001,
        "input_rates": 0.0000425,
        "output_rates": 0.00017,
    },
    {
        "route": "online",
        "required_credit": 0.001,
        "input_rates": 0.0000425,
        "output_rates": 0.00017,
    },
    {
        "route": "upload",
        "required_credit": 0.001,
        "input_rates": 0.0000425,
        "output_rates": 0.00017,
    },
    {
        "route": "transcribe",
        "required_credit": 0.001,
        "input_rates": 0.0000425,
        "output_rates": 0.00017,
    },
    {
        "route": "report",
        "required_credit": 0.001,
        "input_rates": 0.0000425,
        "output_rates": 0.00017,
    },
    {
        "route": "jobs",
        "required_credit": 0.001,
        "input_rates": 0.0000425,
        "output_rates": 0.00017,
    },
    {
        "route": "job",
        "required_credit": 0.001,
        "input_rates": 0.0000425,
        "output_rates": 0.00017,
    },
    {
        "route": "transcript",
        "required_credit": 0.001,
        "input_rates": 0.0000425,
        "output_rates": 0.00017,
    },
    {
        "route": "personal-info",
        "required_credit": 0.001,
        "input_rates": 0.0000425,
        "output_rates": 0.00017,
    },
    {
        "route": "family-history",
        "required_credit": 0.001,
        "input_rates": 0.0000425,
        "output_rates": 0.00017,
    },
    {
        "route": "social-history",
        "required_credit": 0.001,
        "input_rates": 0.0000425,
        "output_rates": 0.00017,
    },
    {
        "route": "medical-history",
        "required_credit": 0.001,
        "input_rates": 0.0000425,
        "output_rates": 0.00017,
    },
    {
        "route": "drug-history",
        "required_credit": 0.001,
        "input_rates": 0.0000425,
        "output_rates": 0.00017,
    },
    {
        "route": "chief-complaint",
        "required_credit": 0.001,
        "input_rates": 0.0000425,
        "output_rates": 0.00017,
    },
    {
        "route": "system-enquiry",
        "required_credit": 0.001,
        "input_rates": 0.0000425,
        "output_rates": 0.00017,
    },
    {
        "route": "drug-history-and-allergies",
        "required_credit": 0.001,
        "input_rates": 0.0000425,
        "output_rates": 0.00017,
    },
    {
        "route": "medfind",
        "required_credit": 0.001,
        "input_rates": 0.0000425,
        "output_rates": 0.00017,
    },
    {
        "route": "examination",
        "required_credit": 0.001,
        "input_rates": 0.0000425,
        "output_rates": 0.00017,
    },
]


@event.listens_for(CreditConstants.__table__, "after_create")
def populate_default_credit_constants(target, connection, **kw):
    with Session(bind=connection) as session:
        session.add_all([CreditConstants(**data) for data in DEFAULT_CREDIT_CONSTANTS])
        session.commit()
