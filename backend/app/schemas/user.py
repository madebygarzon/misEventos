from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.auth import UserResponse


class UserListResponse(BaseModel):
    items: list[UserResponse]
    total: int


class UserRoleUpdate(BaseModel):
    role: Literal["attendee", "organizer", "admin"]


class UserProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=255)
    current_password: str | None = Field(default=None, min_length=8, max_length=128)
    new_password: str | None = Field(default=None, min_length=8, max_length=128)
