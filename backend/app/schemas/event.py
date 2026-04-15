from datetime import datetime

from pydantic import BaseModel, Field


class EventCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    description: str | None = None
    location: str | None = Field(default=None, max_length=255)
    start_date: datetime
    end_date: datetime
    capacity: int = Field(gt=0)
    status: str = Field(default="draft")


class EventUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    description: str | None = None
    location: str | None = Field(default=None, max_length=255)
    start_date: datetime | None = None
    end_date: datetime | None = None
    capacity: int | None = Field(default=None, gt=0)
    status: str | None = None


class EventResponse(BaseModel):
    id: str
    organizer_id: str
    name: str
    description: str | None
    location: str | None
    start_date: datetime
    end_date: datetime
    capacity: int
    status: str
    created_at: datetime
    updated_at: datetime


class EventListResponse(BaseModel):
    items: list[EventResponse]
    total: int
    page: int
    limit: int
    pages: int
