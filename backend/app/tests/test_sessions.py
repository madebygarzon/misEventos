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


def _auth_headers(client, email: str, session: Session | None = None, organizer: bool = False) -> dict[str, str]:
    register_payload = {
        "email": email,
        "password": "password123",
        "full_name": "Session Owner",
    }
    client.post("/api/v1/auth/register", json=register_payload)
    login = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "password123"},
    )
    if organizer and session:
        _grant_role(session, email, "organizer")
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}



def _event_payload(name: str = "Event for Sessions") -> dict:
    start = datetime.now(timezone.utc) + timedelta(days=2)
    end = start + timedelta(hours=8)
    return {
        "name": name,
        "description": "Event base",
        "location": "Bogota",
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "capacity": 200,
        "status": "draft",
    }



def _session_payload(start_time: datetime, end_time: datetime, title: str = "Session 1") -> dict:
    return {
        "title": title,
        "description": "Session description",
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat(),
        "status": "scheduled",
    }



def _create_event(client, headers: dict[str, str]) -> dict:
    created = client.post("/api/v1/events", json=_event_payload(), headers=headers)
    assert created.status_code == 201
    return created.json()



def test_create_and_list_sessions(client, session: Session):
    headers = _auth_headers(client, "session_owner1@example.com", session, organizer=True)
    event = _create_event(client, headers)

    event_start = datetime.fromisoformat(event["start_date"])
    session_start = event_start + timedelta(hours=1)
    session_end = session_start + timedelta(hours=1)

    created = client.post(
        f"/api/v1/events/{event['id']}/sessions",
        json=_session_payload(session_start, session_end),
        headers=headers,
    )
    assert created.status_code == 201

    listing = client.get(f"/api/v1/events/{event['id']}/sessions")
    assert listing.status_code == 200
    assert len(listing.json()) == 1
    assert listing.json()[0]["title"] == "Session 1"



def test_create_session_requires_auth(client, session: Session):
    headers = _auth_headers(client, "session_owner2@example.com", session, organizer=True)
    event = _create_event(client, headers)

    event_start = datetime.fromisoformat(event["start_date"])
    event_end = datetime.fromisoformat(event["end_date"])

    response = client.post(
        f"/api/v1/events/{event['id']}/sessions",
        json=_session_payload(event_start + timedelta(hours=1), event_end - timedelta(hours=1)),
    )
    assert response.status_code == 401



def test_session_must_be_within_event_range(client, session: Session):
    headers = _auth_headers(client, "session_owner3@example.com", session, organizer=True)
    event = _create_event(client, headers)

    event_start = datetime.fromisoformat(event["start_date"])
    event_end = datetime.fromisoformat(event["end_date"])

    invalid = client.post(
        f"/api/v1/events/{event['id']}/sessions",
        json=_session_payload(event_start - timedelta(hours=2), event_end - timedelta(hours=1), "Invalid"),
        headers=headers,
    )
    assert invalid.status_code == 422



def test_update_and_delete_session_owner(client, session: Session):
    headers = _auth_headers(client, "session_owner4@example.com", session, organizer=True)
    event = _create_event(client, headers)

    event_start = datetime.fromisoformat(event["start_date"])
    session_start = event_start + timedelta(hours=1)
    session_end = session_start + timedelta(hours=1)

    created = client.post(
        f"/api/v1/events/{event['id']}/sessions",
        json=_session_payload(session_start, session_end),
        headers=headers,
    )
    session_id = created.json()["id"]

    updated = client.put(
        f"/api/v1/sessions/{session_id}",
        json={"title": "Updated Session", "status": "in_progress"},
        headers=headers,
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "Updated Session"

    deleted = client.delete(f"/api/v1/sessions/{session_id}", headers=headers)
    assert deleted.status_code == 204



def test_forbidden_session_update_non_owner(client, session: Session):
    owner_headers = _auth_headers(client, "session_owner5@example.com", session, organizer=True)
    other_headers = _auth_headers(client, "session_other5@example.com", session, organizer=True)
    event = _create_event(client, owner_headers)

    event_start = datetime.fromisoformat(event["start_date"])
    session_start = event_start + timedelta(hours=1)
    session_end = session_start + timedelta(hours=1)

    created = client.post(
        f"/api/v1/events/{event['id']}/sessions",
        json=_session_payload(session_start, session_end),
        headers=owner_headers,
    )
    session_id = created.json()["id"]

    forbidden = client.put(
        f"/api/v1/sessions/{session_id}",
        json={"title": "Not allowed"},
        headers=other_headers,
    )
    assert forbidden.status_code == 403
