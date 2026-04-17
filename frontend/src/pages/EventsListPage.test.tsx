import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { EventsListPage } from "./EventsListPage";

describe("EventsListPage", () => {
  it("renders title", () => {
    render(
      <MemoryRouter>
        <EventsListPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Bienvenido/i)).toBeInTheDocument();
  });
});
