import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { CrisisOfferPage } from "./CrisisOfferPage";

function renderOffer() {
  return render(
    <MemoryRouter initialEntries={["/crisis"]}>
      <Routes>
        <Route path="/crisis" element={<CrisisOfferPage />} />
        <Route path="/crisis/connect" element={<div>Crisis accept screen</div>} />
        <Route path="/crisis/line" element={<div>Crisis decline screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CrisisOfferPage", () => {
  it("renders the offer copy and the always-on CVV card sourced from the handoff use-case", () => {
    renderOffer();
    expect(screen.getByText("Você não está sozinho(a).")).toBeInTheDocument();
    expect(screen.getByText(/A escolha é sempre sua/)).toBeInTheDocument();
    expect(screen.getByText("sempre disponível")).toBeInTheDocument();
    expect(screen.getByText("CVV · 188")).toBeInTheDocument();
  });

  it("navigates to /crisis/connect when accepting", async () => {
    const user = userEvent.setup();
    renderOffer();
    await user.click(screen.getByRole("button", { name: "Sim, quero falar com um psicólogo" }));
    expect(screen.getByText("Crisis accept screen")).toBeInTheDocument();
  });

  it("navigates to /crisis/line when declining", async () => {
    const user = userEvent.setup();
    renderOffer();
    await user.click(screen.getByRole("button", { name: "Agora não" }));
    expect(screen.getByText("Crisis decline screen")).toBeInTheDocument();
  });
});
