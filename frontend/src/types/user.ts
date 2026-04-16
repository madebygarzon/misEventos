export type ManagedUser = {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  roles: string[];
};

export type UsersListResponse = {
  items: ManagedUser[];
  total: number;
};

export type ManagedRole = "attendee" | "organizer" | "admin";
