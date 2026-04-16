"""enforce admin email to have only admin role

Revision ID: 0008_enforce_admin_single_role
Revises: 0007_create_speakers_and_session_speakers
Create Date: 2026-04-15 17:40:00
"""

from uuid import uuid4

from alembic import op
import sqlalchemy as sa


revision = "0008_enforce_admin_single_role"
down_revision = "0007_create_speakers_and_session_speakers"
branch_labels = None
depends_on = None


ADMIN_EMAIL = "madebygarzon@gmail.com"


def upgrade() -> None:
    connection = op.get_bind()

    user_id = connection.execute(
        sa.text("SELECT id FROM users WHERE lower(email) = lower(:email) LIMIT 1"),
        {"email": ADMIN_EMAIL},
    ).scalar()
    if not user_id:
        return

    admin_role_id = connection.execute(sa.text("SELECT id FROM roles WHERE name = 'admin' LIMIT 1")).scalar()
    if not admin_role_id:
        admin_role_id = uuid4()
        connection.execute(
            sa.text(
                """
                INSERT INTO roles (id, name, description, created_at)
                VALUES (:id, 'admin', 'Global management permissions', now())
                """
            ),
            {"id": admin_role_id},
        )

    connection.execute(
        sa.text(
            """
            INSERT INTO user_roles (id, user_id, role_id, assigned_at)
            VALUES (:id, :user_id, :role_id, now())
            ON CONFLICT (user_id, role_id) DO NOTHING
            """
        ),
        {"id": uuid4(), "user_id": user_id, "role_id": admin_role_id},
    )

    connection.execute(
        sa.text(
            """
            DELETE FROM user_roles
            WHERE user_id = :user_id
              AND role_id <> :admin_role_id
            """
        ),
        {"user_id": user_id, "admin_role_id": admin_role_id},
    )


def downgrade() -> None:
    # No-op: this is a data correction migration.
    pass
