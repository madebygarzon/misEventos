import { api } from "./client";
import type { SessionItem } from "../types/session";

export const listSessionsByEventRequest = async (eventId: string): Promise<SessionItem[]> => {
  const { data } = await api.get<SessionItem[]>(`/events/${eventId}/sessions`);
  return data;
};
