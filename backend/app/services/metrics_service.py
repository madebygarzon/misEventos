from collections import Counter
from datetime import datetime, timezone
from uuid import UUID

from sqlmodel import Session, select

from app.models.event import Event
from app.models.registration import Registration
from app.models.session import EventSession
from app.models.session_speaker import SessionSpeaker
from app.models.speaker import Speaker
from app.models.user import User
from app.schemas.metrics import (
    EventOccupancy,
    MetricsFilters,
    MetricsOrganizerOption,
    MetricsSummaryResponse,
    MetricsTotals,
    MonthTotal,
    OrganizerPerformance,
    SessionsPerEvent,
    SpeakerPerformance,
    StatusTotal,
)

EVENT_STATUS_ORDER = ["draft", "published", "cancelled", "finished"]
SESSION_STATUS_ORDER = ["scheduled", "in_progress", "finished", "cancelled"]
REGISTRATION_STATUS_ORDER = ["registered", "cancelled", "waitlist"]


def _round2(value: float) -> float:
    return round(value, 2)


def _to_utc_aware(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _month_key(date_value: datetime) -> str:
    return f"{date_value.year}-{date_value.month:02d}"


class MetricsService:
    def __init__(self, session: Session):
        self.session = session

    def _filter_events(
        self,
        events: list[Event],
        start_date: datetime | None,
        end_date: datetime | None,
        event_status: str | None,
        organizer_id: UUID | None,
    ) -> list[Event]:
        filtered = events
        normalized_start = _to_utc_aware(start_date) if start_date else None
        normalized_end = _to_utc_aware(end_date) if end_date else None
        if event_status:
            filtered = [event for event in filtered if event.status == event_status]
        if organizer_id:
            filtered = [event for event in filtered if event.organizer_id == organizer_id]
        if normalized_start:
            filtered = [
                event for event in filtered if _to_utc_aware(event.start_date) >= normalized_start
            ]
        if normalized_end:
            filtered = [
                event for event in filtered if _to_utc_aware(event.start_date) <= normalized_end
            ]
        return filtered

    def summary(
        self,
        start_date: datetime | None,
        end_date: datetime | None,
        event_status: str | None,
        organizer_id: UUID | None,
    ) -> MetricsSummaryResponse:
        all_events = list(self.session.exec(select(Event)).all())
        filtered_events = self._filter_events(
            all_events,
            start_date=start_date,
            end_date=end_date,
            event_status=event_status,
            organizer_id=organizer_id,
        )

        event_ids = {event.id for event in filtered_events}
        all_users = list(self.session.exec(select(User)).all())
        user_name_map = {user.id: user.full_name for user in all_users}
        organizers = sorted(
            [
                MetricsOrganizerOption(
                    id=str(user.id),
                    name=user.full_name,
                )
                for user in all_users
            ],
            key=lambda item: item.name.lower(),
        )

        if event_ids:
            sessions = list(
                self.session.exec(select(EventSession).where(EventSession.event_id.in_(event_ids))).all()
            )
            registrations = list(
                self.session.exec(select(Registration).where(Registration.event_id.in_(event_ids))).all()
            )
        else:
            sessions = []
            registrations = []

        session_ids = {session_item.id for session_item in sessions}
        if session_ids:
            session_speakers = list(
                self.session.exec(select(SessionSpeaker).where(SessionSpeaker.session_id.in_(session_ids))).all()
            )
        else:
            session_speakers = []

        speaker_ids = {item.speaker_id for item in session_speakers}
        if speaker_ids:
            speakers = list(self.session.exec(select(Speaker).where(Speaker.id.in_(speaker_ids))).all())
        else:
            speakers = []
        speaker_name_map = {speaker.id: speaker.full_name for speaker in speakers}

        now = datetime.now(timezone.utc)
        total_capacity = sum(event.capacity for event in filtered_events)
        registered_count = sum(1 for item in registrations if item.status == "registered")
        cancelled_count = sum(1 for item in registrations if item.status == "cancelled")
        base_for_cancel = registered_count + cancelled_count
        published_events = sum(1 for event in filtered_events if event.status == "published")
        upcoming_events = sum(1 for event in filtered_events if _to_utc_aware(event.start_date) >= now)

        totals = MetricsTotals(
            events=len(filtered_events),
            sessions=len(sessions),
            speaker_assignments=len(session_speakers),
            total_capacity=total_capacity,
            registered_attendees=registered_count,
            cancelled_registrations=cancelled_count,
            occupancy_rate=_round2((registered_count / total_capacity) * 100) if total_capacity else 0,
            cancellation_rate=_round2((cancelled_count / base_for_cancel) * 100) if base_for_cancel else 0,
            published_rate=_round2((published_events / len(filtered_events)) * 100) if filtered_events else 0,
            upcoming_events=upcoming_events,
        )

        event_status_counter = Counter(event.status for event in filtered_events)
        events_by_status = [
            StatusTotal(status=status_key, total=event_status_counter.get(status_key, 0))
            for status_key in EVENT_STATUS_ORDER
        ]

        session_status_counter = Counter(item.status for item in sessions)
        sessions_by_status = [
            StatusTotal(status=status_key, total=session_status_counter.get(status_key, 0))
            for status_key in SESSION_STATUS_ORDER
        ]

        registration_status_counter = Counter(item.status for item in registrations)
        registrations_by_status = [
            StatusTotal(status=status_key, total=registration_status_counter.get(status_key, 0))
            for status_key in REGISTRATION_STATUS_ORDER
        ]

        events_month_counter = Counter(_month_key(event.created_at) for event in filtered_events)
        events_by_month = [
            MonthTotal(month=month, total=total)
            for month, total in sorted(events_month_counter.items(), key=lambda item: item[0])[-12:]
        ]

        registrations_month_counter = Counter(_month_key(item.registered_at) for item in registrations)
        registrations_by_month = [
            MonthTotal(month=month, total=total)
            for month, total in sorted(registrations_month_counter.items(), key=lambda item: item[0])[-12:]
        ]

        registrations_by_event: dict[UUID, list[Registration]] = {}
        for row in registrations:
            registrations_by_event.setdefault(row.event_id, []).append(row)

        sessions_by_event: dict[UUID, list[EventSession]] = {}
        for row in sessions:
            sessions_by_event.setdefault(row.event_id, []).append(row)

        organizer_stats: dict[UUID, dict[str, int]] = {}
        for event in filtered_events:
            stats = organizer_stats.setdefault(
                event.organizer_id,
                {"events": 0, "registered": 0, "total_capacity": 0},
            )
            stats["events"] += 1
            stats["total_capacity"] += event.capacity
            stats["registered"] += sum(
                1 for item in registrations_by_event.get(event.id, []) if item.status == "registered"
            )

        top_organizers = [
            OrganizerPerformance(
                id=str(organizer_id_key),
                name=user_name_map.get(organizer_id_key, f"Usuario {str(organizer_id_key)[:8]}"),
                events=data["events"],
                registered=data["registered"],
                total_capacity=data["total_capacity"],
                occupancy_rate=_round2((data["registered"] / data["total_capacity"]) * 100)
                if data["total_capacity"]
                else 0,
            )
            for organizer_id_key, data in organizer_stats.items()
        ]
        top_organizers.sort(key=lambda item: (item.events, item.registered), reverse=True)
        top_organizers = top_organizers[:8]

        speaker_session_counter = Counter(item.speaker_id for item in session_speakers)
        top_speakers = [
            SpeakerPerformance(
                id=str(speaker_id),
                name=speaker_name_map.get(speaker_id, f"Ponente {str(speaker_id)[:8]}"),
                sessions=total,
            )
            for speaker_id, total in speaker_session_counter.items()
        ]
        top_speakers.sort(key=lambda item: item.sessions, reverse=True)
        top_speakers = top_speakers[:10]

        event_occupancy = []
        for event in filtered_events:
            event_registrations = registrations_by_event.get(event.id, [])
            event_registered = sum(1 for item in event_registrations if item.status == "registered")
            event_cancelled = sum(1 for item in event_registrations if item.status == "cancelled")
            event_occupancy.append(
                EventOccupancy(
                    event_id=str(event.id),
                    event_name=event.name,
                    organizer_name=user_name_map.get(event.organizer_id, "No disponible"),
                    capacity=event.capacity,
                    registered=event_registered,
                    cancelled=event_cancelled,
                    occupancy_rate=_round2((event_registered / event.capacity) * 100) if event.capacity else 0,
                )
            )
        event_occupancy.sort(key=lambda item: (item.occupancy_rate, item.registered), reverse=True)
        event_occupancy = event_occupancy[:12]

        sessions_per_event = []
        for event in filtered_events:
            sessions_per_event.append(
                SessionsPerEvent(
                    event_id=str(event.id),
                    event_name=event.name,
                    sessions=len(sessions_by_event.get(event.id, [])),
                )
            )
        sessions_per_event.sort(key=lambda item: item.sessions, reverse=True)
        sessions_per_event = sessions_per_event[:12]

        return MetricsSummaryResponse(
            filters=MetricsFilters(
                start_date=start_date,
                end_date=end_date,
                event_status=event_status,
                organizer_id=str(organizer_id) if organizer_id else None,
            ),
            organizers=organizers,
            totals=totals,
            events_by_status=events_by_status,
            sessions_by_status=sessions_by_status,
            registrations_by_status=registrations_by_status,
            events_by_month=events_by_month,
            registrations_by_month=registrations_by_month,
            top_organizers=top_organizers,
            top_speakers=top_speakers,
            event_occupancy=event_occupancy,
            sessions_per_event=sessions_per_event,
        )
