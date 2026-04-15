from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.api.deps import get_current_user, get_db_session
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import TokenResponse, UserLogin, UserRegister, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=201)
def register(payload: UserRegister, session: Session = Depends(get_db_session)) -> UserResponse:
    service = AuthService(UserRepository(session))
    user = service.register(payload)
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, session: Session = Depends(get_db_session)) -> TokenResponse:
    service = AuthService(UserRepository(session))
    access_token = service.login(payload)
    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
    )
