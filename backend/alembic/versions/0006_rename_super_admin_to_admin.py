"""normalize roles to attendee, organizer, admin

Revision ID: 0006_rename_super_admin_to_admin
Revises: 0005_create_roles_and_rbac_seed
Create Date: 2026-04-15 16:10:00
"""

from uuid import uuid4

from alembic import op
import sqlalchemy as sa


revision = "0006_rename_super_admin_to_admin"
down_revision = "0005_create_roles_and_rbac_seed"
branch_labels = None
depends_on = None


def _get_role_id(connection, role_name: str):
    return connection.execute(sa.text("SELECT id FROM roles WHERE name = :name LIMIT 1"), {"name": role_name}).scalar()


def _ensure_admin_role(connection):
    role_id = _get_role_id(connection, "admin")
    if role_id:
        connection.execute(
            sa.text("UPDATE roles SET description = :description WHERE id = :id"),
            {"id": role_id, "description": "Global management permissions"},
        )
        return role_id

    role_id = uuid4()
    connection.execute(
        sa.text(
            """
            INSERT INTO roles (id, name, description, created_at)
            VALUES (:id, 'admin', 'Global management permissions', now())
            """
        ),
        {"id": role_id},
    )
    return role_id


def _ensure_role(connection, role_name: str, description: str):
    role_id = _get_role_id(connection, role_name)
    if role_id:
        connection.execute(
            sa.text("UPDATE roles SET description = :description WHERE id = :id"),
            {"id": role_id, "description": description},
        )
        return role_id

    role_id = uuid4()
    connection.execute(
        sa.text(
            """
            INSERT INTO roles (id, name, description, created_at)
            VALUES (:id, :name, :description, now())
            """
        ),
        {"id": role_id, "name": role_name, "description": description},
    )
    return role_id


def upgrade() -> None:
    connection = op.get_bind()

    attendee_id = _ensure_role(connection, "attendee", "Can register to events")
    organizer_id = _ensure_role(connection, "organizer", "Can create and manage owned events")
    admin_id = _ensure_admin_role(connection)

    role_migrations = [
        ("asistente", attendee_id),
        ("organizador", organizer_id),
        ("super_admin", admin_id),
    ]

    for source_role_name, target_role_id in role_migrations:
        source_role_id = _get_role_id(connection, source_role_name)
        if not source_role_id or source_role_id == target_role_id:
            continue

        rows = connection.execute(
            sa.text("SELECT user_id, assigned_at FROM user_roles WHERE role_id = :role_id"),
            {"role_id": source_role_id},
        ).mappings().all()

        for row in rows:
            connection.execute(
                sa.text(
                    """
                    INSERT INTO user_roles (id, user_id, role_id, assigned_at)
                    VALUES (:id, :user_id, :role_id, :assigned_at)
                    ON CONFLICT (user_id, role_id) DO NOTHING
                    """
                ),
                {
                    "id": uuid4(),
                    "user_id": row["user_id"],
                    "role_id": target_role_id,
                    "assigned_at": row["assigned_at"],
                },
            )

        connection.execute(sa.text("DELETE FROM user_roles WHERE role_id = :role_id"), {"role_id": source_role_id})
        connection.execute(sa.text("DELETE FROM roles WHERE id = :id"), {"id": source_role_id})


def downgrade() -> None:
    # No-op: irreversible normalization to final role names for this project.
    pass
