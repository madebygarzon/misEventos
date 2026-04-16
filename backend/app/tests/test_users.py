from sqlmodel import Session, select

from datetime import datetime, timezone, timedelta

from app.models.event import Event
from app.models.role import Role
from app.models.user import User
from app.models.user_role import UserRole


def _grant_role(session: Session, email: str, role_name: str) -> None:
    user = session.exec(select(User).where(User.email == email)).first()
    role = session.exec(select(Role).where(Role.name == role_name)).first()
    if not user or not role:
        return
    existing = session.exec(
        select(UserRole).where(UserRole.user_id == user.id, UserRole.role_id == role.id)
    ).first()
    if existing:
        return
    session.add(UserRole(user_id=user.id, role_id=role.id))
    session.commit()


def _auth_headers(client, email: str, session: Session | None = None, admin: bool = False) -> dict[str, str]:
    register_payload = {
        "email": email,
        "password": "password123",
        "full_name": "User Test",
    }
    client.post("/api/v1/auth/register", json=register_payload)
    login = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "password123"},
    )
    if admin and session:
        _grant_role(session, email, "admin")
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _create_event_for_user(session: Session, email: str) -> None:
    user = session.exec(select(User).where(User.email == email)).first()
    if not user:
        return

    start_date = datetime.now(timezone.utc) + timedelta(days=5)
    end_date = start_date + timedelta(hours=2)

    event = Event(
        organizer_id=user.id,
        name="Evento bloqueo downgrade",
        description="No debe permitir pasar a attendee",
        location="Bogota",
        start_date=start_date,
        end_date=end_date,
        capacity=50,
        status="draft",
    )
    session.add(event)
    session.commit()


def test_attendee_cannot_list_users(client):
    headers = _auth_headers(client, "attendee_users_1@example.com")
    response = client.get("/api/v1/users", headers=headers)
    assert response.status_code == 403


def test_admin_can_list_users(client, session: Session):
    _auth_headers(client, "u_list_1@example.com")
    admin_email = "admin_list_1@example.com"
    admin_headers = _auth_headers(client, admin_email, session, admin=True)

    response = client.get("/api/v1/users", headers=admin_headers)
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] >= 1
    assert any(item["email"] == "u_list_1@example.com" for item in payload["items"])
    assert all(item["email"] != admin_email for item in payload["items"])


def test_admin_can_update_user_role(client, session: Session):
    _auth_headers(client, "target_role_1@example.com")
    admin_headers = _auth_headers(client, "admin_role_1@example.com", session, admin=True)

    listing = client.get("/api/v1/users", headers=admin_headers)
    target = next(item for item in listing.json()["items"] if item["email"] == "target_role_1@example.com")

    update = client.patch(
        f"/api/v1/users/{target['id']}/role",
        json={"role": "organizer"},
        headers=admin_headers,
    )
    assert update.status_code == 200
    assert set(update.json()["roles"]) == {"organizer"}


def test_admin_can_downgrade_user_to_attendee(client, session: Session):
    _auth_headers(client, "target_role_2@example.com")
    admin_headers = _auth_headers(client, "admin_role_2@example.com", session, admin=True)

    listing = client.get("/api/v1/users", headers=admin_headers)
    target = next(item for item in listing.json()["items"] if item["email"] == "target_role_2@example.com")

    update = client.patch(
        f"/api/v1/users/{target['id']}/role",
        json={"role": "attendee"},
        headers=admin_headers,
    )
    assert update.status_code == 200
    assert set(update.json()["roles"]) == {"attendee"}


def test_cannot_downgrade_to_attendee_when_user_has_created_events(client, session: Session):
    _auth_headers(client, "target_role_3@example.com")
    _grant_role(session, "target_role_3@example.com", "organizer")
    _create_event_for_user(session, "target_role_3@example.com")
    admin_headers = _auth_headers(client, "admin_role_3@example.com", session, admin=True)

    listing = client.get("/api/v1/users", headers=admin_headers)
    target = next(item for item in listing.json()["items"] if item["email"] == "target_role_3@example.com")

    update = client.patch(
        f"/api/v1/users/{target['id']}/role",
        json={"role": "attendee"},
        headers=admin_headers,
    )
    assert update.status_code == 409
    assert update.json()["detail"] == "Cannot change role to attendee while user has created events"


def test_configured_admin_cannot_be_downgraded(client):
    headers = _auth_headers(client, "madebygarzon@gmail.com")
    me = client.get("/api/v1/auth/me", headers=headers)
    assert me.status_code == 200
    admin_id = me.json()["id"]

    update = client.patch(
        f"/api/v1/users/{admin_id}/role",
        json={"role": "organizer"},
        headers=headers,
    )
    assert update.status_code == 400
