/**
 * Tests for the contact page server component + client form. The form
 * is a client component using useActionState; we mock the server action
 * so we can drive the success/error branches.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";

vi.mock("server-only", () => ({}));

const useTranslationsMock = vi.fn();
vi.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: async (ns?: string) => {
    if (ns === "contact") {
      return (key: string) =>
        ({
          kicker: "Contact",
          heading: "Let's talk.",
          description: "Drop me a line.",
        })[key] ?? key;
    }
    return (key: string) => `tooltip:${key}`;
  },
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

describe("ContactForm attachment validation", () => {
  function setup() {
    useTranslationsMock.mockReturnValue(
      makeT({
        name: "Name",
        email: "Email",
        subject: "Subject",
        subjectHint: "(optional)",
        message: "Message",
        attachment: "Attachment",
        attachmentHint: "Optional · PDF, JPEG, PNG, or Word document · max 5 MB",
        attachmentErrorType: "PDF, JPEG, PNG, or Word document only",
        attachmentErrorSize: "File is larger than 5 MB",
        sending: "Sending…",
        submit: "Send",
      }),
    );
    render(<ContactForm />);
    return screen.getByLabelText(/Attachment/) as HTMLInputElement;
  }

  it("renders the attachment file input with the expanded accept hint", () => {
    const input = setup();
    expect(input).toBeInTheDocument();
    expect(input.type).toBe("file");
    // Whitelist: PDF + JPEG + PNG + Word (.doc + .docx)
    expect(input.accept).toContain("application/pdf");
    expect(input.accept).toContain("image/jpeg");
    expect(input.accept).toContain("image/png");
    expect(input.accept).toContain("application/msword");
    expect(input.accept).toContain(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    expect(
      screen.getByText(/Optional · PDF, JPEG, PNG, or Word document · max 5 MB/),
    ).toBeInTheDocument();
  });

  it("rejects an unsupported file type with an inline error", () => {
    const input = setup();
    const file = new File(["zip-bytes"], "archive.zip", {
      type: "application/zip",
    });
    fireEvent.change(input, { target: { files: [file] } });
    const errorEl = document.getElementById("attachment-error");
    expect(errorEl?.textContent).toMatch(/PDF, JPEG, PNG, or Word document/);
    expect(screen.getByRole("button", { name: /Send/ })).toBeDisabled();
  });

  it("accepts a PNG image without showing an error", () => {
    const input = setup();
    const png = new File([new Uint8Array(1024)], "shot.png", {
      type: "image/png",
    });
    fireEvent.change(input, { target: { files: [png] } });
    expect(document.getElementById("attachment-error")).toBeNull();
    expect(screen.getByText("shot.png")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Send/ })).not.toBeDisabled();
  });

  it("accepts a .docx Word document without showing an error", () => {
    const input = setup();
    const docx = new File([new Uint8Array(1024)], "letter.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    fireEvent.change(input, { target: { files: [docx] } });
    expect(document.getElementById("attachment-error")).toBeNull();
    expect(screen.getByText("letter.docx")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Send/ })).not.toBeDisabled();
  });

  it("rejects a too-large PDF with an inline error", () => {
    const input = setup();
    const big = new File([new Uint8Array(6 * 1024 * 1024)], "huge.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(input, { target: { files: [big] } });
    const errorEl = document.getElementById("attachment-error");
    expect(errorEl?.textContent).toMatch(/File is larger than 5 MB/);
    expect(screen.getByRole("button", { name: /Send/ })).toBeDisabled();
  });

  it("accepts a valid small PDF without showing an error", () => {
    const input = setup();
    const ok = new File([new Uint8Array(1024)], "cv.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(input, { target: { files: [ok] } });
    expect(document.getElementById("attachment-error")).toBeNull();
    expect(screen.getByText("cv.pdf")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Send/ })).not.toBeDisabled();
  });
});
