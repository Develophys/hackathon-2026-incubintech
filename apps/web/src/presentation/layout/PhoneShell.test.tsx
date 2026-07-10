import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PhoneShell } from "./PhoneShell";

describe("PhoneShell", () => {
  it("renders children in a scrollable body with horizontal padding by default", () => {
    render(<PhoneShell>content</PhoneShell>);
    const body = screen.getByTestId("phone-shell-body");
    expect(body).toHaveClass("px-6");
    expect(body).toHaveTextContent("content");
  });

  it("removes horizontal padding when bleed is set", () => {
    render(<PhoneShell bleed>content</PhoneShell>);
    expect(screen.getByTestId("phone-shell-body")).not.toHaveClass("px-6");
  });

  it("renders the footer in a flex-none slot when provided", () => {
    render(<PhoneShell footer={<div data-testid="my-footer">nav</div>}>content</PhoneShell>);
    expect(screen.getByTestId("my-footer")).toBeInTheDocument();
  });

  it("defaults to the canvas background", () => {
    render(<PhoneShell>content</PhoneShell>);
    expect(screen.getByTestId("phone-shell-root")).toHaveClass("bg-canvas");
  });
});
