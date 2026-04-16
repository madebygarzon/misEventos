from uuid import UUID

from sqlmodel import Session, select

from app.models.role import Role
from app.models.user_role import UserRole


class RoleRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_name(self, name: str) -> Role | None:
        statement = select(Role).where(Role.name == name)
        return self.session.exec(statement).first()

    def get_role_names_by_user_id(self, user_id: UUID) -> set[str]:
        statement = (
            select(Role.name)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(UserRole.user_id == user_id)
        )
        names = self.session.exec(statement).all()
        return set(names)

    def assign_role_by_name(self, user_id: UUID, role_name: str) -> None:
        role = self.get_by_name(role_name)
        if not role:
            return

        exists_stmt = select(UserRole).where(UserRole.user_id == user_id, UserRole.role_id == role.id)
        exists = self.session.exec(exists_stmt).first()
        if exists:
            return

        link = UserRole(user_id=user_id, role_id=role.id)
        self.session.add(link)
        self.session.commit()

    def set_user_roles(self, user_id: UUID, role_names: set[str]) -> None:
        if not role_names:
            return

        roles = self.session.exec(select(Role).where(Role.name.in_(role_names))).all()
        target_role_ids = {role.id for role in roles}
        if not target_role_ids:
            return

        current_links = self.session.exec(select(UserRole).where(UserRole.user_id == user_id)).all()
        current_role_ids = {link.role_id for link in current_links}

        for link in current_links:
            if link.role_id not in target_role_ids:
                self.session.delete(link)

        missing_role_ids = target_role_ids - current_role_ids
        for role_id in missing_role_ids:
            self.session.add(UserRole(user_id=user_id, role_id=role_id))

        self.session.commit()

    def ensure_core_roles(self) -> None:
        core_roles = {
            "attendee": "Can register to events",
            "organizer": "Can create and manage owned events",
            "admin": "Global management permissions",
        }

        changed = False
        for name, description in core_roles.items():
            if self.get_by_name(name):
                continue
            self.session.add(Role(name=name, description=description))
            changed = True

        if changed:
            self.session.commit()
