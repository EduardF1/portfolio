/**
 * Tests for the root <GlobalError /> boundary.
 *
 * GlobalError fires when the root layout itself throws. It's a
 * standalone document (its own <html><body>) that uses inline styles so
 * it doesn't need globals.css to be loadable. We verify the contract:
 * - the error digest is shown when present (debug aid for the user),
 * - the retry button calls Next's `unstable_retry`,
 * - the home anchor uses a plain href (full reload, not router push)
 *   because the router can't be relied on when the layout is broken.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

import GlobalError from "./global-error";

function makeError(digest?: string): Error & { digest?: string } {
  const e = new Error("boom") as Error & { digest?: string };
  if (digest) e.digest = digest;
  return e;
}

describe("<GlobalError />", () => {
  it("renders the 500-style heading and a friendly description", () => {
    render(<GlobalError error={makeError()} unstable_retry={() => {}} />);
    expect(screen.getByText(/500 · Something went wrong/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /broke in a way I didn't plan for/i,
      }),
    ).toBeInTheDocument();
  });

  it("shows the error digest when one is provided", () => {
    render(
      <GlobalError
        error={makeError("digest-abc123")}
        unstable_retry={() => {}}
      />,
    );
    expect(screen.getByText(/digest-abc123/)).toBeInTheDocument();
    expect(screen.getByText(/^ref · /)).toBeInTheDocument();
  });

  it("does not render a digest line when the error has none", () => {
    render(<GlobalError error={makeError()} unstable_retry={() => {}} />);
    expect(screen.queryByText(/^ref · /)).not.toBeInTheDocument();
  });

  it("Try again button invokes the unstable_retry callback", () => {
    const retry = vi.fn();
    render(<GlobalError error={makeError()} unstable_retry={retry} />);
    fireEvent.click(screen.getByRole("button", { name: /Try again/ }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("Go home anchor is a plain href (not a router link) for a full reload", () => {
    render(<GlobalError error={makeError()} unstable_retry={() => {}} />);
    const home = screen.getByRole("link", { name: /Go home/ });
    expect(home).toHaveAttribute("href", "/");
  });

  it("includes a mailto so users can reach the author when retry doesn't help", () => {
    render(<GlobalError error={makeError()} unstable_retry={() => {}} />);
    const mailto = screen.getByRole("link", { name: /drop me a line/i });
    expect(mailto.getAttribute("href")).toMatch(/^mailto:/);
  });
});
