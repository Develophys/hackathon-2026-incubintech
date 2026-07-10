import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { PrivacyPage } from "./PrivacyPage";

function renderPrivacy() {
  return render(
    <MemoryRouter initialEntries={["/privacy"]}>
      <Routes>
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/consent" element={<div>Consent screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PrivacyPage", () => {
  it("renders the title and all three trust claims verbatim", () => {
    renderPrivacy();
    expect(screen.getByText("Como o Zelo protege você")).toBeInTheDocument();
    expect(screen.getByText("Processado no seu aparelho")).toBeInTheDocument();
    expect(screen.getByText("O cálculo do seu resultado nunca sai do celular.")).toBeInTheDocument();
    expect(screen.getByText("Anônimo por padrão")).toBeInTheDocument();
    expect(screen.getByText("Ninguém do hospital vê quem você é — nem o seu CRM.")).toBeInTheDocument();
    expect(screen.getByText("Você no controle")).toBeInTheDocument();
    expect(screen.getByText("Nada é compartilhado sem o seu aceite explícito.")).toBeInTheDocument();
  });

  it("navigates to /consent on CTA tap", async () => {
    renderPrivacy();
    await userEvent.click(screen.getByRole("button", { name: "Entendi, continuar" }));
    expect(screen.getByText("Consent screen")).toBeInTheDocument();
  });
});
