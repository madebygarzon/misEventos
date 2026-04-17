from sqlmodel import Session, select

from app.models.event_speaker import EventSpeaker


class EventSpeakerRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_event_speaker(self, event_id, speaker_id) -> EventSpeaker | None:
        statement = select(EventSpeaker).where(
            EventSpeaker.event_id == event_id,
            EventSpeaker.speaker_id == speaker_id,
        )
        return self.session.exec(statement).first()

    def create(self, item: EventSpeaker) -> EventSpeaker:
        self.session.add(item)
        self.session.commit()
        self.session.refresh(item)
        return item

    def list_by_event(self, event_id) -> list[EventSpeaker]:
        statement = (
            select(EventSpeaker)
            .where(EventSpeaker.event_id == event_id)
            .order_by(EventSpeaker.assigned_at.asc())
        )
        return list(self.session.exec(statement).all())

    def delete(self, item: EventSpeaker) -> None:
        self.session.delete(item)
        self.session.commit()
