from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, SQLModel


class SessionSpeaker(SQLModel, table=True):
    __tablename__ = "session_speakers"
    __table_args__ = (UniqueConstraint("session_id", "speaker_id", name="uq_session_speakers_session_speaker"),)

    id: UUID = Field(default_factory=uuid4, primary_key=True, nullable=False)
    session_id: UUID = Field(foreign_key="sessions.id", nullable=False, index=True)
    speaker_id: UUID = Field(foreign_key="speakers.id", nullable=False, index=True)
    assigned_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
    role_in_session: str | None = Field(default=None, max_length=128)
