"use server";

import { z } from "zod";

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

async function sendEmail(payload: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO ?? "fischer_eduard@yahoo.com";
  if (!apiKey) {
    // No email provider configured yet — log and succeed so dev flow continues.
    console.info("[contact] (no email provider) submission:", payload);
    return true;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Portfolio <noreply@eduardfischer.dev>",
      to,
      reply_to: payload.email,
      subject: payload.subject?.trim()
        ? `[Portfolio] ${payload.subject}`
        : "[Portfolio] New message",
      text: `From: ${payload.name} <${payload.email}>\n\n${payload.message}`,
    }),
  });
  if (!res.ok) {
    console.error("[contact] resend failed", res.status, await res.text());
    return false;
  }
  return true;
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

  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject") || undefined,
    message: formData.get("message"),
    "cf-turnstile-response":
      formData.get("cf-turnstile-response") || undefined,
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

  const sent = await sendEmail(parsed.data);
  if (!sent) {
    return {
      status: "error",
      message: "Could not send the message. Please try again or email directly.",
    };
  }

  return { status: "ok" };
}
