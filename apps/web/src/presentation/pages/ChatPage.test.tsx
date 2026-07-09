import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatPage } from "./ChatPage";

describe("ChatPage", () => {
  it("always shows the 'talk to a human' shortcut, and it works without any network call", async () => {
    render(<ChatPage />);

    const handoffButton = screen.getByRole("button", { name: /falar com uma pessoa real/i });
    expect(handoffButton).toBeInTheDocument();

    await userEvent.click(handoffButton);

    expect(screen.getByText(/CVV - Centro de Valorização da Vida: 188/i)).toBeInTheDocument();
  });

  it("shows the permanent disclaimer that the chat does not replace professional care", () => {
    render(<ChatPage />);

    expect(screen.getByText(/não substitui atendimento profissional/i)).toBeInTheDocument();
  });
});
