from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class Speaker(SQLModel, table=True):
    __tablename__ = "speakers"

    id: UUID = Field(default_factory=uuid4, primary_key=True, nullable=False)
    full_name: str = Field(max_length=255, nullable=False, index=True)
    email: str | None = Field(default=None, max_length=255, index=True)
    bio: str | None = Field(default=None)
    company: str | None = Field(default=None, max_length=255)
    job_title: str | None = Field(default=None, max_length=255)
    photo_url: str | None = Field(default=None)
    is_active: bool = Field(default=True, nullable=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
