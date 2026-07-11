import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button", () => {
  it("renders the primary variant by default with brand background", () => {
    render(<Button>Começar</Button>);
    expect(screen.getByRole("button", { name: "Começar" })).toHaveClass("bg-brand");
  });

  it.each([
    ["ghost", "bg-transparent"],
    ["outline", "border-line"],
    ["danger", "bg-danger"],
  ] as const)("applies %s variant classes", (variant, expectedClass) => {
    render(<Button variant={variant}>Label</Button>);
    expect(screen.getByRole("button", { name: "Label" })).toHaveClass(expectedClass);
  });

  it("calls onClick when clicked and not loading", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Tap</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Tap" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("disables the button and shows a spinner when loading, while keeping an accessible name", () => {
    render(<Button loading>Enviar</Button>);
    const button = screen.getByRole("button", { name: "Enviar" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(screen.getByTestId("button-spinner")).toBeInTheDocument();
    expect(screen.getByTestId("button-spinner")).toHaveAttribute("aria-hidden", "true");
  });

  it("is full width by default", () => {
    render(<Button>Label</Button>);
    expect(screen.getByRole("button")).toHaveClass("w-full");
  });
});
