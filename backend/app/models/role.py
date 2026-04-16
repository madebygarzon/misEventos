from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class Role(SQLModel, table=True):
    __tablename__ = "roles"

    id: UUID = Field(default_factory=uuid4, primary_key=True, nullable=False)
    name: str = Field(max_length=64, unique=True, index=True, nullable=False)
    description: str | None = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
