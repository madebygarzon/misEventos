from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class UserRole(SQLModel, table=True):
    __tablename__ = "user_roles"

    id: UUID = Field(default_factory=uuid4, primary_key=True, nullable=False)
    user_id: UUID = Field(foreign_key="users.id", nullable=False, index=True)
    role_id: UUID = Field(foreign_key="roles.id", nullable=False, index=True)
    assigned_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
