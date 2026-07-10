import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { SplashPage } from "./SplashPage";
import { useConsentStore } from "../../stores/consent.store";

function renderSplash() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<SplashPage />} />
        <Route path="/privacy" element={<div>Privacy screen</div>} />
        <Route path="/home" element={<div>Home screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("SplashPage", () => {
  beforeEach(() => {
    useConsentStore.setState({ hasConsented: false, consentedAt: null });
  });

  it("renders the wordmark, tagline, CTA, and trust line", () => {
    renderSplash();
    expect(screen.getByText("Zelo")).toBeInTheDocument();
    expect(screen.getByText("Cuidado confidencial para quem cuida.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Começar" })).toBeInTheDocument();
    expect(screen.getByText("anônimo · criptografado · no seu controle")).toBeInTheDocument();
  });

  it("navigates to /privacy when Começar is tapped", async () => {
    renderSplash();
    await userEvent.click(screen.getByRole("button", { name: "Começar" }));
    expect(screen.getByText("Privacy screen")).toBeInTheDocument();
  });

  it("redirects to /home when consent is already granted (component-level backup guard)", () => {
    useConsentStore.setState({ hasConsented: true, consentedAt: "2026-01-01T00:00:00.000Z" });
    renderSplash();
    expect(screen.getByText("Home screen")).toBeInTheDocument();
  });
});
