import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HealthBanner } from "./HealthBanner";
import * as container from "@/app/container";

describe("HealthBanner", () => {
  it("shows the API status once the health check resolves", async () => {
    vi.spyOn(container.checkApiHealthUseCase, "execute").mockResolvedValue({
      status: "ok",
      database: true,
    });

    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HealthBanner />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/api: ok/i)).toBeInTheDocument();
    });
  });
});
