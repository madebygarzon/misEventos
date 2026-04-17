from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class SpeakerCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=255)
    email: EmailStr | None = None
    bio: str | None = None
    company: str | None = Field(default=None, max_length=255)
    job_title: str | None = Field(default=None, max_length=255)
    photo_url: str | None = None
    is_active: bool = True


class SpeakerUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=255)
    email: EmailStr | None = None
    bio: str | None = None
    company: str | None = Field(default=None, max_length=255)
    job_title: str | None = Field(default=None, max_length=255)
    photo_url: str | None = None
    is_active: bool | None = None


class SpeakerResponse(BaseModel):
    id: str
    full_name: str
    email: EmailStr | None
    bio: str | None
    company: str | None
    job_title: str | None
    photo_url: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class SessionSpeakerAssign(BaseModel):
    role_in_session: str | None = Field(default=None, max_length=128)


class EventSpeakerAssign(BaseModel):
    role_in_event: str | None = Field(default=None, max_length=128)


class SessionSpeakerResponse(BaseModel):
    id: str
    session_id: str
    speaker_id: str
    assigned_at: datetime
    role_in_session: str | None
    speaker: SpeakerResponse


class EventSpeakerResponse(BaseModel):
    id: str
    event_id: str
    speaker_id: str
    assigned_at: datetime
    role_in_event: str | None
    speaker: SpeakerResponse
