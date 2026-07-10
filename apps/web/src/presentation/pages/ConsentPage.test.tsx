import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { ConsentPage } from "./ConsentPage";
import { useConsentStore } from "../../stores/consent.store";

function renderConsent() {
  return render(
    <MemoryRouter initialEntries={["/consent"]}>
      <Routes>
        <Route path="/consent" element={<ConsentPage />} />
        <Route path="/privacy" element={<div>Privacy screen</div>} />
        <Route path="/home" element={<div>Home screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ConsentPage", () => {
  beforeEach(() => {
    useConsentStore.setState({ hasConsented: false, consentedAt: null });
  });

  it("renders the three consent rows and the encryption note", () => {
    renderConsent();
    expect(screen.getByText(/não emite diagnóstico/)).toBeInTheDocument();
    expect(screen.getByText(/anônimo e agregado/)).toBeInTheDocument();
    expect(screen.getByText(/eu escolher/)).toBeInTheDocument();
    expect(screen.getByText(/Criptografia AES-256/)).toBeInTheDocument();
  });

  it("grants consent and navigates to /home when accepted", async () => {
    renderConsent();
    await userEvent.click(screen.getByRole("button", { name: "Aceitar e entrar" }));
    expect(useConsentStore.getState().hasConsented).toBe(true);
    expect(useConsentStore.getState().consentedAt).not.toBeNull();
    expect(screen.getByText("Home screen")).toBeInTheDocument();
  });

  it("navigates back to /privacy", async () => {
    renderConsent();
    await userEvent.click(screen.getByRole("button", { name: /voltar/i }));
    expect(screen.getByText("Privacy screen")).toBeInTheDocument();
  });
});
