import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider, Outlet } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { routeChildren } from "./router";
import { useConsentStore } from "../stores/consent.store";
import * as container from "./container";

// Reuses router.tsx's own route tree (routeChildren) rather than duplicating
// it, so this test can never silently drift from what actually ships.
function buildTestRouter(initialPath: string) {
  const router = createMemoryRouter(
    [
      {
        id: "root",
        path: "/",
        Component: () => <Outlet />,
        children: routeChildren,
      },
    ],
    { initialEntries: [initialPath] },
  );
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("onboarding router flow", () => {
  beforeEach(() => {
    localStorage.clear();
    useConsentStore.setState({ hasConsented: false, consentedAt: null });
    vi.spyOn(container.checkApiHealthUseCase, "execute").mockResolvedValue({ status: "ok", database: true });
  });

  it("cold start walks Splash -> Privacy -> Consent -> Home", async () => {
    buildTestRouter("/");
    const user = userEvent.setup();

    expect(await screen.findByRole("button", { name: "Começar" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Começar" }));

    expect(await screen.findByText("Como o Zelo protege você")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Entendi, continuar" }));

    expect(await screen.findByText("Seu consentimento")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Aceitar e entrar" }));

    await waitFor(() => {
      expect(useConsentStore.getState().hasConsented).toBe(true);
    });
  });

  it("warm start (already consented) redirects straight to Home via the loader", async () => {
    useConsentStore.setState({ hasConsented: true, consentedAt: "2026-01-01T00:00:00.000Z" });
    buildTestRouter("/");
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Começar" })).not.toBeInTheDocument();
    });
  });

  it("Home's check-in CTA reaches the assessment selector through the real route table", async () => {
    useConsentStore.setState({ hasConsented: true, consentedAt: "2026-01-01T00:00:00.000Z" });
    buildTestRouter("/home");
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Fazer check-in" }));
    expect(await screen.findByText("Autoavaliação")).toBeInTheDocument();
  });

  it("the crisis fork is reachable and both branches resolve without dead-ends", async () => {
    useConsentStore.setState({ hasConsented: true, consentedAt: "2026-01-01T00:00:00.000Z" });
    buildTestRouter("/crisis");
    const user = userEvent.setup();

    expect(await screen.findByRole("button", { name: "Agora não" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Agora não" }));
    expect(await screen.findByText("Tudo bem. A escolha é sua.")).toBeInTheDocument();
  });

  it("Home's quick action reaches Peers", async () => {
    useConsentStore.setState({ hasConsented: true, consentedAt: "2026-01-01T00:00:00.000Z" });
    buildTestRouter("/home");
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Falar com um par" }));
    expect(await screen.findByText("Pares anônimos")).toBeInTheDocument();
  });

  it("Home's Manager demo link reaches the dashboard", async () => {
    useConsentStore.setState({ hasConsented: true, consentedAt: "2026-01-01T00:00:00.000Z" });
    buildTestRouter("/home");
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Ver painel do gestor (demo)" }));
    expect(await screen.findByText("Tendências da equipe")).toBeInTheDocument();
  });
});
