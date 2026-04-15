from sqlmodel import Session, select

from app.models.event import Event


class EventRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, event: Event) -> Event:
        self.session.add(event)
        self.session.commit()
        self.session.refresh(event)
        return event

    def get_by_id(self, event_id) -> Event | None:
        return self.session.get(Event, event_id)

    def list(self, search: str | None, status: str | None, offset: int, limit: int) -> list[Event]:
        statement = select(Event)
        if search:
            statement = statement.where(Event.name.ilike(f"%{search}%"))
        if status:
            statement = statement.where(Event.status == status)
        statement = statement.order_by(Event.created_at.desc()).offset(offset).limit(limit)
        return list(self.session.exec(statement).all())

    def count(self, search: str | None, status: str | None) -> int:
        statement = select(Event)
        if search:
            statement = statement.where(Event.name.ilike(f"%{search}%"))
        if status:
            statement = statement.where(Event.status == status)
        return len(self.session.exec(statement).all())

    def update(self, event: Event) -> Event:
        self.session.add(event)
        self.session.commit()
        self.session.refresh(event)
        return event

    def delete(self, event: Event) -> None:
        self.session.delete(event)
        self.session.commit()
