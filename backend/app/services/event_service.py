from datetime import datetime, timezone
from math import ceil
from uuid import UUID

from fastapi import HTTPException, status

from app.models.event import Event
from app.repositories.event_repository import EventRepository
from app.schemas.event import EventCreate, EventUpdate

VALID_EVENT_STATUSES = {"draft", "published", "cancelled", "finished"}


class EventService:
    def __init__(self, event_repository: EventRepository):
        self.event_repository = event_repository

    def _validate_dates(self, start_date: datetime, end_date: datetime) -> None:
        if start_date >= end_date:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="start_date must be before end_date",
            )

    def _validate_status(self, status_value: str) -> None:
        if status_value not in VALID_EVENT_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid event status",
            )

    def create(self, payload: EventCreate, organizer_id: UUID) -> Event:
        self._validate_dates(payload.start_date, payload.end_date)
        self._validate_status(payload.status)

        event = Event(
            organizer_id=organizer_id,
            name=payload.name,
            description=payload.description,
            location=payload.location,
            start_date=payload.start_date,
            end_date=payload.end_date,
            capacity=payload.capacity,
            status=payload.status,
        )
        return self.event_repository.create(event)

    def get_by_id(self, event_id: UUID) -> Event:
        event = self.event_repository.get_by_id(event_id)
        if not event:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
        return event

    def list(self, search: str | None, status_filter: str | None, page: int, limit: int):
        if status_filter:
            self._validate_status(status_filter)

        offset = (page - 1) * limit
        items = self.event_repository.list(search=search, status=status_filter, offset=offset, limit=limit)
        total = self.event_repository.count(search=search, status=status_filter)
        pages = max(1, ceil(total / limit))
        return {"items": items, "total": total, "page": page, "limit": limit, "pages": pages}

    def update(self, event_id: UUID, payload: EventUpdate, current_user_id: UUID) -> Event:
        event = self.get_by_id(event_id)

        if event.organizer_id != current_user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

        update_data = payload.model_dump(exclude_unset=True)

        if "status" in update_data:
            self._validate_status(update_data["status"])

        start = update_data.get("start_date", event.start_date)
        end = update_data.get("end_date", event.end_date)
        self._validate_dates(start, end)

        for key, value in update_data.items():
            setattr(event, key, value)

        event.updated_at = datetime.now(timezone.utc)
        return self.event_repository.update(event)

    def delete(self, event_id: UUID, current_user_id: UUID) -> None:
        event = self.get_by_id(event_id)
        if event.organizer_id != current_user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        self.event_repository.delete(event)
