import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { ManagerDashboardPage } from "./ManagerDashboardPage";

function renderManager() {
  return render(
    <MemoryRouter initialEntries={["/manager"]}>
      <Routes>
        <Route path="/manager" element={<ManagerDashboardPage />} />
        <Route path="/home" element={<div>Home screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ManagerDashboardPage", () => {
  it("renders only segments with n >= 5, suppressing the one below k-anonymity threshold", () => {
    renderManager();
    expect(screen.getByText("Plantão noturno")).toBeInTheDocument();
    expect(screen.getByText("Pronto-socorro")).toBeInTheDocument();
    expect(screen.getByText("UTI")).toBeInTheDocument();
    expect(screen.queryByText("Ambulatório")).not.toBeInTheDocument();
  });

  it("renders the privacy/suppression note and KPI figures", () => {
    renderManager();
    expect(screen.getByText(/menos de 5 respostas ficam ocultos/)).toBeInTheDocument();
    expect(screen.getByText("41%")).toBeInTheDocument();
    expect(screen.getByText("111")).toBeInTheDocument();
    expect(screen.getByText("anônimo")).toBeInTheDocument();
  });

  it("navigates to /home on back", async () => {
    const user = userEvent.setup();
    renderManager();
    await user.click(screen.getByRole("button", { name: "Sair da demo" }));
    expect(screen.getByText("Home screen")).toBeInTheDocument();
  });
});
