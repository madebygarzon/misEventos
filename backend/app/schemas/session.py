from datetime import datetime

from pydantic import BaseModel, Field


class SessionCreate(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    description: str | None = None
    start_time: datetime
    end_time: datetime
    status: str = Field(default="scheduled")


class SessionUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=255)
    description: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    status: str | None = None


class SessionResponse(BaseModel):
    id: str
    event_id: str
    title: str
    description: str | None
    start_time: datetime
    end_time: datetime
    status: str
    created_at: datetime
    updated_at: datetime
