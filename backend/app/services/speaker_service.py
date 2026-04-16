from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status

from app.models.session_speaker import SessionSpeaker
from app.models.speaker import Speaker
from app.repositories.event_repository import EventRepository
from app.repositories.session_repository import SessionRepository
from app.repositories.session_speaker_repository import SessionSpeakerRepository
from app.repositories.speaker_repository import SpeakerRepository
from app.schemas.speaker import SessionSpeakerAssign, SpeakerCreate, SpeakerUpdate


class SpeakerService:
    def __init__(
        self,
        speaker_repository: SpeakerRepository,
        session_speaker_repository: SessionSpeakerRepository,
        session_repository: SessionRepository,
        event_repository: EventRepository,
    ):
        self.speaker_repository = speaker_repository
        self.session_speaker_repository = session_speaker_repository
        self.session_repository = session_repository
        self.event_repository = event_repository

    def _get_speaker_or_404(self, speaker_id: UUID) -> Speaker:
        speaker = self.speaker_repository.get_by_id(speaker_id)
        if not speaker:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Speaker not found")
        return speaker

    def _get_session_or_404(self, session_id: UUID):
        event_session = self.session_repository.get_by_id(session_id)
        if not event_session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        return event_session

    def _ensure_can_manage_session(self, session_id: UUID, current_user_id: UUID, is_admin: bool = False) -> None:
        event_session = self._get_session_or_404(session_id)
        event = self.event_repository.get_by_id(event_session.event_id)
        if not event:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
        if not is_admin and event.organizer_id != current_user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    def list_speakers(self, active_only: bool = False) -> list[Speaker]:
        return self.speaker_repository.list(active_only=active_only)

    def get_speaker(self, speaker_id: UUID) -> Speaker:
        return self._get_speaker_or_404(speaker_id)

    def create_speaker(self, payload: SpeakerCreate) -> Speaker:
        speaker = Speaker(**payload.model_dump())
        return self.speaker_repository.create(speaker)

    def update_speaker(self, speaker_id: UUID, payload: SpeakerUpdate) -> Speaker:
        speaker = self._get_speaker_or_404(speaker_id)
        update_data = payload.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(speaker, key, value)
        speaker.updated_at = datetime.now(timezone.utc)
        return self.speaker_repository.update(speaker)

    def delete_speaker(self, speaker_id: UUID) -> None:
        speaker = self._get_speaker_or_404(speaker_id)
        self.speaker_repository.delete(speaker)

    def assign_speaker_to_session(
        self,
        session_id: UUID,
        speaker_id: UUID,
        payload: SessionSpeakerAssign,
        current_user_id: UUID,
        is_admin: bool = False,
    ) -> SessionSpeaker:
        self._ensure_can_manage_session(session_id, current_user_id, is_admin=is_admin)
        self._get_speaker_or_404(speaker_id)

        existing = self.session_speaker_repository.get_by_session_speaker(session_id, speaker_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Speaker already assigned to this session",
            )

        item = SessionSpeaker(
            session_id=session_id,
            speaker_id=speaker_id,
            role_in_session=payload.role_in_session,
        )
        return self.session_speaker_repository.create(item)

    def remove_speaker_from_session(
        self,
        session_id: UUID,
        speaker_id: UUID,
        current_user_id: UUID,
        is_admin: bool = False,
    ) -> None:
        self._ensure_can_manage_session(session_id, current_user_id, is_admin=is_admin)

        existing = self.session_speaker_repository.get_by_session_speaker(session_id, speaker_id)
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Speaker assignment not found")

        self.session_speaker_repository.delete(existing)

    def list_session_speakers(self, session_id: UUID) -> list[tuple[SessionSpeaker, Speaker]]:
        self._get_session_or_404(session_id)
        items = self.session_speaker_repository.list_by_session(session_id)
        result: list[tuple[SessionSpeaker, Speaker]] = []
        for item in items:
            speaker = self.speaker_repository.get_by_id(item.speaker_id)
            if speaker:
                result.append((item, speaker))
        return result
