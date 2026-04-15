from datetime import datetime

from pydantic import BaseModel, Field


class RegistrationCreate(BaseModel):
    notes: str | None = Field(default=None, max_length=1000)


class RegistrationResponse(BaseModel):
    id: str
    user_id: str
    event_id: str
    status: str
    registered_at: datetime
    notes: str | None


class MyRegistrationsResponse(BaseModel):
    items: list[RegistrationResponse]
    total: int
