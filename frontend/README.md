# Mis Eventos - Frontend

Cliente web del MVP para autenticación, gestión de eventos/sesiones y perfil de usuario.

## Requisitos

- Node.js 20+
- npm

## Variables de entorno

```bash
cp .env.example .env
```

Variable principal:

- `VITE_API_BASE_URL` (por defecto: `http://localhost:8000/api/v1`)

## Ejecutar local

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173`

## Ejecutar con Docker Compose

Desde la raíz del proyecto:

```bash
docker compose up --build
```

## Comandos útiles

```bash
# Build producción
npm run build

# Preview build
npm run preview

# Tests
npm run test

# Lint
npm run lint
```
