from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.api.deps import get_db_session, require_roles
from app.schemas.metrics import MetricsSummaryResponse
from app.services.metrics_service import MetricsService

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/summary", response_model=MetricsSummaryResponse)
def metrics_summary(
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    event_status: str | None = Query(default=None),
    organizer_id: UUID | None = Query(default=None),
    session: Session = Depends(get_db_session),
    _: set[str] = Depends(require_roles("admin")),
) -> MetricsSummaryResponse:
    service = MetricsService(session)
    return service.summary(
        start_date=start_date,
        end_date=end_date,
        event_status=event_status,
        organizer_id=organizer_id,
    )
