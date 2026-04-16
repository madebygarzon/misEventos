import { api } from "./client";
import type { SessionCreatePayload, SessionItem, SessionUpdatePayload } from "../types/session";

export const listSessionsByEventRequest = async (eventId: string): Promise<SessionItem[]> => {
  const { data } = await api.get<SessionItem[]>(`/events/${eventId}/sessions`);
  return data;
};

export const createSessionRequest = async (
  eventId: string,
  payload: SessionCreatePayload
): Promise<SessionItem> => {
  const { data } = await api.post<SessionItem>(`/events/${eventId}/sessions`, payload);
  return data;
};

export const updateSessionRequest = async (
  sessionId: string,
  payload: SessionUpdatePayload
): Promise<SessionItem> => {
  const { data } = await api.put<SessionItem>(`/sessions/${sessionId}`, payload);
  return data;
};

export const deleteSessionRequest = async (sessionId: string): Promise<void> => {
  await api.delete(`/sessions/${sessionId}`);
};
