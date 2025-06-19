import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UserEvent } from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

jest.mock("../services/weatherService", () => ({
  fetchSuggestions: jest
    .fn()
    .mockResolvedValue([
      { id: "1", name: "Rome, Italy", lat: 41.9, lon: 12.5 },
    ]),

  fetchForecast: jest.fn().mockResolvedValue({
    locationName: "Rome",
    current: { temp: 25, humidity: 40, wind_speed: 3 },
    /* 7 fake days */
    daily: Array.from({ length: 7 }, (_, i) => ({
      dt: 1_700_000_000 + i * 86_400,
      temp: { max: 30 - i, min: 20 - i },
      weather: [{ description: "clear sky", icon: "clear_day" }],
    })),
    alerts: Array.from({ length: 5 }, (_, i) => ({
      id: `a${i}`,
      title: `Alert #${i}`,
      message: `Message ${i}`,
    })),
  }),

  fetchUserHistory: jest.fn().mockResolvedValue([]),
  saveSearch: jest.fn(),
}));

import MainPage from "../components/MainPage";

const user = { id: "u1", name: "Test User", email: "test@example.com" };
const renderWithRouter = () =>
  render(
    <MemoryRouter initialEntries={[{ pathname: "/", state: { user } }]}>
      <Routes>
        <Route path="/" element={<MainPage />} />
      </Routes>
    </MemoryRouter>
  );

describe("MainPage UI flow", () => {
  let userInstance: UserEvent;

  beforeEach(() => {
    userInstance = userEvent.setup();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any pending timers or promises
    jest.clearAllTimers();
  });

  it("renders search bar & Go button", async () => {
    await act(async () => {
      renderWithRouter();
    });

    expect(screen.getByPlaceholderText(/search city/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /go/i })).toBeInTheDocument();
  });

  it("shows suggestions dropdown and lets user pick a city", async () => {
    await act(async () => {
      renderWithRouter();
    });

    const searchInput = screen.getByPlaceholderText(/search city/i);
    await userInstance.type(searchInput, "Ro");

    const suggestion = await screen.findByText("Rome, Italy");
    await userInstance.click(suggestion);

    await waitFor(() => {
      expect(
        (screen.getByPlaceholderText(/search city/i) as HTMLInputElement).value
      ).toBe("Rome, Italy");
    });
  });

  it("fetches forecast and displays today ribbon & 7 cards", async () => {
    await act(async () => {
      renderWithRouter();
    });

    const searchInput = screen.getByPlaceholderText(/search city/i);
    await userInstance.type(searchInput, "Ro");

    const suggestion = await screen.findByText("Rome, Italy");
    await userInstance.click(suggestion);

    const goButton = screen.getByRole("button", { name: /go/i });
    await userInstance.click(goButton);

    await waitFor(() => {
      expect(screen.getByText(/today/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/25°C/)).toBeInTheDocument();
    });

    await waitFor(() => {
      const tempLines = screen.getAllByText(/°\s*\/\s*\d+°/);
      expect(tempLines).toHaveLength(7);
    });
  });

  it("shows 3 alerts max by default and toggles 'Show all'", async () => {
    await act(async () => {
      renderWithRouter();
    });

    const searchInput = screen.getByPlaceholderText(/search city/i);
    await userInstance.type(searchInput, "Ro");

    const suggestion = await screen.findByText("Rome, Italy");
    await userInstance.click(suggestion);

    const goButton = screen.getByRole("button", { name: /go/i });
    await userInstance.click(goButton);

    // Wait for alerts section to appear
    await waitFor(() => {
      expect(screen.getByText(/upcoming alerts/i)).toBeInTheDocument();
    });

    // Check initial state
    await waitFor(() => {
      const listItems = screen.getAllByRole("listitem");
      expect(listItems).toHaveLength(3);
    });

    const showAllButton = await screen.findByRole("button", {
      name: /show all/i,
    });
    await userInstance.click(showAllButton);

    await waitFor(() => {
      const listItems = screen.getAllByRole("listitem");
      expect(listItems).toHaveLength(5);
    });

    const hideButton = await screen.findByRole("button", {
      name: /hide extra alerts/i,
    });
    await userInstance.click(hideButton);

    await waitFor(() => {
      const listItems = screen.getAllByRole("listitem");
      expect(listItems).toHaveLength(3);
    });
  });
});
