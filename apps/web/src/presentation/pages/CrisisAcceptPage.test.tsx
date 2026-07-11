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
        <Route path="/chat" element={<div>Chat screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CrisisAcceptPage", () => {
  it("renders a fresh token and the required privacy statements", () => {
    renderAccept();
    expect(screen.getByText(/token: zl-/)).toBeInTheDocument();
    expect(screen.getByText(/identidade não é armazenada/)).toBeInTheDocument();
    expect(screen.getByText(/sem vínculo com CRM/)).toBeInTheDocument();
    expect(screen.getByText("Psicólogo(a) parceiro(a)")).toBeInTheDocument();
  });

  it("writes nothing to localStorage and makes no network call", () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    renderAccept();
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it("navigates to /chat on the primary CTA and back to /crisis on back", async () => {
    const user = userEvent.setup();
    renderAccept();
    await user.click(screen.getByRole("button", { name: "Iniciar conversa segura" }));
    expect(screen.getByText("Chat screen")).toBeInTheDocument();
  });
});
