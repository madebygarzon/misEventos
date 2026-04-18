export type MetricsStatusTotal = {
  status: string;
  total: number;
};

export type MetricsMonthTotal = {
  month: string;
  total: number;
};

export type MetricsOrganizerOption = {
  id: string;
  name: string;
};

export type MetricsTotals = {
  events: number;
  sessions: number;
  speaker_assignments: number;
  total_capacity: number;
  registered_attendees: number;
  cancelled_registrations: number;
  occupancy_rate: number;
  cancellation_rate: number;
  published_rate: number;
  upcoming_events: number;
};

export type MetricsTopOrganizer = {
  id: string;
  name: string;
  events: number;
  registered: number;
  total_capacity: number;
  occupancy_rate: number;
};

export type MetricsTopSpeaker = {
  id: string;
  name: string;
  sessions: number;
};

export type MetricsEventOccupancy = {
  event_id: string;
  event_name: string;
  organizer_name: string;
  capacity: number;
  registered: number;
  cancelled: number;
  occupancy_rate: number;
};

export type MetricsSessionsPerEvent = {
  event_id: string;
  event_name: string;
  sessions: number;
};

export type MetricsSummaryResponse = {
  filters: {
    start_date: string | null;
    end_date: string | null;
    event_status: string | null;
    organizer_id: string | null;
  };
  organizers: MetricsOrganizerOption[];
  totals: MetricsTotals;
  events_by_status: MetricsStatusTotal[];
  sessions_by_status: MetricsStatusTotal[];
  registrations_by_status: MetricsStatusTotal[];
  events_by_month: MetricsMonthTotal[];
  registrations_by_month: MetricsMonthTotal[];
  top_organizers: MetricsTopOrganizer[];
  top_speakers: MetricsTopSpeaker[];
  event_occupancy: MetricsEventOccupancy[];
  sessions_per_event: MetricsSessionsPerEvent[];
};
