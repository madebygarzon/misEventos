import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app.api.deps import get_db_session
from app.core.config import settings
from app.main import app
from app.models.event import Event  # noqa: F401
from app.models.event_speaker import EventSpeaker  # noqa: F401
from app.models.registration import Registration  # noqa: F401
from app.models.role import Role  # noqa: F401
from app.models.session import EventSession  # noqa: F401
from app.models.session_speaker import SessionSpeaker  # noqa: F401
from app.models.speaker import Speaker  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.user_role import UserRole  # noqa: F401


@pytest.fixture(name="session")
def session_fixture():
    settings.admin_email = "madebygarzon@gmail.com"
    settings.super_admin_email_legacy = None
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    def override_get_db_session():
        return session

    app.dependency_overrides[get_db_session] = override_get_db_session
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()
