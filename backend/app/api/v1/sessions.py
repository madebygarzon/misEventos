from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from app.api.deps import get_current_user, get_db_session, require_roles
from app.models.user import User
from app.repositories.event_repository import EventRepository
from app.repositories.session_repository import SessionRepository
from app.schemas.session import SessionCreate, SessionResponse, SessionUpdate
from app.services.session_service import SessionService

router = APIRouter(tags=["sessions"])


def _to_response(item) -> SessionResponse:
    return SessionResponse(
        id=str(item.id),
        event_id=str(item.event_id),
        title=item.title,
        description=item.description,
        start_time=item.start_time,
        end_time=item.end_time,
        capacity=item.capacity,
        status=item.status,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


@router.get("/events/{event_id}/sessions", response_model=list[SessionResponse])
def list_event_sessions(event_id: UUID, session: Session = Depends(get_db_session)) -> list[SessionResponse]:
    service = SessionService(SessionRepository(session), EventRepository(session))
    sessions = service.list_by_event(event_id)
    return [_to_response(item) for item in sessions]


@router.post(
    "/events/{event_id}/sessions",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_event_session(
    event_id: UUID,
    payload: SessionCreate,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
    role_names: set[str] = Depends(require_roles("organizer", "admin")),
) -> SessionResponse:
    service = SessionService(SessionRepository(session), EventRepository(session))
    created = service.create(
        event_id=event_id,
        payload=payload,
        current_user_id=current_user.id,
        is_admin="admin" in role_names,
    )
    return _to_response(created)


@router.put("/sessions/{session_id}", response_model=SessionResponse)
def update_session(
    session_id: UUID,
    payload: SessionUpdate,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
    role_names: set[str] = Depends(require_roles("organizer", "admin")),
) -> SessionResponse:
    service = SessionService(SessionRepository(session), EventRepository(session))
    updated = service.update(
        session_id=session_id,
        payload=payload,
        current_user_id=current_user.id,
        is_admin="admin" in role_names,
    )
    return _to_response(updated)


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: UUID,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
    role_names: set[str] = Depends(require_roles("organizer", "admin")),
) -> None:
    service = SessionService(SessionRepository(session), EventRepository(session))
    service.delete(
        session_id=session_id,
        current_user_id=current_user.id,
        is_admin="admin" in role_names,
    )
