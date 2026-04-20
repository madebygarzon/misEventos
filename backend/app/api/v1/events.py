from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlmodel import Session

from app.api.deps import get_current_user, get_db_session, require_roles
from app.core.cache import cache_delete_patterns, cache_get_json, cache_set_json
from app.models.user import User
from app.repositories.event_repository import EventRepository
from app.repositories.registration_repository import RegistrationRepository
from app.repositories.user_repository import UserRepository
from app.schemas.event import EventCreate, EventListResponse, EventResponse, EventUpdate
from app.services.event_service import EventService

router = APIRouter(prefix="/events", tags=["events"])


def _events_list_cache_key(search: str | None, status_filter: str | None, page: int, limit: int) -> str:
    return f"events:list:search={search or ''}:status={status_filter or ''}:page={page}:limit={limit}"


def _event_detail_cache_key(event_id: UUID) -> str:
    return f"events:detail:{event_id}"


def _to_response(event, session: Session) -> EventResponse:
    organizer = UserRepository(session).get_by_id(event.organizer_id)
    registered_count = RegistrationRepository(session).count_registered_by_event(event.id)
    return EventResponse(
        id=str(event.id),
        organizer_id=str(event.organizer_id),
        organizer_name=organizer.full_name if organizer else None,
        name=event.name,
        description=event.description,
        location=event.location,
        featured_image_sm_url=event.featured_image_sm_url,
        featured_image_md_url=event.featured_image_md_url,
        featured_image_lg_url=event.featured_image_lg_url,
        featured_image_alt=event.featured_image_alt,
        start_date=event.start_date,
        end_date=event.end_date,
        capacity=event.capacity,
        registered_count=registered_count,
        is_full=registered_count >= event.capacity,
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
    cache_key = _events_list_cache_key(search=search, status_filter=status_filter, page=page, limit=limit)
    cached = cache_get_json(cache_key)
    if cached is not None:
        return EventListResponse.model_validate(cached)

    service = EventService(EventRepository(session))
    result = service.list(search=search, status_filter=status_filter, page=page, limit=limit)
    response = EventListResponse(
        items=[_to_response(item, session) for item in result["items"]],
        total=result["total"],
        page=result["page"],
        limit=result["limit"],
        pages=result["pages"],
    )
    cache_set_json(cache_key, response.model_dump(mode="json"))
    return response


@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: UUID, session: Session = Depends(get_db_session)) -> EventResponse:
    cache_key = _event_detail_cache_key(event_id)
    cached = cache_get_json(cache_key)
    if cached is not None:
        return EventResponse.model_validate(cached)

    service = EventService(EventRepository(session))
    event = service.get_by_id(event_id)
    response = _to_response(event, session)
    cache_set_json(cache_key, response.model_dump(mode="json"))
    return response


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    payload: EventCreate,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
    _: set[str] = Depends(require_roles("organizer", "admin")),
) -> EventResponse:
    service = EventService(EventRepository(session))
    event = service.create(payload=payload, organizer_id=current_user.id)
    cache_delete_patterns(patterns=["events:list:*"])
    return _to_response(event, session)


@router.put("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: UUID,
    payload: EventUpdate,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
    role_names: set[str] = Depends(require_roles("organizer", "admin")),
) -> EventResponse:
    service = EventService(EventRepository(session))
    event = service.update(
        event_id=event_id,
        payload=payload,
        current_user_id=current_user.id,
        is_admin="admin" in role_names,
    )
    cache_delete_patterns(patterns=["events:list:*", _event_detail_cache_key(event_id)])
    return _to_response(event, session)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: UUID,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
    role_names: set[str] = Depends(require_roles("organizer", "admin")),
) -> None:
    service = EventService(EventRepository(session))
    service.delete(event_id=event_id, current_user_id=current_user.id, is_admin="admin" in role_names)
    cache_delete_patterns(patterns=["events:list:*", _event_detail_cache_key(event_id)])
