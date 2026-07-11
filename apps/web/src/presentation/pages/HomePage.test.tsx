import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HomePage } from "./HomePage";
import * as container from "../../app/container";

function renderHome() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/home"]}>
        <Routes>
          <Route path="/home" element={<HomePage />} />
          <Route path="/assessment" element={<div>Assessment select screen</div>} />
          <Route path="/chat" element={<div>Chat screen</div>} />
          <Route path="/peers" element={<div>Peers screen</div>} />
          <Route path="/manager" element={<div>Manager screen</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const SIX_NULL_POINTS = Array.from({ length: 6 }, () => ({ weekStart: "", severityFraction: null }));

describe("HomePage", () => {
  it("renders the greeting, privacy badge, and hero check-in CTA", () => {
    vi.spyOn(container.getAssessmentHistoryUseCase, "execute").mockResolvedValue(SIX_NULL_POINTS);
    renderHome();
    expect(screen.getByText("Olá.")).toBeInTheDocument();
    expect(screen.getByText("anônimo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fazer check-in" })).toBeInTheDocument();
  });

  it("renders 6 neutral bars when there is no history yet", async () => {
    vi.spyOn(container.getAssessmentHistoryUseCase, "execute").mockResolvedValue(SIX_NULL_POINTS);
    renderHome();
    const bars = await screen.findAllByTestId("history-bar");
    expect(bars).toHaveLength(6);
    expect(bars.every((bar) => bar.className.includes("bg-line"))).toBe(true);
  });

  it("highlights the latest week and the peak week from real history", async () => {
    vi.spyOn(container.getAssessmentHistoryUseCase, "execute").mockResolvedValue([
      { weekStart: "", severityFraction: null },
      { weekStart: "", severityFraction: 0.2 },
      { weekStart: "", severityFraction: 0.7 }, // peak
      { weekStart: "", severityFraction: null },
      { weekStart: "", severityFraction: 0.3 },
      { weekStart: "", severityFraction: 0.5 }, // latest
    ]);
    renderHome();
    // The 6 history-bar elements exist from the very first render (via the EMPTY_POINTS
    // fallback), so findAllByTestId's existence check alone would race the async query
    // resolution — wait for the resolved (non-neutral) class instead, as HealthBanner.test.tsx
    // does for the same useQuery-resolution race.
    await waitFor(() => {
      expect(screen.getAllByTestId("history-bar").filter((bar) => bar.className.includes("bg-warn"))).toHaveLength(
        1,
      );
    });
    const bars = screen.getAllByTestId("history-bar");
    expect(bars).toHaveLength(6);
    expect(bars.filter((bar) => bar.className.includes("bg-warn"))).toHaveLength(1);
    expect(bars[2]?.className).toContain("bg-warn");
    expect(bars.filter((bar) => bar.className.includes("bg-brand"))).toHaveLength(1);
    expect(bars[5]?.className).toContain("bg-brand");
    expect(bars.filter((bar) => bar.className.includes("bg-line"))).toHaveLength(2);
  });

  it("navigates to /assessment when the hero CTA is tapped", async () => {
    vi.spyOn(container.getAssessmentHistoryUseCase, "execute").mockResolvedValue(SIX_NULL_POINTS);
    renderHome();
    await userEvent.click(screen.getByRole("button", { name: "Fazer check-in" }));
    expect(screen.getByText("Assessment select screen")).toBeInTheDocument();
  });

  it("navigates to chat from the quick action card", async () => {
    vi.spyOn(container.getAssessmentHistoryUseCase, "execute").mockResolvedValue(SIX_NULL_POINTS);
    renderHome();
    await userEvent.click(screen.getByRole("button", { name: /conversar agora/i }));
    expect(screen.getByText("Chat screen")).toBeInTheDocument();
  });

  it("shows Início as the active BottomNav tab", () => {
    vi.spyOn(container.getAssessmentHistoryUseCase, "execute").mockResolvedValue(SIX_NULL_POINTS);
    renderHome();
    expect(screen.getByRole("button", { name: "Início" })).toHaveAttribute("aria-current", "page");
  });
});
