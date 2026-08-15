# import uuid

# from sqlalchemy import Column, String, Date, JSON, UUID, ForeignKey, Integer
# from sqlalchemy.dialects.postgresql import ARRAY
# from sqlalchemy.orm import relationship

# from src.database.models import Base
# from src.utils.uid_generator import generate_uid


# class PatientStaticData(Base):
#     __tablename__ = "patient_static_data"

#     # JSON listed here because these will typically be provided through a form
#     patient_code = Column(String, default=generate_uid())
#     id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
#     level = Column(String, default="")
#     # full_name = Column(String, index=True)
#     nickname = Column(String, default="")
#     date_of_birth = Column(Date)
#     gender = Column(String, nullable=True)
#     marital_status = Column(String, nullable=True)
#     occupation = Column(String, default="")
#     occupation_details = Column(String, default="")
#     address = Column(String, default="")
#     contact_number = Column(String, default="")
#     emergency_contact = Column(ARRAY(String), default=[])
#     previous_surgeries = Column(String, default="")
#     allergies = Column(String, default="")
#     medications = Column(String, default="")
#     family_medical_history = Column(String, default="")
#     lifestyle_habits = Column(String, default="")
#     dietary_habits = Column(String, default="")
#     exercise_routine = Column(Integer, default=0)
#     psychosocial_history = Column(String, default="")
#     summary = Column(ARRAY(String), default={})

#     patient_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
#     user = relationship("User", back_populates="patient")


# # class PatientStaticData(Base):
# #     __tablename__ = "patient_static_data"

# #     # JSON listed here because these will typically be provided through a form
# #     patient_code = Column(String, default=generate_uid())
# #     id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
# #     # full_name = Column(String, index=True)
# #     nickname = Column(String, default="")
# #     date_of_birth = Column(Date)
# #     gender = Column(String, nullable=False)
# #     marital_status = Column(String, nullable=False)
# #     occupation = Column(String, default="")
# #     home_address = Column(String, default="")
# #     phone = Column(String, default="")
# #     emergency_contact = Column(String, default="")
# #     previous_surgeries = Column(JSON, default=[])
# #     allergies = Column(JSON, default=[])
# #     past_medical_history = Column(String, default="")
# #     herbal_drug_use = Column(String, default="")
# #     family_medical_history = Column(JSON, default=[])
# #     smoking = Column(JSON, default=[])
# #     alcohol = Column(JSON, default=[])
# #     recreational_drug_use = Column(JSON, default=[])
# #     previous_admissions = Column(JSON, default=[])
# #     previous_diagnoses = Column(JSON, default=[])
# #     previous_blood_transfusion = Column(String, nullable=False)
# #     occupation_details = Column(String, default=[])
# #     diet = Column(JSON, default=[])
# #     exercise = Column(String, default=[])
# #     gynaecologic_history = Column(JSON, default=None)
# #     summary = Column(ARRAY(String), default=[])

# #     patient_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
# #     user = relationship("User", back_populates="patient")
