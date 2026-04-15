"""create registrations table

Revision ID: 0004_create_registrations
Revises: 0003_create_sessions
Create Date: 2026-04-14 22:05:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0004_create_registrations"
down_revision = "0003_create_sessions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "registrations",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="registered"),
        sa.Column("registered_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "event_id", name="uq_registrations_user_event"),
        sa.CheckConstraint(
            "status IN ('registered', 'cancelled', 'waitlist')",
            name="ck_registrations_status_valid",
        ),
    )
    op.create_index("ix_registrations_user_id", "registrations", ["user_id"], unique=False)
    op.create_index("ix_registrations_event_id", "registrations", ["event_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_registrations_event_id", table_name="registrations")
    op.drop_index("ix_registrations_user_id", table_name="registrations")
    op.drop_table("registrations")
