import { api } from "./client";
import type { MyRegistrationsResponse, RegistrationItem } from "../types/registration";

export const registerToEventRequest = async (
  eventId: string,
  payload?: { notes?: string }
): Promise<RegistrationItem> => {
  const { data } = await api.post<RegistrationItem>(`/events/${eventId}/register`, payload || {});
  return data;
};

export const cancelRegistrationRequest = async (eventId: string): Promise<void> => {
  await api.delete(`/events/${eventId}/register`);
};

export const myRegistrationsRequest = async (): Promise<MyRegistrationsResponse> => {
  const { data } = await api.get<MyRegistrationsResponse>("/users/me/registrations");
  return data;
};
