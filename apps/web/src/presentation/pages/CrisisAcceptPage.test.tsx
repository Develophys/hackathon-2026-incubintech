import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { CrisisAcceptPage } from "./CrisisAcceptPage";

function renderAccept() {
  return render(
    <MemoryRouter initialEntries={["/crisis/connect"]}>
      <Routes>
        <Route path="/crisis/connect" element={<CrisisAcceptPage />} />
        <Route path="/crisis" element={<div>Crisis offer screen</div>} />
        <Route path="/home" element={<div>Home screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CrisisAcceptPage", () => {
  it("asks for the professional bond before showing any direction", () => {
    renderAccept();
    expect(screen.getByRole("button", { name: "SUS" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Plano de saúde / rede privada" })).toBeInTheDocument();
    expect(screen.queryByText(/CAPS/)).not.toBeInTheDocument();
  });

  it("shows SUS-specific direction after choosing SUS", async () => {
    const user = userEvent.setup();
    renderAccept();
    await user.click(screen.getByRole("button", { name: "SUS" }));
    expect(screen.getByText("Rede SUS")).toBeInTheDocument();
    expect(screen.getByText(/CAPS/)).toBeInTheDocument();
  });

  it("shows private-network-specific direction after choosing the private option", async () => {
    const user = userEvent.setup();
    renderAccept();
    await user.click(screen.getByRole("button", { name: "Plano de saúde / rede privada" }));
    expect(screen.getByText("Plano de saúde / rede privada")).toBeInTheDocument();
    expect(screen.getByText(/central do seu plano de saúde/)).toBeInTheDocument();
  });

  it("always shows the CVV 188 line, before and after choosing a bond", async () => {
    const user = userEvent.setup();
    renderAccept();
    expect(screen.getByText(/188/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "SUS" }));
    expect(screen.getByText(/188/)).toBeInTheDocument();
  });

  it("never implies a live connection (no session/token/'available now' language)", async () => {
    const user = userEvent.setup();
    renderAccept();
    await user.click(screen.getByRole("button", { name: "SUS" }));
    expect(screen.queryByText(/disponível agora/)).not.toBeInTheDocument();
    expect(screen.queryByText(/token/)).not.toBeInTheDocument();
    expect(screen.queryByText("Conectando com segurança")).not.toBeInTheDocument();
  });

  it("writes nothing to localStorage and makes no network call", async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const user = userEvent.setup();
    renderAccept();
    await user.click(screen.getByRole("button", { name: "SUS" }));
    expect(setItemSpy).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("navigates to /home on the primary CTA and back to /crisis on back", async () => {
    const user = userEvent.setup();
    renderAccept();
    await user.click(screen.getByRole("button", { name: "SUS" }));
    await user.click(screen.getByRole("button", { name: "Entendi" }));
    expect(screen.getByText("Home screen")).toBeInTheDocument();
  });
});
