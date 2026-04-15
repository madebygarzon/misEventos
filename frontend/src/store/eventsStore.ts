import { create } from "zustand";

import {
  createEventRequest,
  deleteEventRequest,
  getEventRequest,
  listEventsRequest,
  updateEventRequest
} from "../api/events";
import type { EventItem } from "../types/event";
import { getErrorMessage } from "../utils/errors";

type EventsState = {
  events: EventItem[];
  currentEvent: EventItem | null;
  total: number;
  page: number;
  limit: number;
  pages: number;
  loading: boolean;
  error: string | null;
  fetchEvents: (params?: { search?: string; page?: number; limit?: number; status?: string }) => Promise<void>;
  fetchEventById: (id: string) => Promise<void>;
  createEvent: (payload: any) => Promise<EventItem | null>;
  updateEvent: (id: string, payload: any) => Promise<EventItem | null>;
  deleteEvent: (id: string) => Promise<boolean>;
};

export const useEventsStore = create<EventsState>((set, get) => ({
  events: [],
  currentEvent: null,
  total: 0,
  page: 1,
  limit: 10,
  pages: 1,
  loading: false,
  error: null,

  fetchEvents: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const data = await listEventsRequest(params);
      set({
        events: data.items,
        total: data.total,
        page: data.page,
        limit: data.limit,
        pages: data.pages,
        loading: false
      });
    } catch (error: any) {
      set({ error: getErrorMessage(error, "No fue posible cargar eventos"), loading: false });
    }
  },

  fetchEventById: async (id) => {
    set({ loading: true, error: null });
    try {
      const item = await getEventRequest(id);
      set({ currentEvent: item, loading: false });
    } catch (error: any) {
      set({ error: getErrorMessage(error, "Evento no encontrado"), loading: false });
    }
  },

  createEvent: async (payload) => {
    set({ loading: true, error: null });
    try {
      const created = await createEventRequest(payload);
      await get().fetchEvents({ page: 1, limit: get().limit });
      set({ loading: false });
      return created;
    } catch (error: any) {
      set({ error: getErrorMessage(error, "No fue posible crear evento"), loading: false });
      return null;
    }
  },

  updateEvent: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      const updated = await updateEventRequest(id, payload);
      await get().fetchEvents({ page: get().page, limit: get().limit });
      set({ currentEvent: updated, loading: false });
      return updated;
    } catch (error: any) {
      set({ error: getErrorMessage(error, "No fue posible actualizar evento"), loading: false });
      return null;
    }
  },

  deleteEvent: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteEventRequest(id);
      await get().fetchEvents({ page: get().page, limit: get().limit });
      set({ loading: false });
      return true;
    } catch (error: any) {
      set({ error: getErrorMessage(error, "No fue posible eliminar evento"), loading: false });
      return false;
    }
  }
}));
