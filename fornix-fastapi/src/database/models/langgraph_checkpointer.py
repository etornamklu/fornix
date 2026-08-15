from datetime import datetime
from sqlalchemy import Column, Integer, String, LargeBinary, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from . import Base


class CheckpointMigrations(Base):
    __tablename__ = 'checkpoint_migrations'

    v = Column(Integer, primary_key=True)


class Checkpoints(Base):
    __tablename__ = 'checkpoints'

    thread_id = Column(String, primary_key=True)
    checkpoint_ns = Column(String, primary_key=True, server_default='')
    checkpoint_id = Column(String, primary_key=True)
    parent_checkpoint_id = Column(String, nullable=True)
    type = Column(String, nullable=True)
    checkpoint = Column(JSONB, nullable=False)
    # metadata = Column(JSONB, nullable=False, server_default='{}')


Checkpoints.metadata = Column('metadata', JSONB, nullable=False, server_default='{}')


class CheckpointBlobs(Base):
    __tablename__ = 'checkpoint_blobs'

    thread_id = Column(String, primary_key=True)
    checkpoint_ns = Column(String, primary_key=True, server_default='')
    channel = Column(String, primary_key=True)
    version = Column(String, primary_key=True)
    type = Column(String, nullable=False)
    blob = Column(LargeBinary, nullable=True)  # Nullable per ALTER TABLE statement


class CheckpointWrites(Base):
    __tablename__ = 'checkpoint_writes'

    thread_id = Column(String, primary_key=True)
    checkpoint_ns = Column(String, primary_key=True, server_default='')
    checkpoint_id = Column(String, primary_key=True)
    task_id = Column(String, primary_key=True)
    idx = Column(Integer, primary_key=True)
    channel = Column(String, nullable=False)
    type = Column(String, nullable=True)
    blob = Column(LargeBinary, nullable=False)
