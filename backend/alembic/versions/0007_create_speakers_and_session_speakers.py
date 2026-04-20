"""create speakers and session_speakers tables

Revision ID: 0007_create_speakers_and_session_speakers
Revises: 0006_rename_super_admin_to_admin
Create Date: 2026-04-15 17:05:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0007_create_speakers_and_session_speakers"
down_revision = "0006_rename_super_admin_to_admin"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Some revision ids in this project are longer than 32 chars.
    # Alembic's default alembic_version.version_num size is 32, so we widen it
    # before Alembic writes the current revision at the end of this migration.
    op.alter_column(
        "alembic_version",
        "version_num",
        existing_type=sa.String(length=32),
        type_=sa.String(length=255),
        existing_nullable=False,
    )

    op.create_table(
        "speakers",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("company", sa.String(length=255), nullable=True),
        sa.Column("job_title", sa.String(length=255), nullable=True),
        sa.Column("photo_url", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_speakers_full_name", "speakers", ["full_name"], unique=False)
    op.create_index("ix_speakers_email", "speakers", ["email"], unique=False)

    op.create_table(
        "session_speakers",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("speaker_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("assigned_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("role_in_session", sa.String(length=128), nullable=True),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["speaker_id"], ["speakers.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("session_id", "speaker_id", name="uq_session_speakers_session_speaker"),
    )
    op.create_index("ix_session_speakers_session_id", "session_speakers", ["session_id"], unique=False)
    op.create_index("ix_session_speakers_speaker_id", "session_speakers", ["speaker_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_session_speakers_speaker_id", table_name="session_speakers")
    op.drop_index("ix_session_speakers_session_id", table_name="session_speakers")
    op.drop_table("session_speakers")

    op.drop_index("ix_speakers_email", table_name="speakers")
    op.drop_index("ix_speakers_full_name", table_name="speakers")
    op.drop_table("speakers")
