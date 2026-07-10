import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider, redirect, Outlet } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SplashPage } from "../presentation/pages/SplashPage";
import { PrivacyPage } from "../presentation/pages/PrivacyPage";
import { ConsentPage } from "../presentation/pages/ConsentPage";
import { HomePage } from "../presentation/pages/HomePage";
import { useConsentStore } from "../stores/consent.store";
import { routes } from "../presentation/lib/routes";
import * as container from "./container";

function buildTestRouter(initialPath: string) {
  const router = createMemoryRouter(
    [
      {
        id: "root",
        path: "/",
        Component: () => <Outlet />,
        children: [
          {
            index: true,
            Component: SplashPage,
            loader: () => (useConsentStore.getState().hasConsented ? redirect(routes.home) : null),
          },
          { path: "privacy", Component: PrivacyPage },
          { path: "consent", Component: ConsentPage },
          { path: "home", Component: HomePage },
        ],
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
});
