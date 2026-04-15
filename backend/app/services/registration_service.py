from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status

from app.models.registration import Registration
from app.repositories.event_repository import EventRepository
from app.repositories.registration_repository import RegistrationRepository
from app.schemas.registration import RegistrationCreate

VALID_REGISTRATION_STATUSES = {"registered", "cancelled", "waitlist"}


class RegistrationService:
    def __init__(
        self,
        registration_repository: RegistrationRepository,
        event_repository: EventRepository,
    ):
        self.registration_repository = registration_repository
        self.event_repository = event_repository

    def _get_event_or_404(self, event_id: UUID):
        event = self.event_repository.get_by_id(event_id)
        if not event:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
        return event

    def register(self, user_id: UUID, event_id: UUID, payload: RegistrationCreate) -> Registration:
        event = self._get_event_or_404(event_id)

        existing = self.registration_repository.get_by_user_event(user_id=user_id, event_id=event_id)
        if existing and existing.status == "registered":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User is already registered for this event",
            )

        registered_count = self.registration_repository.count_registered_by_event(event_id)
        if registered_count >= event.capacity:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Event is full")

        if existing and existing.status in VALID_REGISTRATION_STATUSES:
            existing.status = "registered"
            existing.registered_at = datetime.now(timezone.utc)
            existing.notes = payload.notes
            return self.registration_repository.update(existing)

        registration = Registration(
            user_id=user_id,
            event_id=event_id,
            status="registered",
            notes=payload.notes,
        )
        return self.registration_repository.create(registration)

    def cancel(self, user_id: UUID, event_id: UUID) -> None:
        self._get_event_or_404(event_id)
        registration = self.registration_repository.get_by_user_event(user_id=user_id, event_id=event_id)
        if not registration or registration.status != "registered":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found")

        registration.status = "cancelled"
        self.registration_repository.update(registration)

    def my_registrations(self, user_id: UUID) -> list[Registration]:
        return self.registration_repository.list_by_user(user_id=user_id)
