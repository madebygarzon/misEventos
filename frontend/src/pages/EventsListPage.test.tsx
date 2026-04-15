import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EventsListPage } from "./EventsListPage";

describe("EventsListPage", () => {
  it("renders title", () => {
    render(<EventsListPage />);
    expect(screen.getByText("Eventos")).toBeInTheDocument();
  });
});
