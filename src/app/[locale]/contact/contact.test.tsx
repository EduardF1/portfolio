/**
 * Tests for the contact page server component + client form. The form
 * is a client component using useActionState; we mock the server action
 * so we can drive the success/error branches.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("server-only", () => ({}));

const useTranslationsMock = vi.fn();
vi.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => `tooltip:${key}`,
  setRequestLocale: () => {},
}));

const submitMock = vi.fn();
vi.mock("@/app/actions/contact", () => ({
  submitContact: (...a: unknown[]) => submitMock(...a),
}));

afterEach(() => {
  cleanup();
  useTranslationsMock.mockReset();
  submitMock.mockReset();
});

import ContactPage from "./page";
import { ContactForm } from "./contact-form";

function makeT(map: Record<string, string>) {
  const fn = (key: string) => map[key] ?? key;
  // next-intl t.rich support: invoke each tag with a string and concat.
  (fn as unknown as { rich: typeof rich }).rich = rich;
  function rich(
    key: string,
    tags: Record<string, (chunks: React.ReactNode) => React.ReactNode>,
  ) {
    const out: React.ReactNode[] = [];
    out.push(map[key] ?? key);
    for (const [, render] of Object.entries(tags)) {
      out.push(render("inline"));
    }
    return out;
  }
  return fn;
}

describe("ContactPage", () => {
  it("renders the heading, mailto link, and the form", async () => {
    useTranslationsMock.mockReturnValue(
      makeT({
        name: "Name",
        email: "Email",
        subject: "Subject",
        subjectHint: "(optional)",
        message: "Message",
        sending: "Sending…",
        submit: "Send",
      }),
    );
    const tree = await ContactPage();
    render(tree);
    expect(
      screen.getByRole("heading", { level: 1, name: /Let.s talk/ }),
    ).toBeInTheDocument();
    const mailto = screen.getByText(/fischer_eduard@yahoo.com/i);
    expect(mailto.closest("a")).toHaveAttribute(
      "href",
      "mailto:fischer_eduard@yahoo.com",
    );
    expect(screen.getByLabelText(/^Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Subject/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Message/)).toBeInTheDocument();
  });
});

describe("ContactForm (idle state)", () => {
  it("renders required Name/Email/Message fields and a Send button", () => {
    useTranslationsMock.mockReturnValue(
      makeT({
        name: "Name",
        email: "Email",
        subject: "Subject",
        subjectHint: "(optional)",
        message: "Message",
        sending: "Sending…",
        submit: "Send",
      }),
    );
    render(<ContactForm />);
    expect(screen.getByRole("button", { name: /Send/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/)).toBeRequired();
    expect(screen.getByLabelText(/Email/)).toBeRequired();
    expect(screen.getByLabelText(/Message/)).toBeRequired();
  });

  it("shows the optional hint next to Subject", () => {
    useTranslationsMock.mockReturnValue(
      makeT({
        name: "Name",
        email: "Email",
        subject: "Subject",
        subjectHint: "(optional)",
        message: "Message",
        sending: "Sending…",
        submit: "Send",
      }),
    );
    render(<ContactForm />);
    expect(screen.getByText("(optional)")).toBeInTheDocument();
  });
});
