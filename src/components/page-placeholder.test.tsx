import { afterEach, describe, it, expect } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PagePlaceholder } from "./page-placeholder";

afterEach(() => {
  cleanup();
});

describe("<PagePlaceholder />", () => {
  it("renders kicker, title, description and the placeholder badge", () => {
    render(
      <PagePlaceholder
        kicker="Travel"
        title="Notes from the road."
        description="A photo journal that's still being assembled."
      />,
    );
    expect(screen.getByText("Travel")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Notes from the road." }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("A photo journal that's still being assembled."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Placeholder · Content arriving soon/),
    ).toBeInTheDocument();
  });
});
