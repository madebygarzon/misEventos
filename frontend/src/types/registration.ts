export type RegistrationItem = {
  id: string;
  user_id: string;
  event_id: string;
  status: "registered" | "cancelled" | "waitlist";
  registered_at: string;
  notes: string | null;
};

export type MyRegistrationsResponse = {
  items: RegistrationItem[];
  total: number;
};

export type EventRegistrationUserItem = {
  user_id: string;
  full_name: string;
  email: string;
  status: "registered" | "cancelled" | "waitlist";
  registered_at: string;
};

export type EventRegistrationsResponse = {
  items: EventRegistrationUserItem[];
  total: number;
};
