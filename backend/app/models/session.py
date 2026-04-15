from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class EventSession(SQLModel, table=True):
    __tablename__ = "sessions"

    id: UUID = Field(default_factory=uuid4, primary_key=True, nullable=False)
    event_id: UUID = Field(foreign_key="events.id", nullable=False, index=True)
    title: str = Field(max_length=255, nullable=False)
    description: str | None = Field(default=None)
    start_time: datetime = Field(nullable=False)
    end_time: datetime = Field(nullable=False)
    capacity: int = Field(nullable=False, gt=0)
    status: str = Field(default="scheduled", max_length=32, nullable=False, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
