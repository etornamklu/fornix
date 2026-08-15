"""image_uploads: add content_type; rename image to content if present

The ORM (ImageUpload) expects ``content`` and ``content_type``. Older
databases may have ``image`` only (analogous to pre-migration
``audio_uploads.audio``) and no ``content_type`` column.

Revision ID: f0e1d2c3b4a5
Revises: 9e4f1a2b3c4d
Create Date: 2026-04-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision: str = "f0e1d2c3b4a5"
down_revision: Union[str, None] = "9e4f1a2b3c4d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    insp = inspect(conn)
    col_names = {c["name"] for c in insp.get_columns("image_uploads")}

    if "image" in col_names and "content" not in col_names:
        op.alter_column(
            "image_uploads",
            "image",
            new_column_name="content",
            existing_type=sa.LargeBinary(),
            existing_nullable=False,
        )
        col_names = (col_names - {"image"}) | {"content"}

    if "content_type" not in col_names:
        op.add_column(
            "image_uploads",
            sa.Column("content_type", sa.String(), nullable=True),
        )
        op.execute(
            sa.text(
                "UPDATE image_uploads "
                "SET content_type = 'application/octet-stream' "
                "WHERE content_type IS NULL"
            )
        )
        op.alter_column(
            "image_uploads",
            "content_type",
            existing_type=sa.String(),
            nullable=False,
        )


def downgrade() -> None:
    conn = op.get_bind()
    insp = inspect(conn)
    col_names = {c["name"] for c in insp.get_columns("image_uploads")}

    if "content_type" in col_names:
        op.drop_column("image_uploads", "content_type")
        col_names = {c["name"] for c in insp.get_columns("image_uploads")}

    if "content" in col_names and "image" not in col_names:
        op.alter_column(
            "image_uploads",
            "content",
            new_column_name="image",
            existing_type=sa.LargeBinary(),
            existing_nullable=False,
        )
