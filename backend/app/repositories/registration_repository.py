from sqlmodel import Session, select

from app.models.registration import Registration


class RegistrationRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_user_event(self, user_id, event_id) -> Registration | None:
        statement = select(Registration).where(
            Registration.user_id == user_id,
            Registration.event_id == event_id,
        )
        return self.session.exec(statement).first()

    def count_registered_by_event(self, event_id) -> int:
        statement = select(Registration).where(
            Registration.event_id == event_id,
            Registration.status == "registered",
        )
        return len(self.session.exec(statement).all())

    def create(self, registration: Registration) -> Registration:
        self.session.add(registration)
        self.session.commit()
        self.session.refresh(registration)
        return registration

    def update(self, registration: Registration) -> Registration:
        self.session.add(registration)
        self.session.commit()
        self.session.refresh(registration)
        return registration

    def list_by_user(self, user_id) -> list[Registration]:
        statement = (
            select(Registration)
            .where(Registration.user_id == user_id)
            .order_by(Registration.registered_at.desc())
        )
        return list(self.session.exec(statement).all())

    def list_registered_by_event(self, event_id) -> list[Registration]:
        statement = (
            select(Registration)
            .where(
                Registration.event_id == event_id,
                Registration.status == "registered",
            )
            .order_by(Registration.registered_at.desc())
        )
        return list(self.session.exec(statement).all())
