from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class Event(SQLModel, table=True):
    __tablename__ = "events"

    id: UUID = Field(default_factory=uuid4, primary_key=True, nullable=False)
    organizer_id: UUID = Field(foreign_key="users.id", nullable=False, index=True)
    name: str = Field(max_length=255, nullable=False, index=True)
    description: str | None = Field(default=None)
    location: str | None = Field(default=None, max_length=255)
    featured_image_sm_url: str | None = Field(default=None, max_length=1024)
    featured_image_md_url: str | None = Field(default=None, max_length=1024)
    featured_image_lg_url: str | None = Field(default=None, max_length=1024)
    featured_image_alt: str | None = Field(default=None, max_length=255)
    start_date: datetime = Field(nullable=False)
    end_date: datetime = Field(nullable=False)
    capacity: int = Field(nullable=False, gt=0)
    status: str = Field(default="draft", max_length=32, nullable=False, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
