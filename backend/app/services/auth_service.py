from fastapi import HTTPException, status

from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import UserLogin, UserRegister


class AuthService:
    def __init__(self, user_repository: UserRepository, role_repository: RoleRepository):
        self.user_repository = user_repository
        self.role_repository = role_repository

    def register(self, payload: UserRegister) -> User:
        self.role_repository.ensure_core_roles()

        existing = self.user_repository.get_by_email(payload.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists",
            )

        user = User(
            email=payload.email,
            full_name=payload.full_name,
            hashed_password=get_password_hash(payload.password),
        )
        created = self.user_repository.create(user)

        admin_email = settings.super_admin_email_legacy or settings.admin_email
        if created.email.lower() == admin_email.lower():
            self.role_repository.set_user_roles(created.id, {"admin"})
        else:
            # In this MVP, standard users start as attendee by default.
            self.role_repository.set_user_roles(created.id, {"attendee"})

        return created

    def login(self, payload: UserLogin) -> str:
        user = self.user_repository.get_by_email(payload.email)
        if not user or not verify_password(payload.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        return create_access_token(subject=str(user.id))
