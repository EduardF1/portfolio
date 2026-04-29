"use server";

import { z } from "zod";
import {
  ATTACHMENT_MIME_TYPES,
  MAX_ATTACHMENT_BYTES,
} from "./contact-constants";

// Vercel body cap is 4.5 MB; the form-level ceiling is 4 MB. The 5 MB
// validator size remains as a defence-in-depth backstop.

const ATTACHMENT_MIME_SET = new Set<string>(ATTACHMENT_MIME_TYPES);

const attachmentSchema = z
  .instanceof(File)
  .optional()
  .refine((f) => !f || f.size <= MAX_ATTACHMENT_BYTES, "Too big")
  .refine(
    (f) => !f || ATTACHMENT_MIME_SET.has(f.type),
    "Unsupported file type",
  );

const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Enter a valid email"),
  subject: z.string().max(150).optional(),
  message: z
    .string()
    .min(10, "Message should be at least 10 characters")
    .max(5000),
  // Cloudflare Turnstile token — added once site is wired up.
  "cf-turnstile-response": z.string().optional(),
  attachment: attachmentSchema,
});

export type ContactState =
  | { status: "idle" }
  | { status: "ok" }
  | { status: "error"; errors?: Record<string, string[] | undefined>; message?: string };

async function verifyTurnstile(token: string | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not yet configured — let through in dev
  if (!token) return false;
  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    },
  );
  if (!res.ok) return false;
  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}

type EmailAttachment = {
  filename: string;
  content: string;
  content_type?: string;
};

async function sendEmail(payload: {
  name: string;
  email: string;
  subject?: string;
  message: string;
  attachment?: EmailAttachment;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO ?? "fischer_eduard@yahoo.com";
  if (!apiKey) {
    // No email provider configured yet — log and succeed so dev flow continues.
    console.info("[contact] (no email provider) submission:", {
      ...payload,
      attachment: payload.attachment
        ? {
            filename: payload.attachment.filename,
            bytes: payload.attachment.content.length,
          }
        : undefined,
    });
    return true;
  }
  const body: Record<string, unknown> = {
    from: "Portfolio <noreply@eduardfischer.dev>",
    to,
    reply_to: payload.email,
    subject: payload.subject?.trim()
      ? `[Portfolio] ${payload.subject}`
      : "[Portfolio] New message",
    text: `From: ${payload.name} <${payload.email}>\n\n${payload.message}`,
  };
  if (payload.attachment) {
    body.attachments = [
      {
        filename: payload.attachment.filename,
        content: payload.attachment.content,
        ...(payload.attachment.content_type
          ? { content_type: payload.attachment.content_type }
          : {}),
      },
    ];
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error("[contact] resend failed", res.status, await res.text());
    return false;
  }
  return true;
}

function defaultFilenameFor(mime: string): string {
  switch (mime) {
    case "application/pdf":
      return "attachment.pdf";
    case "image/jpeg":
      return "attachment.jpg";
    case "image/png":
      return "attachment.png";
    case "application/msword":
      return "attachment.doc";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return "attachment.docx";
    default:
      return "attachment";
  }
}

async function fileToBase64Attachment(
  file: File,
): Promise<EmailAttachment> {
  const buf = Buffer.from(await file.arrayBuffer());
  return {
    filename: file.name || defaultFilenameFor(file.type),
    content: buf.toString("base64"),
    content_type: file.type || undefined,
  };
}

export async function submitContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // Honeypot: legitimate humans never see or fill this field. If it has a
  // value, silently feign success so bots don't learn the trap.
  const honeypot = formData.get("website");
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return { status: "ok" };
  }

  // The attachment field is a File when present; an empty file input
  // surfaces as a zero-byte File with an empty name, which we treat as
  // "no attachment" so Zod's optional() applies.
  const attachmentRaw = formData.get("attachment");
  let attachment: File | undefined;
  if (attachmentRaw instanceof File && attachmentRaw.size > 0) {
    attachment = attachmentRaw;
  }

  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject") || undefined,
    message: formData.get("message"),
    "cf-turnstile-response":
      formData.get("cf-turnstile-response") || undefined,
    attachment,
  };
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const captchaOk = await verifyTurnstile(parsed.data["cf-turnstile-response"]);
  if (!captchaOk) {
    return { status: "error", message: "Captcha verification failed." };
  }

  const emailAttachment = parsed.data.attachment
    ? await fileToBase64Attachment(parsed.data.attachment)
    : undefined;

  const sent = await sendEmail({
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
    attachment: emailAttachment,
  });
  if (!sent) {
    return {
      status: "error",
      message: "Could not send the message. Please try again or email directly.",
    };
  }

  return { status: "ok" };
}
