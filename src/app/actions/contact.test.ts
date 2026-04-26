import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { submitContact } from "./contact";

beforeEach(() => {
  // Default to no email/turnstile config so the dev-friendly bypass is on.
  delete process.env.RESEND_API_KEY;
  delete process.env.TURNSTILE_SECRET_KEY;
});

afterEach(() => {
  vi.restoreAllMocks();
});

function fd(fields: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.append(k, v);
  return f;
}

describe("submitContact", () => {
  it("returns ok for a valid submission with no captcha/email configured (dev path)", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const out = await submitContact(
      { status: "idle" },
      fd({
        name: "Eduard",
        email: "fischer_eduard@yahoo.com",
        subject: "Hello",
        message: "Long enough message to clear the validator.",
      }),
    );
    expect(out).toEqual({ status: "ok" });
  });

  it("returns ok when subject is missing (it's optional)", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const out = await submitContact(
      { status: "idle" },
      fd({
        name: "Eduard",
        email: "fischer_eduard@yahoo.com",
        message: "Long enough message to clear the validator.",
      }),
    );
    expect(out.status).toBe("ok");
  });

  it("returns error with field-level errors when validation fails", async () => {
    const out = await submitContact(
      { status: "idle" },
      fd({
        name: "",
        email: "not-an-email",
        message: "short",
      }),
    );
    expect(out.status).toBe("error");
    if (out.status === "error") {
      expect(out.errors?.name).toBeDefined();
      expect(out.errors?.email).toBeDefined();
      expect(out.errors?.message).toBeDefined();
    }
  });

  it("rejects when Turnstile is configured and verification fails", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: false }), { status: 200 }),
    );
    const out = await submitContact(
      { status: "idle" },
      fd({
        name: "Eduard",
        email: "fischer_eduard@yahoo.com",
        message: "Long enough message to clear the validator.",
        "cf-turnstile-response": "tok",
      }),
    );
    expect(out.status).toBe("error");
    if (out.status === "error") {
      expect(out.message).toMatch(/Captcha/);
    }
  });

  it("accepts when Turnstile verification succeeds and Resend is unset (dev path)", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    vi.spyOn(console, "info").mockImplementation(() => {});
    const out = await submitContact(
      { status: "idle" },
      fd({
        name: "Eduard",
        email: "fischer_eduard@yahoo.com",
        message: "Long enough message to clear the validator.",
        "cf-turnstile-response": "tok",
      }),
    );
    expect(out.status).toBe("ok");
  });

  it("rejects when Turnstile is configured but no token is provided", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    const out = await submitContact(
      { status: "idle" },
      fd({
        name: "Eduard",
        email: "fischer_eduard@yahoo.com",
        message: "Long enough message to clear the validator.",
      }),
    );
    expect(out.status).toBe("error");
    if (out.status === "error") {
      expect(out.message).toMatch(/Captcha/);
    }
  });

  it("returns error when Resend is configured but the email send fails", async () => {
    process.env.RESEND_API_KEY = "rs-key";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("nope", { status: 500 }),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    const out = await submitContact(
      { status: "idle" },
      fd({
        name: "Eduard",
        email: "fischer_eduard@yahoo.com",
        message: "Long enough message to clear the validator.",
      }),
    );
    expect(out.status).toBe("error");
    if (out.status === "error") {
      expect(out.message).toMatch(/Could not send/);
    }
    expect(fetchMock).toHaveBeenCalled();
  });

  it("returns ok when Resend accepts the email", async () => {
    process.env.RESEND_API_KEY = "rs-key";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "msg_x" }), { status: 200 }),
    );
    const out = await submitContact(
      { status: "idle" },
      fd({
        name: "Eduard",
        email: "fischer_eduard@yahoo.com",
        subject: "Hi",
        message: "Long enough message to clear the validator.",
      }),
    );
    expect(out.status).toBe("ok");
    // Check the subject is prefixed with [Portfolio]
    const body = JSON.parse(
      (fetchMock.mock.calls[0][1] as RequestInit).body as string,
    );
    expect(body.subject).toBe("[Portfolio] Hi");
  });

  it("honeypot trip silently returns ok without sending email", async () => {
    process.env.RESEND_API_KEY = "rs-key";
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const out = await submitContact(
      { status: "idle" },
      fd({
        name: "Bot",
        email: "bot@example.com",
        message: "spam payload",
        website: "spam.example.com",
      }),
    );
    expect(out.status).toBe("ok");
    // No outbound network call when honeypot is filled
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses a fallback subject when none is provided", async () => {
    process.env.RESEND_API_KEY = "rs-key";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "msg_x" }), { status: 200 }),
    );
    await submitContact(
      { status: "idle" },
      fd({
        name: "Eduard",
        email: "fischer_eduard@yahoo.com",
        message: "Long enough message to clear the validator.",
      }),
    );
    const body = JSON.parse(
      (fetchMock.mock.calls[0][1] as RequestInit).body as string,
    );
    expect(body.subject).toBe("[Portfolio] New message");
  });
});
