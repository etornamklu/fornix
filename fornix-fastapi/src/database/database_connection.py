"""database connection util extensions"""

import os
from sqlalchemy import URL, create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

from src.database.models import Base

load_dotenv()

# TODO: extract to env later :: extracted
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")

# SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
SQLALCHEMY_DATABASE_URL = URL.create(
    "postgresql",
    username=DB_USER,
    password=DB_PASSWORD,
    host=DB_HOST,
    port=DB_PORT,
    database=DB_NAME,
)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={
        "sslmode": "disable"
        if os.getenv("ENVIRONMENT") == "Development"
        else "require",
        "client_encoding": "utf8",
    },
    pool_size=30,
    max_overflow=0
)
# Base.metadata.create_all(bind=engine)

# SessionLocal
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
