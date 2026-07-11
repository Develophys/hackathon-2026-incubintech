import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { PeersPage } from "./PeersPage";

function renderPeers() {
  return render(
    <MemoryRouter initialEntries={["/peers"]}>
      <Routes>
        <Route path="/peers" element={<PeersPage />} />
        <Route path="/chat" element={<div>Chat screen</div>} />
        <Route path="/home" element={<div>Home screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PeersPage", () => {
  it("renders both placeholder peers with role/status only, no identifying info", () => {
    renderPeers();
    expect(screen.getByText("Colega · Clínica médica")).toBeInTheDocument();
    expect(screen.getByText("plantão noturno · ● disponível")).toBeInTheDocument();
    expect(screen.getByText("Colega · Residência")).toBeInTheDocument();
    expect(screen.getByText("responde em ~1h")).toBeInTheDocument();
  });

  it("shows the mutual-anonymity guarantee", () => {
    renderPeers();
    expect(screen.getByText("conexão sem troca de identidade")).toBeInTheDocument();
  });

  it("routes to /chat as a stand-in when tapping a peer", async () => {
    const user = userEvent.setup();
    renderPeers();
    await user.click(screen.getByRole("button", { name: /Colega · Clínica médica/ }));
    expect(screen.getByText("Chat screen")).toBeInTheDocument();
  });
});
