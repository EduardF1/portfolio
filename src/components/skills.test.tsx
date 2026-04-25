import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "../../messages/en.json";
import { Skills } from "./skills";

function renderWithIntl() {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <Skills />
    </NextIntlClientProvider>,
  );
}

describe("<Skills />", () => {
  it("renders all six category headings", () => {
    renderWithIntl();
    expect(
      screen.getByRole("heading", { level: 3, name: "Backend" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Frontend" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Mobile" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Data" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Quality" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Operations" }),
    ).toBeInTheDocument();
  });

  it("renders well-known techs", () => {
    renderWithIntl();
    // C# label appears in tile text
    expect(screen.getByText("C#")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("renders Devicon logos via the cdn.jsdelivr.net URL", () => {
    renderWithIntl();
    const reactLogo = screen.getByAltText("React") as HTMLImageElement;
    expect(reactLogo).toBeInTheDocument();
    expect(reactLogo.getAttribute("src")).toBe(
      "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
    );
    expect(reactLogo.getAttribute("width")).toBe("32");
    expect(reactLogo.getAttribute("height")).toBe("32");
  });

  it("links each tile to the official docs in a new tab", () => {
    renderWithIntl();
    const reactLink = screen.getByTitle("React").closest("a");
    expect(reactLink).not.toBeNull();
    expect(reactLink).toHaveAttribute("href", "https://react.dev/");
    expect(reactLink).toHaveAttribute("target", "_blank");
    expect(reactLink).toHaveAttribute("rel", "noopener noreferrer");
  });
});
