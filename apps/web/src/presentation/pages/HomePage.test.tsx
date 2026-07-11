import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { HomePage } from "./HomePage";

function renderHome() {
  return render(
    <MemoryRouter initialEntries={["/home"]}>
      <Routes>
        <Route path="/home" element={<HomePage />} />
        <Route path="/assessment" element={<div>Assessment select screen</div>} />
        <Route path="/chat" element={<div>Chat screen</div>} />
        <Route path="/peers" element={<div>Peers screen</div>} />
        <Route path="/manager" element={<div>Manager screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("HomePage", () => {
  it("renders the greeting, privacy badge, and hero check-in CTA", () => {
    renderHome();
    expect(screen.getByText("Olá.")).toBeInTheDocument();
    expect(screen.getByText("anônimo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fazer check-in" })).toBeInTheDocument();
  });

  it("renders the history chart with exactly one warn peak and one brand latest bar", () => {
    renderHome();
    const bars = screen.getAllByTestId("history-bar");
    expect(bars).toHaveLength(6);
    expect(bars.filter((bar) => bar.className.includes("bg-warn"))).toHaveLength(1);
    expect(bars.filter((bar) => bar.className.includes("bg-brand"))).toHaveLength(1);
  });

  it("navigates to /assessment when the hero CTA is tapped", async () => {
    renderHome();
    await userEvent.click(screen.getByRole("button", { name: "Fazer check-in" }));
    expect(screen.getByText("Assessment select screen")).toBeInTheDocument();
  });

  it("navigates to chat from the quick action card", async () => {
    renderHome();
    await userEvent.click(screen.getByRole("button", { name: /conversar agora/i }));
    expect(screen.getByText("Chat screen")).toBeInTheDocument();
  });

  it("shows Início as the active BottomNav tab", () => {
    renderHome();
    expect(screen.getByRole("button", { name: "Início" })).toHaveAttribute("aria-current", "page");
  });
});
