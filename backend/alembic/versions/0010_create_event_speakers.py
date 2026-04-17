"""create event speakers

Revision ID: 0010_create_event_speakers
Revises: 0009_add_featured_images_to_events
Create Date: 2026-04-16 18:10:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0010_create_event_speakers"
down_revision = "0009_add_featured_images_to_events"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "event_speakers",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("speaker_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("assigned_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("role_in_event", sa.String(length=128), nullable=True),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["speaker_id"], ["speakers.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("event_id", "speaker_id", name="uq_event_speakers_event_speaker"),
    )
    op.create_index(op.f("ix_event_speakers_event_id"), "event_speakers", ["event_id"], unique=False)
    op.create_index(op.f("ix_event_speakers_speaker_id"), "event_speakers", ["speaker_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_event_speakers_speaker_id"), table_name="event_speakers")
    op.drop_index(op.f("ix_event_speakers_event_id"), table_name="event_speakers")
    op.drop_table("event_speakers")
