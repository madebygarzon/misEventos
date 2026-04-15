from datetime import datetime, timedelta, timezone



def _auth_headers(client, email: str) -> dict[str, str]:
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



def test_create_and_get_event(client):
    headers = _auth_headers(client, "owner1@example.com")

    created = client.post("/api/v1/events", json=_event_payload("TechConf"), headers=headers)
    assert created.status_code == 201
    event_id = created.json()["id"]

    fetched = client.get(f"/api/v1/events/{event_id}")
    assert fetched.status_code == 200
    assert fetched.json()["name"] == "TechConf"



def test_list_search_and_pagination(client):
    headers = _auth_headers(client, "owner2@example.com")

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



def test_update_and_delete_event_owner(client):
    headers = _auth_headers(client, "owner3@example.com")

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



def test_forbidden_update_by_non_owner(client):
    owner_headers = _auth_headers(client, "owner4@example.com")
    other_headers = _auth_headers(client, "other4@example.com")

    created = client.post("/api/v1/events", json=_event_payload("Private Event"), headers=owner_headers)
    event_id = created.json()["id"]

    forbidden = client.put(
        f"/api/v1/events/{event_id}",
        json={"name": "Hacked"},
        headers=other_headers,
    )
    assert forbidden.status_code == 403
