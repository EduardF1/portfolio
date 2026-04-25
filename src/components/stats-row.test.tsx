import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "../../messages/en.json";
import { StatsRow } from "./stats-row";

function renderWithIntl() {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <StatsRow />
    </NextIntlClientProvider>,
  );
}

describe("<StatsRow />", () => {
  it("renders all four labels", () => {
    renderWithIntl();
    expect(screen.getByText("Years coding")).toBeInTheDocument();
    expect(screen.getByText("Languages")).toBeInTheDocument();
    expect(screen.getByText("Major projects shipped")).toBeInTheDocument();
    expect(screen.getByText("Countries visited")).toBeInTheDocument();
  });

  it("renders all four values", () => {
    renderWithIntl();
    expect(screen.getByText("5+")).toBeInTheDocument();
    // "4" appears twice (languages + projects); both should be present
    expect(screen.getAllByText("4")).toHaveLength(2);
    expect(screen.getByText("20+")).toBeInTheDocument();
  });
});
