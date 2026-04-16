from fastapi import APIRouter

from app.api.v1 import auth, events, registrations, sessions, speakers, uploads, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(events.router)
api_router.include_router(uploads.router)
api_router.include_router(sessions.router)
api_router.include_router(speakers.router)
api_router.include_router(registrations.router)
