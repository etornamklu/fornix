from sqlalchemy import func, DateTime
from sqlalchemy.orm import (
    declared_attr,
    DeclarativeBase,
    Mapped,
    mapped_column,
    declarative_mixin,
)
from datetime import datetime
import re


class Base(DeclarativeBase):
    @declared_attr
    def __tablename__(cls):
        return re.sub(r"(?<!^)(?=[A-Z])", "_", cls.__name__).lower()

    @declared_attr
    def __table_args__(cls):
        return {"extend_existing": True}


@declarative_mixin
class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, onupdate=datetime.now
    )
