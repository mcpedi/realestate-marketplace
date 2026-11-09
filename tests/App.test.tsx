import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { App } from "../client/src/App";
import userEvent from "@testing-library/user-event";

beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/");
});

describe("Nyumba 360 smoke tests", () => {
  it("renders the home page and featured listings", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /featured properties/i })).toBeTruthy();
    expect(screen.getByText("Greenview Family Home")).toBeTruthy();
  });

  it("renders a property detail page", () => {
    window.history.replaceState({}, "", "/property/1");
    render(<App />);
    expect(screen.getByRole("heading", { name: "Greenview Family Home" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /schedule a viewing/i })).toBeTruthy();
  });

  it("filters listings and saves a favorite", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText(/location, property type/i), "Rongo");
    expect(screen.getByText("Rongo Modern Apartment")).toBeTruthy();
    expect(screen.queryByText("Greenview Family Home")).toBeNull();
    await user.click(screen.getByRole("button", { name: /save rongo modern apartment/i }));
    expect(screen.getByRole("button", { name: /remove rongo modern apartment/i })).toBeTruthy();
  });

  it("compares two properties and creates a saved-search alert", async () => {
    const user = userEvent.setup();
    render(<App />);
    const compareButtons = screen.getAllByRole("button", { name: "Compare" });
    await user.click(compareButtons[0]);
    await user.click(compareButtons[1]);
    expect(screen.getByRole("complementary", { name: /property comparison/i })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /save this search/i }));
    await user.type(screen.getByLabelText(/email address/i), "buyer@example.com");
    await user.click(screen.getByRole("button", { name: /create alert/i }));
    expect(screen.getByText(/alert saved/i)).toBeTruthy();
  });

  it("submits a viewing request from the detail page", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/property/1");
    render(<App />);
    await user.click(screen.getByRole("button", { name: /schedule a viewing/i }));
    await user.type(screen.getByLabelText(/your name/i), "Jane Doe");
    await user.type(screen.getByLabelText(/phone or email/i), "jane@example.com");
    await user.click(screen.getByRole("button", { name: /request a viewing/i }));
    expect(screen.getByText(/request received/i)).toBeTruthy();
  });
});
