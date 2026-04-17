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
    payload = {"email": email, "password": "password123", "full_name": "Speaker Manager"}
    client.post("/api/v1/auth/register", json=payload)
    login = client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    if organizer and session:
        _grant_role(session, email, "organizer")
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _event_payload() -> dict:
    start = datetime.now(timezone.utc) + timedelta(days=1)
    end = start + timedelta(hours=8)
    return {
        "name": "Evento Speaker",
        "description": "Evento con ponentes",
        "location": "Bogota",
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "capacity": 100,
        "status": "draft",
    }


def _session_payload(start: datetime, end: datetime) -> dict:
    return {
        "title": "Sesion principal",
        "description": "Detalle",
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
        "status": "scheduled",
    }


def test_create_list_update_delete_speaker(client, session: Session):
    headers = _auth_headers(client, "speaker_owner1@example.com", session, organizer=True)

    created = client.post(
        "/api/v1/speakers",
        json={
            "full_name": "Ada Lovelace",
            "email": "ada@example.com",
            "company": "Analytical Engine",
            "job_title": "Pioneer",
        },
        headers=headers,
    )
    assert created.status_code == 201
    speaker_id = created.json()["id"]

    listing = client.get("/api/v1/speakers")
    assert listing.status_code == 200
    assert any(item["id"] == speaker_id for item in listing.json())

    updated = client.put(
        f"/api/v1/speakers/{speaker_id}",
        json={"job_title": "Mathematician", "is_active": False},
        headers=headers,
    )
    assert updated.status_code == 200
    assert updated.json()["job_title"] == "Mathematician"
    assert updated.json()["is_active"] is False

    deleted = client.delete(f"/api/v1/speakers/{speaker_id}", headers=headers)
    assert deleted.status_code == 204

    missing = client.get(f"/api/v1/speakers/{speaker_id}")
    assert missing.status_code == 404


def test_assign_and_remove_speaker_from_session(client, session: Session):
    headers = _auth_headers(client, "speaker_owner2@example.com", session, organizer=True)

    event = client.post("/api/v1/events", json=_event_payload(), headers=headers).json()
    start = datetime.fromisoformat(event["start_date"]) + timedelta(hours=1)
    end = start + timedelta(hours=1)
    event_session = client.post(
        f"/api/v1/events/{event['id']}/sessions",
        json=_session_payload(start, end),
        headers=headers,
    ).json()

    speaker = client.post(
        "/api/v1/speakers",
        json={"full_name": "Grace Hopper", "email": "grace@example.com"},
        headers=headers,
    ).json()

    assigned = client.post(
        f"/api/v1/sessions/{event_session['id']}/speakers/{speaker['id']}",
        json={"role_in_session": "Keynote"},
        headers=headers,
    )
    assert assigned.status_code == 201
    assert assigned.json()["speaker"]["full_name"] == "Grace Hopper"

    listing = client.get(f"/api/v1/sessions/{event_session['id']}/speakers")
    assert listing.status_code == 200
    assert len(listing.json()) == 1

    removed = client.delete(
        f"/api/v1/sessions/{event_session['id']}/speakers/{speaker['id']}",
        headers=headers,
    )
    assert removed.status_code == 204


def test_forbidden_assign_speaker_by_non_owner(client, session: Session):
    owner_headers = _auth_headers(client, "speaker_owner3@example.com", session, organizer=True)
    other_headers = _auth_headers(client, "speaker_other3@example.com", session, organizer=True)

    event = client.post("/api/v1/events", json=_event_payload(), headers=owner_headers).json()
    start = datetime.fromisoformat(event["start_date"]) + timedelta(hours=1)
    end = start + timedelta(hours=1)
    event_session = client.post(
        f"/api/v1/events/{event['id']}/sessions",
        json=_session_payload(start, end),
        headers=owner_headers,
    ).json()

    speaker = client.post(
        "/api/v1/speakers",
        json={"full_name": "Linus Torvalds"},
        headers=owner_headers,
    ).json()

    forbidden = client.post(
        f"/api/v1/sessions/{event_session['id']}/speakers/{speaker['id']}",
        json={},
        headers=other_headers,
    )
    assert forbidden.status_code == 403


def test_assign_and_remove_speaker_from_event(client, session: Session):
    headers = _auth_headers(client, "speaker_owner4@example.com", session, organizer=True)

    event = client.post("/api/v1/events", json=_event_payload(), headers=headers).json()
    speaker = client.post(
        "/api/v1/speakers",
        json={"full_name": "Margaret Hamilton", "email": "margaret@example.com"},
        headers=headers,
    ).json()

    assigned = client.post(
        f"/api/v1/events/{event['id']}/speakers/{speaker['id']}",
        json={"role_in_event": "Mentora principal"},
        headers=headers,
    )
    assert assigned.status_code == 201
    assert assigned.json()["speaker"]["full_name"] == "Margaret Hamilton"
    assert assigned.json()["role_in_event"] == "Mentora principal"

    listing = client.get(f"/api/v1/events/{event['id']}/speakers")
    assert listing.status_code == 200
    assert len(listing.json()) == 1

    removed = client.delete(
        f"/api/v1/events/{event['id']}/speakers/{speaker['id']}",
        headers=headers,
    )
    assert removed.status_code == 204


def test_forbidden_assign_event_speaker_by_non_owner(client, session: Session):
    owner_headers = _auth_headers(client, "speaker_owner5@example.com", session, organizer=True)
    other_headers = _auth_headers(client, "speaker_other5@example.com", session, organizer=True)

    event = client.post("/api/v1/events", json=_event_payload(), headers=owner_headers).json()
    speaker = client.post(
        "/api/v1/speakers",
        json={"full_name": "Donald Knuth"},
        headers=owner_headers,
    ).json()

    forbidden = client.post(
        f"/api/v1/events/{event['id']}/speakers/{speaker['id']}",
        json={},
        headers=other_headers,
    )
    assert forbidden.status_code == 403
