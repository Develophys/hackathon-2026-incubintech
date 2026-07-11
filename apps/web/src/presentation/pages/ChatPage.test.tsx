import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { ChatPage } from "./ChatPage";
import * as container from "../../app/container";

function renderChat() {
  return render(
    <MemoryRouter initialEntries={["/chat"]}>
      <Routes>
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/crisis" element={<div>Crisis offer screen</div>} />
        <Route path="/home" element={<div>Home screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function* fakeAssistantStream() {
  yield { delta: "Oi, tudo bem?" };
}

describe("ChatPage", () => {
  it("always shows the non-dismissable disclaimer and the handoff shortcut", () => {
    renderChat();
    expect(screen.getByText(/não substitui atendimento profissional/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /falar com uma pessoa real/i })).toBeInTheDocument();
  });

  it("navigates to /crisis on the handoff shortcut, with no network call", async () => {
    const user = userEvent.setup();
    renderChat();
    await user.click(screen.getByRole("button", { name: /falar com uma pessoa real/i }));
    expect(screen.getByText("Crisis offer screen")).toBeInTheDocument();
  });

  it("sends a message and streams the assistant reply into a styled bubble", async () => {
    vi.spyOn(container.sendChatMessageUseCase, "execute").mockReturnValue(fakeAssistantStream());
    const user = userEvent.setup();
    renderChat();

    await user.type(screen.getByPlaceholderText("Escreva como você está…"), "Estou bem");
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    expect(await screen.findByText("Estou bem")).toBeInTheDocument();
    expect(await screen.findByText("Oi, tudo bem?")).toBeInTheDocument();
  });
});
