from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class Registration(SQLModel, table=True):
    __tablename__ = "registrations"

    id: UUID = Field(default_factory=uuid4, primary_key=True, nullable=False)
    user_id: UUID = Field(foreign_key="users.id", nullable=False, index=True)
    event_id: UUID = Field(foreign_key="events.id", nullable=False, index=True)
    status: str = Field(default="registered", max_length=32, nullable=False)
    registered_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
    notes: str | None = Field(default=None)
