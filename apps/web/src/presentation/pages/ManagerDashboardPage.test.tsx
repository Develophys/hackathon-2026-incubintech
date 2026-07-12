import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ManagerDashboardPage } from "./ManagerDashboardPage";
import { useManagerSessionStore } from "../../stores/manager-session.store";
import * as container from "../../app/container";
import { UnauthorizedManagerError } from "../../ports/manager-signals.port";

function renderManager() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/manager"]}>
        <Routes>
          <Route path="/manager" element={<ManagerDashboardPage />} />
          <Route path="/manager/login" element={<div>Login screen</div>} />
          <Route path="/home" element={<div>Home screen</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const SIGNALS_RESPONSE = {
  overallConcerningRate: 0.41,
  checkInsLast4Weeks: 111,
  weeklyTrend: [
    { weekStart: "2026-06-01T00:00:00.000Z", concerningRate: 0.3 },
    { weekStart: "2026-06-08T00:00:00.000Z", concerningRate: 0.5 },
  ],
  segments: [
    { label: "Plantão noturno", value: 52, n: 18 },
    { label: "Pronto-socorro", value: 38, n: 24 },
    { label: "UTI", value: 44, n: 9 },
  ],
};

describe("ManagerDashboardPage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    useManagerSessionStore.setState({ token: "abc.def", expiresAt: new Date(Date.now() + 60_000).toISOString() });
  });

  it("renders segments and trend bars from the real signals response, suppressing n<5 departments", async () => {
    vi.spyOn(container.getManagerSignalsUseCase, "execute").mockResolvedValue(SIGNALS_RESPONSE);
    renderManager();

    await waitFor(() => {
      expect(screen.getByText("Plantão noturno")).toBeInTheDocument();
    });
    expect(screen.getByText("Pronto-socorro")).toBeInTheDocument();
    expect(screen.getByText("UTI")).toBeInTheDocument();
    expect(screen.queryByText("Ambulatório")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("trend-bar")).toHaveLength(2);
    expect(screen.getByText("41%")).toBeInTheDocument();
    expect(screen.getByText("111")).toBeInTheDocument();
  });

  it("navigates to /home on back", async () => {
    vi.spyOn(container.getManagerSignalsUseCase, "execute").mockResolvedValue(SIGNALS_RESPONSE);
    const user = userEvent.setup();
    renderManager();

    await user.click(screen.getByRole("button", { name: "Sair da demo" }));
    expect(screen.getByText("Home screen")).toBeInTheDocument();
  });

  it("clears the session and redirects to login on a 401", async () => {
    vi.spyOn(container.getManagerSignalsUseCase, "execute").mockRejectedValue(new UnauthorizedManagerError());
    renderManager();

    await waitFor(() => {
      expect(screen.getByText("Login screen")).toBeInTheDocument();
    });
    expect(useManagerSessionStore.getState().token).toBeNull();
  });
});
