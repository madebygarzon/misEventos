from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.api.deps import get_current_user, get_db_session
from app.core.config import settings
from app.models.user import User
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import TokenResponse, UserLogin, UserRegister, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


def _to_user_response(user: User, session: Session) -> UserResponse:
    role_repository = RoleRepository(session)
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


@router.post("/register", response_model=UserResponse, status_code=201)
def register(payload: UserRegister, session: Session = Depends(get_db_session)) -> UserResponse:
    service = AuthService(UserRepository(session), RoleRepository(session))
    user = service.register(payload)
    return _to_user_response(user, session)


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, session: Session = Depends(get_db_session)) -> TokenResponse:
    service = AuthService(UserRepository(session), RoleRepository(session))
    access_token = service.login(payload)
    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=UserResponse)
def me(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db_session),
) -> UserResponse:
    return _to_user_response(current_user, session)
