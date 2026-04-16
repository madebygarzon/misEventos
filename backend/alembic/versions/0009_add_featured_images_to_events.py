"""add featured image columns to events

Revision ID: 0009_add_featured_images_to_events
Revises: 0008_enforce_admin_single_role
Create Date: 2026-04-16 13:35:00
"""

from alembic import op
import sqlalchemy as sa


revision = "0009_add_featured_images_to_events"
down_revision = "0008_enforce_admin_single_role"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("events", sa.Column("featured_image_sm_url", sa.String(length=1024), nullable=True))
    op.add_column("events", sa.Column("featured_image_md_url", sa.String(length=1024), nullable=True))
    op.add_column("events", sa.Column("featured_image_lg_url", sa.String(length=1024), nullable=True))
    op.add_column("events", sa.Column("featured_image_alt", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("events", "featured_image_alt")
    op.drop_column("events", "featured_image_lg_url")
    op.drop_column("events", "featured_image_md_url")
    op.drop_column("events", "featured_image_sm_url")
