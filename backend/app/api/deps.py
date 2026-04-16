from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlmodel import Session

from app.core.config import settings
from app.core.database import get_session
from app.models.user import User
from app.repositories.role_repository import RoleRepository


oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.api_v1_prefix}/auth/login")


def get_db_session():
    yield from get_session()


def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_db_session),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )

    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id = payload.get("sub")
        if not user_id:
            raise credentials_exception
        parsed_id = UUID(user_id)
    except (JWTError, ValueError):
        raise credentials_exception

    user = session.get(User, parsed_id)
    if not user:
        raise credentials_exception

    return user


def get_current_user_role_names(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db_session),
) -> set[str]:
    repository = RoleRepository(session)
    return repository.get_role_names_by_user_id(current_user.id)


def get_is_admin(
    role_names: set[str] = Depends(get_current_user_role_names),
) -> bool:
    return "admin" in role_names


def require_roles(*allowed_roles: str):
    def _checker(role_names: set[str] = Depends(get_current_user_role_names)) -> set[str]:
        if not set(allowed_roles).intersection(role_names):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return role_names

    return _checker
