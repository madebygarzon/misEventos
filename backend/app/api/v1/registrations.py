from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from app.api.deps import get_current_user, get_db_session, require_roles
from app.models.user import User
from app.repositories.event_repository import EventRepository
from app.repositories.registration_repository import RegistrationRepository
from app.schemas.registration import (
    MyRegistrationsResponse,
    RegistrationCreate,
    RegistrationResponse,
)
from app.services.registration_service import RegistrationService

router = APIRouter(tags=["registrations"])


def _to_response(item) -> RegistrationResponse:
    return RegistrationResponse(
        id=str(item.id),
        user_id=str(item.user_id),
        event_id=str(item.event_id),
        status=item.status,
        registered_at=item.registered_at,
        notes=item.notes,
    )


@router.post(
    "/events/{event_id}/register",
    response_model=RegistrationResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_to_event(
    event_id: UUID,
    payload: RegistrationCreate,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
    _: set[str] = Depends(require_roles("attendee", "organizer", "admin")),
) -> RegistrationResponse:
    service = RegistrationService(RegistrationRepository(session), EventRepository(session))
    registration = service.register(user_id=current_user.id, event_id=event_id, payload=payload)
    return _to_response(registration)


@router.delete("/events/{event_id}/register", status_code=status.HTTP_204_NO_CONTENT)
def cancel_registration(
    event_id: UUID,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
    _: set[str] = Depends(require_roles("attendee", "organizer", "admin")),
) -> None:
    service = RegistrationService(RegistrationRepository(session), EventRepository(session))
    service.cancel(user_id=current_user.id, event_id=event_id)


@router.get("/users/me/registrations", response_model=MyRegistrationsResponse)
def my_registrations(
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
    _: set[str] = Depends(require_roles("attendee", "organizer", "admin")),
) -> MyRegistrationsResponse:
    service = RegistrationService(RegistrationRepository(session), EventRepository(session))
    items = service.my_registrations(user_id=current_user.id)
    return MyRegistrationsResponse(items=[_to_response(item) for item in items], total=len(items))
