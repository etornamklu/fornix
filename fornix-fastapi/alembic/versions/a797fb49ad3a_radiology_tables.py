"""radiology_tables

Revision ID: a797fb49ad3a
Revises: c0f797302a11
Create Date: 2025-07-17 01:34:15.763115

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'a797fb49ad3a'
down_revision: Union[str, None] = 'c0f797302a11'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    radiologist_report_type = sa.Enum(
        'xray',
        'ct_scan',
        'ecg',
        'ultrasound',
        name='radiologistreporttype',
    )
    lab_report_type = sa.Enum(
        'blood_test',
        'urine_test',
        'stool_test',
        'biopsy',
        'culture_and_sensitivity',
        name='labreporttype',
    )

    op.create_table(
        'radiologist_reports',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('radiologist_id', sa.UUID(), nullable=False),
        sa.Column('patient_id', sa.UUID(), nullable=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('type', radiologist_report_type, nullable=False),
        sa.Column('clinical_context', sa.String(), nullable=False),
        sa.Column(
            'content',
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id']),
        sa.ForeignKeyConstraint(['radiologist_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_radiologist_reports_type'),
        'radiologist_reports',
        ['type'],
        unique=False,
    )

    op.create_table(
        'lab_reports',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('technician_id', sa.UUID(), nullable=False),
        sa.Column('patient_id', sa.UUID(), nullable=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('type', lab_report_type, nullable=False),
        sa.Column('clinical_context', sa.String(), nullable=False),
        sa.Column(
            'content',
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id']),
        sa.ForeignKeyConstraint(['technician_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_lab_reports_type'),
        'lab_reports',
        ['type'],
        unique=False,
    )

    op.create_table(
        'image_uploads',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('radiologist_report_id', sa.UUID(), nullable=True),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('image', sa.LargeBinary(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ['radiologist_report_id'],
            ['radiologist_reports.id'],
            ondelete='SET NULL',
        ),
        sa.ForeignKeyConstraint(
            ['user_id'],
            ['users.id'],
            ondelete='SET NULL',
        ),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('image_uploads')
    op.drop_index(op.f('ix_lab_reports_type'), table_name='lab_reports')
    op.drop_table('lab_reports')
    op.drop_index(
        op.f('ix_radiologist_reports_type'),
        table_name='radiologist_reports',
    )
    op.drop_table('radiologist_reports')
