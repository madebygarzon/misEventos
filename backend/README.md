# Mis Eventos - Backend

API del MVP para gestión de eventos, sesiones, ponentes, inscripciones y roles.

## Requisitos

- Python 3.12
- Poetry
- PostgreSQL 16+ (si corres sin Docker)

## Variables de entorno

```bash
cp .env.example .env
```

Variables principales:

- `APP_NAME`
- `API_V1_PREFIX`
- `SECRET_KEY`
- `ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `DATABASE_URL`
- `BACKEND_CORS_ORIGINS`
- `REDIS_URL`
- `CACHE_TTL_SECONDS`
- `ADMIN_EMAIL`

Los valores reales de estas variables están documentados en:

- `docs/structured_project.md`

## Ejecutar local

```bash
poetry install
poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API: `http://localhost:8000`  
Swagger: `http://localhost:8000/docs`

## Ejecutar con Docker Compose

Desde la raíz del proyecto:

```bash
docker compose up --build
docker compose exec backend alembic upgrade head
```

## Comandos útiles

```bash
# Tests
poetry run pytest

# Lint
poetry run ruff check .

# Crear migración
poetry run alembic revision --autogenerate -m "mensaje"

# Estado de migraciones
poetry run alembic current
```
