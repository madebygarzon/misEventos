from datetime import datetime, timedelta, timezone

from sqlmodel import Session, select

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


def _auth_headers(
    client,
    email: str,
    session: Session | None = None,
    organizer: bool = False,
    admin: bool = False,
) -> dict[str, str]:
    register_payload = {
        "email": email,
        "password": "password123",
        "full_name": "Event Owner",
    }
    client.post("/api/v1/auth/register", json=register_payload)
    login = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "password123"},
    )
    if organizer and session:
        _grant_role(session, email, "organizer")
    if admin and session:
        _grant_role(session, email, "admin")
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}



def _event_payload(name: str = "Evento Demo") -> dict:
    start = datetime.now(timezone.utc) + timedelta(days=1)
    end = start + timedelta(hours=2)
    return {
        "name": name,
        "description": "Evento de prueba",
        "location": "Bogota",
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "capacity": 100,
        "status": "draft",
    }



def test_create_event_requires_auth(client):
    response = client.post("/api/v1/events", json=_event_payload())
    assert response.status_code == 401



def test_attendee_cannot_create_event(client):
    headers = _auth_headers(client, "attendee_only@example.com")
    response = client.post("/api/v1/events", json=_event_payload(), headers=headers)
    assert response.status_code == 403


def test_create_and_get_event(client, session: Session):
    headers = _auth_headers(client, "owner1@example.com", session, organizer=True)

    created = client.post("/api/v1/events", json=_event_payload("TechConf"), headers=headers)
    assert created.status_code == 201
    event_id = created.json()["id"]

    fetched = client.get(f"/api/v1/events/{event_id}")
    assert fetched.status_code == 200
    assert fetched.json()["name"] == "TechConf"



def test_list_search_and_pagination(client, session: Session):
    headers = _auth_headers(client, "owner2@example.com", session, organizer=True)

    client.post("/api/v1/events", json=_event_payload("Python Summit"), headers=headers)
    client.post("/api/v1/events", json=_event_payload("JavaScript Day"), headers=headers)

    listing = client.get("/api/v1/events?page=1&limit=1")
    assert listing.status_code == 200
    assert listing.json()["page"] == 1
    assert listing.json()["limit"] == 1
    assert listing.json()["total"] >= 2
    assert len(listing.json()["items"]) == 1

    filtered = client.get("/api/v1/events?search=Python")
    assert filtered.status_code == 200
    assert any("Python" in item["name"] for item in filtered.json()["items"])



def test_update_and_delete_event_owner(client, session: Session):
    headers = _auth_headers(client, "owner3@example.com", session, organizer=True)

    created = client.post("/api/v1/events", json=_event_payload("Original"), headers=headers)
    event_id = created.json()["id"]

    updated = client.put(
        f"/api/v1/events/{event_id}",
        json={"name": "Updated", "status": "published"},
        headers=headers,
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Updated"
    assert updated.json()["status"] == "published"

    deleted = client.delete(f"/api/v1/events/{event_id}", headers=headers)
    assert deleted.status_code == 204

    missing = client.get(f"/api/v1/events/{event_id}")
    assert missing.status_code == 404



def test_forbidden_update_by_non_owner(client, session: Session):
    owner_headers = _auth_headers(client, "owner4@example.com", session, organizer=True)
    other_headers = _auth_headers(client, "other4@example.com", session, organizer=True)

    created = client.post("/api/v1/events", json=_event_payload("Private Event"), headers=owner_headers)
    event_id = created.json()["id"]

    forbidden = client.put(
        f"/api/v1/events/{event_id}",
        json={"name": "Hacked"},
        headers=other_headers,
    )
    assert forbidden.status_code == 403


def test_admin_can_update_non_owned_event(client, session: Session):
    owner_headers = _auth_headers(client, "owner5@example.com", session, organizer=True)
    admin_headers = _auth_headers(client, "admin5@example.com", session, admin=True)

    created = client.post("/api/v1/events", json=_event_payload("Managed by owner"), headers=owner_headers)
    event_id = created.json()["id"]

    updated = client.put(
        f"/api/v1/events/{event_id}",
        json={"name": "Managed by admin"},
        headers=admin_headers,
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Managed by admin"
