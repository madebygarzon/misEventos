from typing import Literal

from pydantic import BaseModel

from app.schemas.auth import UserResponse


class UserListResponse(BaseModel):
    items: list[UserResponse]
    total: int


class UserRoleUpdate(BaseModel):
    role: Literal["attendee", "organizer", "admin"]
