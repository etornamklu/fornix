# import uuid

# from sqlalchemy import Column, Integer, String, JSON, Float, UUID

# from src.database.models import Base


# class PatientDynamicData(Base):
#     __tablename__ = "patient_dynamic_data"

#     # No JSON use since this is LLM refined data
#     patient_id = Column(String)
#     id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
#     chief_complaint = Column(String, default="")
#     onset = Column(String, default="")
#     location = Column(String, default="")
#     timing = Column(String, default="")
#     severity = Column(Float, default=0.0)
#     exacerbating_factors = Column(String, default="")
#     relieving_factors = Column(String, default="")
#     associated_symptoms = Column(String, default="")
#     progression = Column(String, default="")
#     episodes = Column(String, default="")
#     impact_on_daily_life = Column(String, default="")
#     current_medications = Column(String, default="")
#     exposures = Column(String, default="")
#     psychological_factors = Column(String, default="")
#     expectations = Column(String, default="")
#     additional_info = Column(String, default="")
