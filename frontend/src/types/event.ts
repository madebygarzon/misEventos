export type EventItem = {
  id: string;
  organizer_id: string;
  name: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string;
  capacity: number;
  status: "draft" | "published" | "cancelled" | "finished";
  created_at: string;
  updated_at: string;
};

export type EventListResponse = {
  items: EventItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};
