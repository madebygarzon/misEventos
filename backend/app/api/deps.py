from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlmodel import Session

from app.core.config import settings
from app.core.database import get_session
from app.models.user import User


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
