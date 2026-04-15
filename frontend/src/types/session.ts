export type SessionItem = {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  capacity: number;
  status: "scheduled" | "in_progress" | "finished" | "cancelled";
  created_at: string;
  updated_at: string;
};
