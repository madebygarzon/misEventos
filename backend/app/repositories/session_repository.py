from sqlmodel import Session, select

from app.models.session import EventSession


class SessionRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, event_session: EventSession) -> EventSession:
        self.session.add(event_session)
        self.session.commit()
        self.session.refresh(event_session)
        return event_session

    def list_by_event(self, event_id) -> list[EventSession]:
        statement = (
            select(EventSession)
            .where(EventSession.event_id == event_id)
            .order_by(EventSession.start_time.asc())
        )
        return list(self.session.exec(statement).all())

    def get_by_id(self, session_id) -> EventSession | None:
        return self.session.get(EventSession, session_id)

    def update(self, event_session: EventSession) -> EventSession:
        self.session.add(event_session)
        self.session.commit()
        self.session.refresh(event_session)
        return event_session

    def delete(self, event_session: EventSession) -> None:
        self.session.delete(event_session)
        self.session.commit()
