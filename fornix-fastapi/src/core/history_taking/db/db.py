from sqlalchemy.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio.engine import AsyncEngine, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import URL
from typing import AsyncGenerator
from .models.base import Base
from .models.patient import *  # noqa
import os


DATABASE_URL = URL(
    drivername="sqlite+aiosqlite",
    username=None,
    password=None,
    host=None,
    port=None,
    database=os.getenv("DATABASE", "database.sqlite"),
    query={},  # type: ignore
)


engine: AsyncEngine = create_async_engine(
    DATABASE_URL, echo=True, future=True, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine, class_=AsyncSession # type: ignore[call-overload]
)  


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:  #type: ignore
        yield session


async def create_tables() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
