# Mis Eventos (MVP)

Aplicación Full Stack para gestión de eventos con:
- Backend: FastAPI + SQLModel + PostgreSQL + Alembic + pytest
- Frontend: React + Vite + Router + Zustand + Axios + Vitest
- Infra: Docker + Docker Compose

## 1) Requisitos previos

### Opción recomendada (Docker)
- Docker Desktop instalado y ejecutándose
- Docker Compose v2 (incluido en Docker Desktop)

### Opción local (sin Docker)
- Python 3.12
- Poetry
- Node.js 20+
- npm
- PostgreSQL 16+

---
## 2) Clonar/abrir proyecto

```bash
cd /Users/carlosgarzon/Desktop/DesktopBK/ByGarzon/pruebasTecnicas/tusdatos/misEventos
```

---
## 3) Variables de entorno

En este repo ya existen ejemplos.

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

---
## 4) Levantar proyecto con Docker (recomendado)

### 4.1 Iniciar Docker Desktop

En macOS:

```bash
open -a Docker
```

Validar daemon:

```bash
docker info
```

### 4.2 Levantar servicios

```bash
docker compose up --build
```

Servicios esperados:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Swagger: http://localhost:8000/docs

Nota:
- En el primer arranque, el contenedor `frontend` ejecuta `npm install`; puede tardar un poco.
- PostgreSQL **no** está expuesto al host por defecto (solo accesible dentro de la red de Docker).

### 4.3 Ejecutar migraciones

```bash
docker compose exec backend alembic upgrade head
docker compose exec backend alembic current
```

### 4.4 Ejecutar tests

Backend:

```bash
docker compose exec backend python -m pytest -q
```

Frontend:

```bash
docker compose exec frontend npm run test
```

---
## 5) Correr sin Docker (local)

## 5.1 Backend

```bash
cd backend
poetry install
poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 5.2 Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

## 5.3 URLs

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Swagger: http://localhost:8000/docs

---
## 6) Uso rápido del MVP

1. Abrir Swagger en http://localhost:8000/docs
2. Crear usuario en `POST /api/v1/auth/register`
3. Login en `POST /api/v1/auth/login`
4. Usar token para endpoints protegidos (botón **Authorize** en Swagger)
5. Crear evento en `POST /api/v1/events`
6. Crear sesiones en `POST /api/v1/events/{event_id}/sessions`
7. Registrar usuario en evento con `POST /api/v1/events/{event_id}/register`
8. Consultar inscripciones en `GET /api/v1/users/me/registrations`

Desde UI (http://localhost:5173):
- Registro/Login
- Listado de eventos
- Crear/editar eventos
- Ver detalle + sesiones
- Inscribirse/cancelar inscripción
- Ver perfil con inscripciones

---
## 7) Estructura del proyecto

```txt
misEventos/
├── backend/
│   ├── app/
│   │   ├── api/v1/
│   │   ├── core/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── tests/
│   ├── alembic/
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── docs/
├── docker-compose.yml
└── README.md
```

---
## 8) Comandos útiles

Detener servicios:

```bash
docker compose down
```

Detener y limpiar volúmenes de DB:

```bash
docker compose down -v
```

Rebuild completo:

```bash
docker compose up --build --force-recreate
```

Rebuild solo backend (cuando cambias `backend/pyproject.toml` o dependencias):

```bash
docker compose build --no-cache backend
docker compose up
```

Ver logs backend:

```bash
docker compose logs -f backend
```

Ver logs frontend:

```bash
docker compose logs -f frontend
```

---
## 9) Solución de problemas

### Error: `Cannot connect to the Docker daemon`
- Abre Docker Desktop
- Espera a que diga *Engine running*
- Reintenta `docker info` y luego `docker compose up --build`

### Puerto ocupado (5173/8000)
- Cierra procesos que usen esos puertos
- O ajusta puertos en `docker-compose.yml`

### Migraciones no aplicadas
- Ejecuta:

```bash
docker compose exec backend alembic upgrade head
```

Si aparece `relation "users" does not exist`, confirma también:

```bash
docker compose exec backend alembic current
docker compose exec db psql -U postgres -d mis_eventos -c "\dt"
```

### Error de `bcrypt` al registrar usuario
- Si cambiaste dependencias de backend, reconstruye la imagen:

```bash
docker compose down
docker compose build --no-cache backend
docker compose up
```

---
## 10) Estado actual del MVP

Implementado:
- Auth (`register/login/me`)
- Events (CRUD + search + paginación)
- Sessions (CRUD + validaciones de rango/ownership)
- Registrations (register/cancel/my registrations + capacidad + no duplicados)
- Frontend funcional MVP
- Tests base backend/frontend
