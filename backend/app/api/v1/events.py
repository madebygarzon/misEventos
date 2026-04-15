from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlmodel import Session

from app.api.deps import get_current_user, get_db_session
from app.models.user import User
from app.repositories.event_repository import EventRepository
from app.schemas.event import EventCreate, EventListResponse, EventResponse, EventUpdate
from app.services.event_service import EventService

router = APIRouter(prefix="/events", tags=["events"])


def _to_response(event) -> EventResponse:
    return EventResponse(
        id=str(event.id),
        organizer_id=str(event.organizer_id),
        name=event.name,
        description=event.description,
        location=event.location,
        start_date=event.start_date,
        end_date=event.end_date,
        capacity=event.capacity,
        status=event.status,
        created_at=event.created_at,
        updated_at=event.updated_at,
    )


@router.get("", response_model=EventListResponse)
def list_events(
    search: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    session: Session = Depends(get_db_session),
) -> EventListResponse:
    service = EventService(EventRepository(session))
    result = service.list(search=search, status_filter=status_filter, page=page, limit=limit)
    return EventListResponse(
        items=[_to_response(item) for item in result["items"]],
        total=result["total"],
        page=result["page"],
        limit=result["limit"],
        pages=result["pages"],
    )


@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: UUID, session: Session = Depends(get_db_session)) -> EventResponse:
    service = EventService(EventRepository(session))
    event = service.get_by_id(event_id)
    return _to_response(event)


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    payload: EventCreate,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> EventResponse:
    service = EventService(EventRepository(session))
    event = service.create(payload=payload, organizer_id=current_user.id)
    return _to_response(event)


@router.put("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: UUID,
    payload: EventUpdate,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> EventResponse:
    service = EventService(EventRepository(session))
    event = service.update(event_id=event_id, payload=payload, current_user_id=current_user.id)
    return _to_response(event)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: UUID,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> None:
    service = EventService(EventRepository(session))
    service.delete(event_id=event_id, current_user_id=current_user.id)
