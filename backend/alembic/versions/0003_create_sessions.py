"""create sessions table

Revision ID: 0003_create_sessions
Revises: 0002_create_events
Create Date: 2026-04-14 21:45:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0003_create_sessions"
down_revision = "0002_create_events"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("capacity", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="scheduled"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint("capacity > 0", name="ck_sessions_capacity_positive"),
        sa.CheckConstraint("start_time < end_time", name="ck_sessions_times_valid"),
        sa.CheckConstraint(
            "status IN ('scheduled', 'in_progress', 'finished', 'cancelled')",
            name="ck_sessions_status_valid",
        ),
    )
    op.create_index("ix_sessions_event_id", "sessions", ["event_id"], unique=False)
    op.create_index("ix_sessions_status", "sessions", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_sessions_status", table_name="sessions")
    op.drop_index("ix_sessions_event_id", table_name="sessions")
    op.drop_table("sessions")
