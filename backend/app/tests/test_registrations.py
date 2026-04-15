from datetime import datetime, timedelta, timezone



def _auth_headers(client, email: str) -> dict[str, str]:
    register_payload = {
        "email": email,
        "password": "password123",
        "full_name": "Registration User",
    }
    client.post("/api/v1/auth/register", json=register_payload)
    login = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "password123"},
    )
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}



def _event_payload(name: str = "Registration Event", capacity: int = 2) -> dict:
    start = datetime.now(timezone.utc) + timedelta(days=1)
    end = start + timedelta(hours=4)
    return {
        "name": name,
        "description": "Event for registrations",
        "location": "Bogota",
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "capacity": capacity,
        "status": "published",
    }



def _create_event(client, owner_headers, capacity: int = 2) -> str:
    response = client.post("/api/v1/events", json=_event_payload(capacity=capacity), headers=owner_headers)
    assert response.status_code == 201
    return response.json()["id"]



def test_register_to_event_and_my_registrations(client):
    owner_headers = _auth_headers(client, "owner_reg_1@example.com")
    attendee_headers = _auth_headers(client, "attendee_reg_1@example.com")
    event_id = _create_event(client, owner_headers)

    created = client.post(
        f"/api/v1/events/{event_id}/register",
        json={"notes": "Primera inscripción"},
        headers=attendee_headers,
    )
    assert created.status_code == 201
    assert created.json()["status"] == "registered"

    mine = client.get("/api/v1/users/me/registrations", headers=attendee_headers)
    assert mine.status_code == 200
    assert mine.json()["total"] == 1
    assert mine.json()["items"][0]["event_id"] == event_id



def test_duplicate_registration_is_blocked(client):
    owner_headers = _auth_headers(client, "owner_reg_2@example.com")
    attendee_headers = _auth_headers(client, "attendee_reg_2@example.com")
    event_id = _create_event(client, owner_headers)

    first = client.post(f"/api/v1/events/{event_id}/register", json={}, headers=attendee_headers)
    second = client.post(f"/api/v1/events/{event_id}/register", json={}, headers=attendee_headers)

    assert first.status_code == 201
    assert second.status_code == 409



def test_registration_fails_when_event_is_full(client):
    owner_headers = _auth_headers(client, "owner_reg_3@example.com")
    attendee_1 = _auth_headers(client, "attendee_reg_3a@example.com")
    attendee_2 = _auth_headers(client, "attendee_reg_3b@example.com")
    event_id = _create_event(client, owner_headers, capacity=1)

    ok = client.post(f"/api/v1/events/{event_id}/register", json={}, headers=attendee_1)
    full = client.post(f"/api/v1/events/{event_id}/register", json={}, headers=attendee_2)

    assert ok.status_code == 201
    assert full.status_code == 409



def test_cancel_and_reregister(client):
    owner_headers = _auth_headers(client, "owner_reg_4@example.com")
    attendee_headers = _auth_headers(client, "attendee_reg_4@example.com")
    event_id = _create_event(client, owner_headers)

    first = client.post(f"/api/v1/events/{event_id}/register", json={}, headers=attendee_headers)
    assert first.status_code == 201

    cancel = client.delete(f"/api/v1/events/{event_id}/register", headers=attendee_headers)
    assert cancel.status_code == 204

    second = client.post(f"/api/v1/events/{event_id}/register", json={}, headers=attendee_headers)
    assert second.status_code == 201
    assert second.json()["status"] == "registered"
