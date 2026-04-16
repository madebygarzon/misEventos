export type SpeakerItem = {
  id: string;
  full_name: string;
  email: string | null;
  bio: string | null;
  company: string | null;
  job_title: string | null;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SpeakerCreatePayload = {
  full_name: string;
  email?: string | null;
  bio?: string | null;
  company?: string | null;
  job_title?: string | null;
  photo_url?: string | null;
  is_active?: boolean;
};

export type SessionSpeakerItem = {
  id: string;
  session_id: string;
  speaker_id: string;
  assigned_at: string;
  role_in_session: string | null;
  speaker: SpeakerItem;
};

export type SessionSpeakerAssignPayload = {
  role_in_session?: string | null;
};
