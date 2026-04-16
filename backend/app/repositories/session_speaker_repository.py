from sqlmodel import Session, select

from app.models.session_speaker import SessionSpeaker


class SessionSpeakerRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_session_speaker(self, session_id, speaker_id) -> SessionSpeaker | None:
        statement = select(SessionSpeaker).where(
            SessionSpeaker.session_id == session_id,
            SessionSpeaker.speaker_id == speaker_id,
        )
        return self.session.exec(statement).first()

    def create(self, item: SessionSpeaker) -> SessionSpeaker:
        self.session.add(item)
        self.session.commit()
        self.session.refresh(item)
        return item

    def list_by_session(self, session_id) -> list[SessionSpeaker]:
        statement = (
            select(SessionSpeaker)
            .where(SessionSpeaker.session_id == session_id)
            .order_by(SessionSpeaker.assigned_at.asc())
        )
        return list(self.session.exec(statement).all())

    def delete(self, item: SessionSpeaker) -> None:
        self.session.delete(item)
        self.session.commit()
