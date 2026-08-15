"""rename audio_uploads audio column to content

Revision ID: 9e4f1a2b3c4d
Revises: 8b15c220b7ff
Create Date: 2026-04-27 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9e4f1a2b3c4d"
down_revision: Union[str, None] = "8b15c220b7ff"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "audio_uploads",
        "audio",
        new_column_name="content",
        existing_type=sa.LargeBinary(),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "audio_uploads",
        "content",
        new_column_name="audio",
        existing_type=sa.LargeBinary(),
        existing_nullable=False,
    )
