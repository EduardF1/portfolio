import { afterEach, describe, it, expect } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { GithubIcon, LinkedinIcon } from "./icons";

afterEach(() => {
  cleanup();
});

describe("icon components", () => {
  it("GithubIcon renders an aria-hidden svg with a path", () => {
    const { container } = render(<GithubIcon className="h-5 w-5" />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.querySelector("path")).not.toBeNull();
    expect(svg?.getAttribute("class")).toBe("h-5 w-5");
  });

  it("LinkedinIcon renders an aria-hidden svg with a path", () => {
    const { container } = render(<LinkedinIcon />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.querySelector("path")).not.toBeNull();
  });
});
