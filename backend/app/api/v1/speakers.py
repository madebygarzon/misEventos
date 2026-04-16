from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlmodel import Session

from app.api.deps import get_current_user, get_db_session, require_roles
from app.models.user import User
from app.repositories.event_repository import EventRepository
from app.repositories.session_repository import SessionRepository
from app.repositories.session_speaker_repository import SessionSpeakerRepository
from app.repositories.speaker_repository import SpeakerRepository
from app.schemas.speaker import (
    SessionSpeakerAssign,
    SessionSpeakerResponse,
    SpeakerCreate,
    SpeakerResponse,
    SpeakerUpdate,
)
from app.services.speaker_service import SpeakerService

router = APIRouter(tags=["speakers"])


def _speaker_response(item) -> SpeakerResponse:
    return SpeakerResponse(
        id=str(item.id),
        full_name=item.full_name,
        email=item.email,
        bio=item.bio,
        company=item.company,
        job_title=item.job_title,
        photo_url=item.photo_url,
        is_active=item.is_active,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


def _session_speaker_response(item, speaker) -> SessionSpeakerResponse:
    return SessionSpeakerResponse(
        id=str(item.id),
        session_id=str(item.session_id),
        speaker_id=str(item.speaker_id),
        assigned_at=item.assigned_at,
        role_in_session=item.role_in_session,
        speaker=_speaker_response(speaker),
    )


def _service(session: Session) -> SpeakerService:
    return SpeakerService(
        SpeakerRepository(session),
        SessionSpeakerRepository(session),
        SessionRepository(session),
        EventRepository(session),
    )


@router.get("/speakers", response_model=list[SpeakerResponse])
def list_speakers(
    active_only: bool = Query(default=False),
    session: Session = Depends(get_db_session),
) -> list[SpeakerResponse]:
    service = _service(session)
    items = service.list_speakers(active_only=active_only)
    return [_speaker_response(item) for item in items]


@router.get("/speakers/{speaker_id}", response_model=SpeakerResponse)
def get_speaker(speaker_id: UUID, session: Session = Depends(get_db_session)) -> SpeakerResponse:
    service = _service(session)
    item = service.get_speaker(speaker_id)
    return _speaker_response(item)


@router.post("/speakers", response_model=SpeakerResponse, status_code=status.HTTP_201_CREATED)
def create_speaker(
    payload: SpeakerCreate,
    session: Session = Depends(get_db_session),
    _: set[str] = Depends(require_roles("organizer", "admin")),
) -> SpeakerResponse:
    service = _service(session)
    item = service.create_speaker(payload)
    return _speaker_response(item)


@router.put("/speakers/{speaker_id}", response_model=SpeakerResponse)
def update_speaker(
    speaker_id: UUID,
    payload: SpeakerUpdate,
    session: Session = Depends(get_db_session),
    _: set[str] = Depends(require_roles("organizer", "admin")),
) -> SpeakerResponse:
    service = _service(session)
    item = service.update_speaker(speaker_id, payload)
    return _speaker_response(item)


@router.delete("/speakers/{speaker_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_speaker(
    speaker_id: UUID,
    session: Session = Depends(get_db_session),
    _: set[str] = Depends(require_roles("organizer", "admin")),
) -> None:
    service = _service(session)
    service.delete_speaker(speaker_id)


@router.get("/sessions/{session_id}/speakers", response_model=list[SessionSpeakerResponse])
def list_session_speakers(session_id: UUID, session: Session = Depends(get_db_session)) -> list[SessionSpeakerResponse]:
    service = _service(session)
    items = service.list_session_speakers(session_id)
    return [_session_speaker_response(item, speaker) for item, speaker in items]


@router.post(
    "/sessions/{session_id}/speakers/{speaker_id}",
    response_model=SessionSpeakerResponse,
    status_code=status.HTTP_201_CREATED,
)
def assign_speaker_to_session(
    session_id: UUID,
    speaker_id: UUID,
    payload: SessionSpeakerAssign,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
    role_names: set[str] = Depends(require_roles("organizer", "admin")),
) -> SessionSpeakerResponse:
    service = _service(session)
    item = service.assign_speaker_to_session(
        session_id=session_id,
        speaker_id=speaker_id,
        payload=payload,
        current_user_id=current_user.id,
        is_admin="admin" in role_names,
    )
    speaker = service.get_speaker(speaker_id)
    return _session_speaker_response(item, speaker)


@router.delete("/sessions/{session_id}/speakers/{speaker_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_speaker_from_session(
    session_id: UUID,
    speaker_id: UUID,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
    role_names: set[str] = Depends(require_roles("organizer", "admin")),
) -> None:
    service = _service(session)
    service.remove_speaker_from_session(
        session_id=session_id,
        speaker_id=speaker_id,
        current_user_id=current_user.id,
        is_admin="admin" in role_names,
    )
