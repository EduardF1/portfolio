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

  describe("attachment handling", () => {
    function fdWithAttachment(
      fields: Record<string, string>,
      file: File | null,
    ): FormData {
      const f = fd(fields);
      if (file) f.append("attachment", file);
      return f;
    }

    function makeFile(opts: {
      name?: string;
      type?: string;
      bytes?: number;
      content?: string;
    }) {
      const { name = "cv.pdf", type = "application/pdf" } = opts;
      const body = opts.content
        ? new Uint8Array(
            Array.from(opts.content).map((c) => c.charCodeAt(0)),
          )
        : new Uint8Array(opts.bytes ?? 100);
      return new File([body], name, { type });
    }

    it("rejects an attachment larger than 5 MB", async () => {
      const tooBig = makeFile({ bytes: 6 * 1024 * 1024 });
      const out = await submitContact(
        { status: "idle" },
        fdWithAttachment(
          {
            name: "Eduard",
            email: "fischer_eduard@yahoo.com",
            message: "Long enough message to clear the validator.",
          },
          tooBig,
        ),
      );
      expect(out.status).toBe("error");
      if (out.status === "error") {
        expect(out.errors?.attachment?.[0]).toMatch(/Too big/);
      }
    });

    it("rejects an attachment with an unsupported MIME type", async () => {
      const junk = makeFile({ name: "archive.zip", type: "application/zip" });
      const out = await submitContact(
        { status: "idle" },
        fdWithAttachment(
          {
            name: "Eduard",
            email: "fischer_eduard@yahoo.com",
            message: "Long enough message to clear the validator.",
          },
          junk,
        ),
      );
      expect(out.status).toBe("error");
      if (out.status === "error") {
        expect(out.errors?.attachment?.[0]).toMatch(/Unsupported file type/);
      }
    });

    it("rejects a plain-text attachment", async () => {
      const txt = makeFile({ name: "notes.txt", type: "text/plain" });
      const out = await submitContact(
        { status: "idle" },
        fdWithAttachment(
          {
            name: "Eduard",
            email: "fischer_eduard@yahoo.com",
            message: "Long enough message to clear the validator.",
          },
          txt,
        ),
      );
      expect(out.status).toBe("error");
      if (out.status === "error") {
        expect(out.errors?.attachment?.[0]).toMatch(/Unsupported file type/);
      }
    });

    function bytes(arr: number[]): Uint8Array<ArrayBuffer> {
      const buf = new ArrayBuffer(arr.length);
      new Uint8Array(buf).set(arr);
      return new Uint8Array(buf);
    }

    const acceptedFixtures: ReadonlyArray<
      readonly [string, string, Uint8Array<ArrayBuffer>]
    > = [
      [
        "application/pdf",
        "cv.pdf",
        bytes(Array.from("%PDF-1.4 hello", (c) => c.charCodeAt(0))),
      ],
      ["image/jpeg", "shot.jpg", bytes([0xff, 0xd8, 0xff, 0xe0])],
      [
        "image/png",
        "shot.png",
        bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ],
      [
        "application/msword",
        "letter.doc",
        bytes([0xd0, 0xcf, 0x11, 0xe0]),
      ],
      [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "letter.docx",
        bytes([0x50, 0x4b, 0x03, 0x04]),
      ],
    ];
    it.each(acceptedFixtures)(
      "accepts %s attachments and forwards them with the right MIME",
      async (mime, filename, payload) => {
        process.env.RESEND_API_KEY = "rs-key";
        const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
          new Response(JSON.stringify({ id: "msg_x" }), { status: 200 }),
        );
        const file = new File([payload], filename, { type: mime });
        const out = await submitContact(
          { status: "idle" },
          fdWithAttachment(
            {
              name: "Eduard",
              email: "fischer_eduard@yahoo.com",
              message: "Long enough message to clear the validator.",
            },
            file,
          ),
        );
        expect(out.status).toBe("ok");
        const body = JSON.parse(
          (fetchMock.mock.calls[0][1] as RequestInit).body as string,
        );
        expect(body.attachments).toHaveLength(1);
        expect(body.attachments[0].filename).toBe(filename);
        expect(body.attachments[0].content_type).toBe(mime);
        expect(body.attachments[0].content).toBe(
          Buffer.from(payload).toString("base64"),
        );
      },
    );

    it("validates a 1-byte stub for every accepted MIME type via the schema", async () => {
      vi.spyOn(console, "info").mockImplementation(() => {});
      const accepted = [
        ["application/pdf", "a.pdf"],
        ["image/jpeg", "a.jpg"],
        ["image/png", "a.png"],
        ["application/msword", "a.doc"],
        [
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "a.docx",
        ],
      ] as const;
      for (const [type, name] of accepted) {
        const stub = new File([new Uint8Array(1)], name, { type });
        const out = await submitContact(
          { status: "idle" },
          fdWithAttachment(
            {
              name: "Eduard",
              email: "fischer_eduard@yahoo.com",
              message: "Long enough message to clear the validator.",
            },
            stub,
          ),
        );
        expect(out.status, `expected ${type} to be accepted`).toBe("ok");
      }
    });

    it("treats a zero-byte file input as no attachment", async () => {
      vi.spyOn(console, "info").mockImplementation(() => {});
      const empty = new File([], "", { type: "application/octet-stream" });
      const out = await submitContact(
        { status: "idle" },
        fdWithAttachment(
          {
            name: "Eduard",
            email: "fischer_eduard@yahoo.com",
            message: "Long enough message to clear the validator.",
          },
          empty,
        ),
      );
      expect(out.status).toBe("ok");
    });

    it("accepts a valid PDF and base64-encodes it for Resend", async () => {
      process.env.RESEND_API_KEY = "rs-key";
      const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ id: "msg_x" }), { status: 200 }),
      );
      const pdf = makeFile({
        name: "cv.pdf",
        type: "application/pdf",
        content: "%PDF-1.4 hello",
      });
      const out = await submitContact(
        { status: "idle" },
        fdWithAttachment(
          {
            name: "Eduard",
            email: "fischer_eduard@yahoo.com",
            message: "Long enough message to clear the validator.",
          },
          pdf,
        ),
      );
      expect(out.status).toBe("ok");
      const body = JSON.parse(
        (fetchMock.mock.calls[0][1] as RequestInit).body as string,
      );
      expect(body.attachments).toBeDefined();
      expect(body.attachments).toHaveLength(1);
      expect(body.attachments[0].filename).toBe("cv.pdf");
      expect(body.attachments[0].content_type).toBe("application/pdf");
      expect(body.attachments[0].content).toBe(
        Buffer.from("%PDF-1.4 hello").toString("base64"),
      );
    });

    it("does not attach anything when no file is provided", async () => {
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
      expect(body.attachments).toBeUndefined();
    });
  });
});
