import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Phq9AssessmentPage } from "./Phq9AssessmentPage";
import * as container from "../../app/container";

function renderWithQueryClient() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <Phq9AssessmentPage />
    </QueryClientProvider>,
  );
}

describe("Phq9AssessmentPage", () => {
  it("shows the risk banner and human handoff panel immediately when item 9 is answered positively", async () => {
    vi.spyOn(container.submitAssessmentUseCase, "execute").mockResolvedValue({
      totalScore: 1,
      riskSignal: true,
      submissionSucceeded: true,
    });

    renderWithQueryClient();
    const user = userEvent.setup();

    const radios = screen.getAllByRole("radio", { name: /nenhuma vez/i });
    for (const radio of radios) {
      await user.click(radio);
    }
    const item9PositiveRadio = screen.getAllByRole("radio", { name: /vários dias/i })[8]!;
    await user.click(item9PositiveRadio);

    await user.click(screen.getByRole("button", { name: /ver resultado/i }));

    await waitFor(() => {
      expect(screen.getByText(/notamos um sinal importante/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/CVV - Centro de Valorização da Vida: 188/i)).toBeInTheDocument();
  });
});
