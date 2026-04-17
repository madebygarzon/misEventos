from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.api.deps import get_current_user, get_db_session, require_roles
from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.core.config import settings
from app.repositories.event_repository import EventRepository
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import UserResponse
from app.schemas.user import UserListResponse, UserProfileUpdate, UserRoleUpdate

router = APIRouter(prefix="/users", tags=["users"])


def _to_user_response(user, role_repository: RoleRepository) -> UserResponse:
    admin_email = settings.super_admin_email_legacy or settings.admin_email
    if user.email.lower() == admin_email.lower():
        role_repository.set_user_roles(user.id, {"admin"})

    roles = sorted(role_repository.get_role_names_by_user_id(user.id))
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        roles=roles,
    )


@router.get("", response_model=UserListResponse)
def list_users(
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
    _: set[str] = Depends(require_roles("admin")),
) -> UserListResponse:
    user_repository = UserRepository(session)
    role_repository = RoleRepository(session)
    users = user_repository.list_all()

    items = [_to_user_response(user, role_repository) for user in users if user.id != current_user.id]
    return UserListResponse(items=items, total=len(items))


@router.patch("/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: UUID,
    payload: UserRoleUpdate,
    session: Session = Depends(get_db_session),
    _: set[str] = Depends(require_roles("admin")),
) -> UserResponse:
    user_repository = UserRepository(session)
    role_repository = RoleRepository(session)
    event_repository = EventRepository(session)

    user = user_repository.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    admin_email = settings.super_admin_email_legacy or settings.admin_email
    if user.email.lower() == admin_email.lower() and payload.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Configured admin user must keep admin role",
        )

    if payload.role == "attendee":
        total_created_events = event_repository.count_by_organizer(user.id)
        if total_created_events > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot change role to attendee while user has created events",
            )

    role_repository.ensure_core_roles()
    role_repository.set_user_roles(user.id, {payload.role})
    return _to_user_response(user, role_repository)


@router.patch("/me", response_model=UserResponse)
def update_my_profile(
    payload: UserProfileUpdate,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    user_repository = UserRepository(session)
    role_repository = RoleRepository(session)

    user = user_repository.get_by_id(current_user.id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if payload.full_name is not None:
        clean_name = payload.full_name.strip()
        if not clean_name:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Name cannot be empty")
        user.full_name = clean_name

    wants_password_change = payload.new_password is not None or payload.current_password is not None
    if wants_password_change:
        if not payload.current_password or not payload.new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password and new password are required",
            )
        if not verify_password(payload.current_password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is invalid")
        user.hashed_password = get_password_hash(payload.new_password)

    user.updated_at = datetime.now(timezone.utc)
    user_repository.update(user)
    return _to_user_response(user, role_repository)
