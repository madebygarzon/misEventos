"""create roles and user_roles tables with seed data

Revision ID: 0005_create_roles_and_rbac_seed
Revises: 0004_create_registrations
Create Date: 2026-04-15 14:25:00
"""

from uuid import uuid4

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0005_create_roles_and_rbac_seed"
down_revision = "0004_create_registrations"
branch_labels = None
depends_on = None


DEFAULT_ADMIN_EMAIL = "madebygarzon@gmail.com"


def upgrade() -> None:
    op.create_table(
        "roles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=64), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uq_roles_name"),
    )
    op.create_index("ix_roles_name", "roles", ["name"], unique=False)

    op.create_table(
        "user_roles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("role_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("assigned_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "role_id", name="uq_user_roles_user_role"),
    )
    op.create_index("ix_user_roles_user_id", "user_roles", ["user_id"], unique=False)
    op.create_index("ix_user_roles_role_id", "user_roles", ["role_id"], unique=False)

    connection = op.get_bind()

    role_table = sa.table(
        "roles",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("name", sa.String),
        sa.column("description", sa.Text),
    )

    seeded_roles = [
        {"id": uuid4(), "name": "attendee", "description": "Can register to events"},
        {"id": uuid4(), "name": "organizer", "description": "Can create and manage owned events"},
        {"id": uuid4(), "name": "admin", "description": "Global management permissions"},
    ]
    op.bulk_insert(role_table, seeded_roles)

    role_rows = connection.execute(sa.text("SELECT id, name FROM roles")).mappings().all()
    role_ids = {row["name"]: row["id"] for row in role_rows}
    user_ids = [row[0] for row in connection.execute(sa.text("SELECT id FROM users")).all()]

    for user_id in user_ids:
        for role_name in ("attendee", "organizer"):
            connection.execute(
                sa.text(
                    """
                    INSERT INTO user_roles (id, user_id, role_id, assigned_at)
                    VALUES (:id, :user_id, :role_id, now())
                    ON CONFLICT (user_id, role_id) DO NOTHING
                    """
                ),
                {"id": uuid4(), "user_id": user_id, "role_id": role_ids[role_name]},
            )

    admin_user = connection.execute(
        sa.text("SELECT id FROM users WHERE lower(email) = lower(:email) LIMIT 1"),
        {"email": DEFAULT_ADMIN_EMAIL},
    ).first()
    if admin_user:
        connection.execute(
            sa.text(
                """
                INSERT INTO user_roles (id, user_id, role_id, assigned_at)
                VALUES (:id, :user_id, :role_id, now())
                ON CONFLICT (user_id, role_id) DO NOTHING
                """
            ),
            {
                "id": uuid4(),
                "user_id": admin_user[0],
                "role_id": role_ids["admin"],
            },
        )


def downgrade() -> None:
    op.drop_index("ix_user_roles_role_id", table_name="user_roles")
    op.drop_index("ix_user_roles_user_id", table_name="user_roles")
    op.drop_table("user_roles")

    op.drop_index("ix_roles_name", table_name="roles")
    op.drop_table("roles")
