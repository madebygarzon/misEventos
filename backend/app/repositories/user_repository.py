from uuid import UUID

from sqlmodel import Session, select

from app.models.user import User


class UserRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_email(self, email: str) -> User | None:
        statement = select(User).where(User.email == email)
        return self.session.exec(statement).first()

    def create(self, user: User) -> User:
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user

    def get_by_id(self, user_id: UUID) -> User | None:
        return self.session.get(User, user_id)

    def list_all(self) -> list[User]:
        statement = select(User).order_by(User.created_at.desc())
        return list(self.session.exec(statement).all())

    def update(self, user: User) -> User:
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user
