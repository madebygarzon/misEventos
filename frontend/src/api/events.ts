import { api } from "./client";
import type { EventItem, EventListResponse } from "../types/event";

export const listEventsRequest = async (params: {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
}): Promise<EventListResponse> => {
  const { data } = await api.get<EventListResponse>("/events", { params });
  return data;
};

export const getEventRequest = async (id: string): Promise<EventItem> => {
  const { data } = await api.get<EventItem>(`/events/${id}`);
  return data;
};

export const createEventRequest = async (payload: {
  name: string;
  description?: string;
  location?: string;
  start_date: string;
  end_date: string;
  capacity: number;
  status: string;
}): Promise<EventItem> => {
  const { data } = await api.post<EventItem>("/events", payload);
  return data;
};

export const updateEventRequest = async (
  id: string,
  payload: Partial<{
    name: string;
    description: string;
    location: string;
    start_date: string;
    end_date: string;
    capacity: number;
    status: string;
  }>
): Promise<EventItem> => {
  const { data } = await api.put<EventItem>(`/events/${id}`, payload);
  return data;
};

export const deleteEventRequest = async (id: string): Promise<void> => {
  await api.delete(`/events/${id}`);
};
