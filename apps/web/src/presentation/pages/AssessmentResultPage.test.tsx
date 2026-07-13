import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { AssessmentResultPage } from "./AssessmentResultPage";

function renderResult(state: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/assessment/result", state }]}>
      <Routes>
        <Route path="/assessment/result" element={<AssessmentResultPage />} />
        <Route path="/assessment" element={<div>Assessment select screen</div>} />
        <Route path="/chat" element={<div>Chat screen</div>} />
        <Route path="/crisis" element={<div>Crisis screen</div>} />
        <Route path="/home" element={<div>Home screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AssessmentResultPage", () => {
  it("renders the score, band, and 'sinal, não diagnóstico' reframe copy", () => {
    renderResult({ scaleType: "PHQ-9", totalScore: 12, max: 27, riskSignal: false });
    expect(screen.getByText("Sua pontuação PHQ-9")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Moderado")).toBeInTheDocument();
    expect(screen.getByText(/sinal, não um diagnóstico/)).toBeInTheDocument();
    expect(screen.getByText("anônimo")).toBeInTheDocument();
  });

  it("shows the risk callout when riskSignal is true without hiding the other CTAs", () => {
    renderResult({ scaleType: "PHQ-9", totalScore: 20, max: 27, riskSignal: true });
    expect(screen.getByText("Notamos um sinal importante.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Conversar com o acolhimento" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Voltar ao início" })).toBeInTheDocument();
  });

  it("does not show the risk callout when riskSignal is false", () => {
    renderResult({ scaleType: "PHQ-9", totalScore: 3, max: 27, riskSignal: false });
    expect(screen.queryByText("Notamos um sinal importante.")).not.toBeInTheDocument();
  });

  it("redirects to /assessment when there is no navigation state (deep link or refresh)", async () => {
    renderResult(null);
    expect(await screen.findByText("Assessment select screen")).toBeInTheDocument();
  });

  it("opens the encryption info modal when the on-device stamp is tapped", async () => {
    const user = userEvent.setup();
    renderResult({ scaleType: "PHQ-9", totalScore: 12, max: 27, riskSignal: false });

    await user.click(
      screen.getByRole("button", { name: /Saiba mais sobre a criptografia AES-256/ }),
    );

    expect(screen.getByRole("dialog", { name: "Criptografia AES-256" })).toBeInTheDocument();
  });

  it("closes the encryption info modal from the close button", async () => {
    const user = userEvent.setup();
    renderResult({ scaleType: "PHQ-9", totalScore: 12, max: 27, riskSignal: false });
    await user.click(
      screen.getByRole("button", { name: /Saiba mais sobre a criptografia AES-256/ }),
    );

    await user.click(screen.getByRole("button", { name: "Fechar" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
