import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { EventDetailPage } from "./EventDetailPage";

vi.mock("../api/sessions", () => ({
  listSessionsByEventRequest: vi.fn().mockResolvedValue([])
}));

vi.mock("../api/registrations", () => ({
  myRegistrationsRequest: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  registerToEventRequest: vi.fn(),
  cancelRegistrationRequest: vi.fn()
}));

vi.mock("../store/eventsStore", () => ({
  useEventsStore: () => ({
    currentEvent: {
      id: "1",
      organizer_id: "1",
      name: "Evento Test",
      description: "Desc",
      location: "Bogota",
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 3600000).toISOString(),
      capacity: 10,
      status: "draft",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    loading: false,
    error: null,
    fetchEventById: vi.fn(),
    deleteEvent: vi.fn().mockResolvedValue(false)
  })
}));

vi.mock("../store/authStore", () => ({
  useAuthStore: () => ({ isAuthenticated: false })
}));

describe("EventDetailPage", () => {
  it("renders event title", async () => {
    render(
      <MemoryRouter initialEntries={["/events/1"]}>
        <Routes>
          <Route path="/events/:id" element={<EventDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Evento Test")).toBeInTheDocument();
  });
});
