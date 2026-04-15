from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status

from app.models.session import EventSession
from app.repositories.event_repository import EventRepository
from app.repositories.session_repository import SessionRepository
from app.schemas.session import SessionCreate, SessionUpdate

VALID_SESSION_STATUSES = {"scheduled", "in_progress", "finished", "cancelled"}


class SessionService:
    def __init__(self, session_repository: SessionRepository, event_repository: EventRepository):
        self.session_repository = session_repository
        self.event_repository = event_repository

    def _validate_status(self, status_value: str) -> None:
        if status_value not in VALID_SESSION_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid session status",
            )

    def _validate_times(self, start_time: datetime, end_time: datetime) -> None:
        if start_time >= end_time:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="start_time must be before end_time",
            )

    def _get_event_or_404(self, event_id: UUID):
        event = self.event_repository.get_by_id(event_id)
        if not event:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
        return event

    def _validate_within_event_range(self, event, start_time: datetime, end_time: datetime) -> None:
        if start_time < event.start_date or end_time > event.end_date:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Session must be within event date range",
            )

    def list_by_event(self, event_id: UUID) -> list[EventSession]:
        self._get_event_or_404(event_id)
        return self.session_repository.list_by_event(event_id)

    def create(self, event_id: UUID, payload: SessionCreate, current_user_id: UUID) -> EventSession:
        event = self._get_event_or_404(event_id)

        if event.organizer_id != current_user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

        self._validate_status(payload.status)
        self._validate_times(payload.start_time, payload.end_time)
        self._validate_within_event_range(event, payload.start_time, payload.end_time)

        event_session = EventSession(
            event_id=event_id,
            title=payload.title,
            description=payload.description,
            start_time=payload.start_time,
            end_time=payload.end_time,
            capacity=payload.capacity,
            status=payload.status,
        )
        return self.session_repository.create(event_session)

    def update(self, session_id: UUID, payload: SessionUpdate, current_user_id: UUID) -> EventSession:
        event_session = self.session_repository.get_by_id(session_id)
        if not event_session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

        event = self._get_event_or_404(event_session.event_id)
        if event.organizer_id != current_user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

        update_data = payload.model_dump(exclude_unset=True)

        if "status" in update_data:
            self._validate_status(update_data["status"])

        start = update_data.get("start_time", event_session.start_time)
        end = update_data.get("end_time", event_session.end_time)

        self._validate_times(start, end)
        self._validate_within_event_range(event, start, end)

        for key, value in update_data.items():
            setattr(event_session, key, value)

        event_session.updated_at = datetime.now(timezone.utc)
        return self.session_repository.update(event_session)

    def delete(self, session_id: UUID, current_user_id: UUID) -> None:
        event_session = self.session_repository.get_by_id(session_id)
        if not event_session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

        event = self._get_event_or_404(event_session.event_id)
        if event.organizer_id != current_user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

        self.session_repository.delete(event_session)
