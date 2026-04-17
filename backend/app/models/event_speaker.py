from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, SQLModel


class EventSpeaker(SQLModel, table=True):
    __tablename__ = "event_speakers"
    __table_args__ = (UniqueConstraint("event_id", "speaker_id", name="uq_event_speakers_event_speaker"),)

    id: UUID = Field(default_factory=uuid4, primary_key=True, nullable=False)
    event_id: UUID = Field(foreign_key="events.id", nullable=False, index=True)
    speaker_id: UUID = Field(foreign_key="speakers.id", nullable=False, index=True)
    assigned_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
    role_in_event: str | None = Field(default=None, max_length=128)
