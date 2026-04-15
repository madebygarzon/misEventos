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
