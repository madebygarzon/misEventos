"""create events table

Revision ID: 0002_create_events
Revises: 0001_create_users
Create Date: 2026-04-14 21:25:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0002_create_events"
down_revision = "0001_create_users"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "events",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("organizer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("capacity", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="draft"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["organizer_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint("capacity > 0", name="ck_events_capacity_positive"),
        sa.CheckConstraint("start_date < end_date", name="ck_events_dates_valid"),
        sa.CheckConstraint(
            "status IN ('draft', 'published', 'cancelled', 'finished')",
            name="ck_events_status_valid",
        ),
    )
    op.create_index("ix_events_name", "events", ["name"], unique=False)
    op.create_index("ix_events_status", "events", ["status"], unique=False)
    op.create_index("ix_events_organizer_id", "events", ["organizer_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_events_organizer_id", table_name="events")
    op.drop_index("ix_events_status", table_name="events")
    op.drop_index("ix_events_name", table_name="events")
    op.drop_table("events")
