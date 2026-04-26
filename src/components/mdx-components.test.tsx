import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { createElement } from "react";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: React.ComponentProps<"a"> & { href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { mdxComponents } from "./mdx-components";

afterEach(() => {
  cleanup();
});

// MDXComponents map values are loosely typed (the MDX runtime resolves them
// dynamically), so we invoke them via createElement to side-step the
// React JSX-element-type strictness in tests.
function el(
  component: unknown,
  props: Record<string, unknown> = {},
  ...children: React.ReactNode[]
) {
  return createElement(
    component as React.ElementType,
    props,
    ...children,
  );
}

describe("mdxComponents", () => {
  it("provides heading + paragraph + link overrides that render with project styles", () => {
    render(
      <>
        {el(mdxComponents.h1, {}, "One")}
        {el(mdxComponents.h2, {}, "Two")}
        {el(mdxComponents.h3, {}, "Three")}
        {el(mdxComponents.p, {}, "Body")}
        {el(mdxComponents.a, { href: "https://example.com" }, "Link")}
      </>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "One" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Two" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Three" })).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Link" });
    expect(link).toHaveAttribute("href", "https://example.com");
  });

  it("provides code, pre, blockquote, ul, hr overrides", () => {
    const { container } = render(
      <>
        {el(mdxComponents.code, {}, "x")}
        {el(mdxComponents.pre, {}, "print()")}
        {el(mdxComponents.blockquote, {}, "q")}
        {el(
          mdxComponents.ul,
          {},
          el("li", {}, "a"),
          el("li", {}, "b"),
        )}
        {el(mdxComponents.hr, {})}
      </>,
    );
    expect(container.querySelector("code")).not.toBeNull();
    expect(container.querySelector("pre")).not.toBeNull();
    expect(container.querySelector("blockquote")).not.toBeNull();
    expect(container.querySelector("ul")).not.toBeNull();
    expect(container.querySelector("hr")).not.toBeNull();
  });

  it("anchor falls back to '#' when href is omitted", () => {
    render(<>{el(mdxComponents.a, {}, "plain")}</>);
    expect(screen.getByRole("link", { name: "plain" })).toHaveAttribute("href", "#");
  });
});
