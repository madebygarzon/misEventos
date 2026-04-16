from sqlmodel import Session, select

from app.models.role import Role
from app.models.user import User
from app.models.user_role import UserRole


def test_register_user(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "password123",
            "full_name": "Test User",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"


def test_register_duplicate_email(client):
    payload = {
        "email": "dup@example.com",
        "password": "password123",
        "full_name": "Dup User",
    }

    first = client.post("/api/v1/auth/register", json=payload)
    second = client.post("/api/v1/auth/register", json=payload)

    assert first.status_code == 201
    assert second.status_code == 409


def test_login_and_me(client):
    register_payload = {
        "email": "login@example.com",
        "password": "password123",
        "full_name": "Login User",
    }
    client.post("/api/v1/auth/register", json=register_payload)

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "login@example.com", "password": "password123"},
    )

    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    me_response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "login@example.com"


def test_register_assigns_default_roles(client, session: Session):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "roles_default@example.com",
            "password": "password123",
            "full_name": "Roles Default",
        },
    )
    assert response.status_code == 201

    user = session.exec(select(User).where(User.email == "roles_default@example.com")).first()
    assert user is not None

    rows = session.exec(
        select(Role.name).join(UserRole, UserRole.role_id == Role.id).where(UserRole.user_id == user.id)
    ).all()
    assert set(rows) == {"attendee"}


def test_admin_email_gets_admin_role(client, session: Session):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "madebygarzon@gmail.com",
            "password": "password123",
            "full_name": "Super Admin",
        },
    )
    assert response.status_code == 201

    user = session.exec(select(User).where(User.email == "madebygarzon@gmail.com")).first()
    assert user is not None

    rows = session.exec(
        select(Role.name).join(UserRole, UserRole.role_id == Role.id).where(UserRole.user_id == user.id)
    ).all()
    assert set(rows) == {"admin"}


def test_admin_me_normalizes_to_admin_only(client, session: Session):
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "madebygarzon@gmail.com",
            "password": "password123",
            "full_name": "Admin User",
        },
    )
    assert register_response.status_code == 201

    user = session.exec(select(User).where(User.email == "madebygarzon@gmail.com")).first()
    assert user is not None

    attendee_role = session.exec(select(Role).where(Role.name == "attendee")).first()
    organizer_role = session.exec(select(Role).where(Role.name == "organizer")).first()
    assert attendee_role is not None
    assert organizer_role is not None

    session.add(UserRole(user_id=user.id, role_id=attendee_role.id))
    session.add(UserRole(user_id=user.id, role_id=organizer_role.id))
    session.commit()

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "madebygarzon@gmail.com", "password": "password123"},
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    me_response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    assert set(me_response.json()["roles"]) == {"admin"}

    rows = session.exec(
        select(Role.name).join(UserRole, UserRole.role_id == Role.id).where(UserRole.user_id == user.id)
    ).all()
    assert set(rows) == {"admin"}
