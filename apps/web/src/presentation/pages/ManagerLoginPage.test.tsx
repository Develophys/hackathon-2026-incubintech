import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ManagerLoginPage } from "./ManagerLoginPage";
import * as container from "../../app/container";
import { InvalidManagerCodeError } from "../../ports/manager-auth.port";

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/manager/login"]}>
        <Routes>
          <Route path="/manager/login" element={<ManagerLoginPage />} />
          <Route path="/manager" element={<div>Manager dashboard</div>} />
          <Route path="/home" element={<div>Home screen</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ManagerLoginPage", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("navigates to /manager on a correct code", async () => {
    vi.spyOn(container.loginManagerUseCase, "execute").mockResolvedValue({
      token: "abc.def",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("Código de acesso"), "1234");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Manager dashboard")).toBeInTheDocument();
  });

  it("shows an inline error on an incorrect code, without navigating", async () => {
    vi.spyOn(container.loginManagerUseCase, "execute").mockRejectedValue(new InvalidManagerCodeError());
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("Código de acesso"), "wrong");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Código incorreto.");
    });
    expect(screen.queryByText("Manager dashboard")).not.toBeInTheDocument();
  });
});
