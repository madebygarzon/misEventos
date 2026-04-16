from sqlmodel import Session, select

from app.models.speaker import Speaker


class SpeakerRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, speaker: Speaker) -> Speaker:
        self.session.add(speaker)
        self.session.commit()
        self.session.refresh(speaker)
        return speaker

    def get_by_id(self, speaker_id) -> Speaker | None:
        return self.session.get(Speaker, speaker_id)

    def list(self, active_only: bool = False) -> list[Speaker]:
        statement = select(Speaker)
        if active_only:
            statement = statement.where(Speaker.is_active == True)  # noqa: E712
        statement = statement.order_by(Speaker.full_name.asc())
        return list(self.session.exec(statement).all())

    def update(self, speaker: Speaker) -> Speaker:
        self.session.add(speaker)
        self.session.commit()
        self.session.refresh(speaker)
        return speaker

    def delete(self, speaker: Speaker) -> None:
        self.session.delete(speaker)
        self.session.commit()
