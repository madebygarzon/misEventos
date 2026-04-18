from datetime import datetime

from pydantic import BaseModel


class MetricsOrganizerOption(BaseModel):
    id: str
    name: str


class MetricsTotals(BaseModel):
    events: int
    sessions: int
    speaker_assignments: int
    total_capacity: int
    registered_attendees: int
    cancelled_registrations: int
    occupancy_rate: float
    cancellation_rate: float
    published_rate: float
    upcoming_events: int


class StatusTotal(BaseModel):
    status: str
    total: int


class MonthTotal(BaseModel):
    month: str
    total: int


class OrganizerPerformance(BaseModel):
    id: str
    name: str
    events: int
    registered: int
    total_capacity: int
    occupancy_rate: float


class SpeakerPerformance(BaseModel):
    id: str
    name: str
    sessions: int


class EventOccupancy(BaseModel):
    event_id: str
    event_name: str
    organizer_name: str
    capacity: int
    registered: int
    cancelled: int
    occupancy_rate: float


class SessionsPerEvent(BaseModel):
    event_id: str
    event_name: str
    sessions: int


class MetricsFilters(BaseModel):
    start_date: datetime | None = None
    end_date: datetime | None = None
    event_status: str | None = None
    organizer_id: str | None = None


class MetricsSummaryResponse(BaseModel):
    filters: MetricsFilters
    organizers: list[MetricsOrganizerOption]
    totals: MetricsTotals
    events_by_status: list[StatusTotal]
    sessions_by_status: list[StatusTotal]
    registrations_by_status: list[StatusTotal]
    events_by_month: list[MonthTotal]
    registrations_by_month: list[MonthTotal]
    top_organizers: list[OrganizerPerformance]
    top_speakers: list[SpeakerPerformance]
    event_occupancy: list[EventOccupancy]
    sessions_per_event: list[SessionsPerEvent]
