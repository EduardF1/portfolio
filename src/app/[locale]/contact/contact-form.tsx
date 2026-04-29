"use client";

import { useActionState, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  submitContact,
  ATTACHMENT_MIME_TYPES,
  type ContactState,
} from "@/app/actions/contact";
import { cn } from "@/lib/utils";

const initialState: ContactState = { status: "idle" };

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5 MB
const ATTACHMENT_ACCEPT = ATTACHMENT_MIME_TYPES.join(",");
const ATTACHMENT_MIME_SET: ReadonlySet<string> = new Set<string>(
  ATTACHMENT_MIME_TYPES,
);

export function ContactForm() {
  const t = useTranslations("contact.form");
  const [state, action, pending] = useActionState(submitContact, initialState);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (state.status === "ok") {
    return (
      <div className="rounded-lg border border-accent/40 bg-accent-soft/40 p-8">
        <p className="font-serif text-2xl text-foreground">
          {t("successTitle")}
        </p>
        <p className="mt-2">
          {t.rich("successBody", {
            email: () => (
              <a
                className="text-accent hover:underline"
                href="mailto:fischer_eduard@yahoo.com"
              >
                fischer_eduard@yahoo.com
              </a>
            ),
          })}
        </p>
      </div>
    );
  }

  const errors = state.status === "error" ? state.errors ?? {} : {};
  const serverAttachmentError = errors.attachment?.[0];
  const attachmentErrorText = attachmentError ?? serverAttachmentError ?? null;

  function handleAttachmentChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setAttachmentError(null);
      setAttachmentName(null);
      return;
    }
    if (!ATTACHMENT_MIME_SET.has(file.type)) {
      setAttachmentError(t("attachmentErrorType"));
      setAttachmentName(file.name);
      return;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setAttachmentError(t("attachmentErrorSize"));
      setAttachmentName(file.name);
      return;
    }
    setAttachmentError(null);
    setAttachmentName(file.name);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // Block submission if we already know the attachment is invalid client-side;
    // server-side validation still applies as a backstop.
    if (attachmentError) {
      e.preventDefault();
    }
  }

  return (
    <form
      action={action}
      onSubmit={handleSubmit}
      encType="multipart/form-data"
      className="space-y-5"
      noValidate
    >
      {/* Honeypot — visually hidden, off the tab order, ignored by screen
          readers. Bots filling every field will fill this; legitimate humans
          will not. The server action silently feigns success when filled. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      >
        <label htmlFor="contact-website">Website (leave empty)</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <Field
        label={t("name")}
        name="name"
        required
        autoComplete="name"
        error={errors.name?.[0]}
      />
      <Field
        label={t("email")}
        name="email"
        type="email"
        required
        autoComplete="email"
        error={errors.email?.[0]}
      />
      <Field
        label={t("subject")}
        name="subject"
        autoComplete="off"
        hint={t("subjectHint")}
        error={errors.subject?.[0]}
      />
      <Field
        label={t("message")}
        name="message"
        as="textarea"
        rows={6}
        required
        error={errors.message?.[0]}
      />

      {/* Optional attachment — max 5 MB. PDF, JPEG, PNG, or Word document. */}
      <div>
        <div className="flex items-baseline justify-between gap-4 mb-1.5">
          <label htmlFor="attachment" className="text-sm font-medium">
            {t("attachment")}
            <span className="ml-2 text-xs font-normal text-foreground-subtle">
              {t("attachmentHint")}
            </span>
          </label>
          {attachmentErrorText && (
            <span
              id="attachment-error"
              className="text-xs text-accent"
            >
              {attachmentErrorText}
            </span>
          )}
        </div>
        <input
          id="attachment"
          ref={fileInputRef}
          name="attachment"
          type="file"
          accept={ATTACHMENT_ACCEPT}
          onChange={handleAttachmentChange}
          aria-invalid={attachmentErrorText ? true : undefined}
          aria-errormessage={
            attachmentErrorText ? "attachment-error" : undefined
          }
          className={cn(
            "block w-full text-sm",
            "file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium",
            "hover:file:bg-accent-soft/40",
          )}
        />
        {attachmentName && !attachmentErrorText && (
          <p className="mt-1 text-xs text-foreground-subtle">
            {attachmentName}
          </p>
        )}
      </div>

      {/* Cloudflare Turnstile placeholder. When NEXT_PUBLIC_TURNSTILE_SITE_KEY is set,
          drop in <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
          plus a <div className="cf-turnstile" data-sitekey={...} /> here. */}

      {state.status === "error" && state.message && (
        <p className="text-sm text-accent">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending || attachmentError !== null}
        className={cn(
          "inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90",
          (pending || attachmentError !== null) &&
            "opacity-60 cursor-not-allowed",
        )}
      >
        {pending ? t("sending") : t("submit")}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  as,
  rows,
  required,
  autoComplete,
  hint,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  as?: "textarea";
  rows?: number;
  required?: boolean;
  autoComplete?: string;
  hint?: string;
  error?: string;
}) {
  const baseInput = cn(
    "w-full rounded-md border bg-background px-4 py-2.5 text-sm outline-none transition-colors",
    error
      ? "border-accent focus:ring-1 focus:ring-accent"
      : "border-border focus:border-accent focus:ring-1 focus:ring-ring",
  );

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 mb-1.5">
        <label htmlFor={name} className="text-sm font-medium">
          {label}
          {!required && hint && (
            <span className="ml-2 text-xs font-normal text-foreground-subtle">
              {hint}
            </span>
          )}
        </label>
        {error && <span className="text-xs text-accent">{error}</span>}
      </div>
      {as === "textarea" ? (
        <textarea
          id={name}
          name={name}
          required={required}
          rows={rows}
          className={cn(baseInput, "resize-y")}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          autoComplete={autoComplete}
          className={baseInput}
        />
      )}
    </div>
  );
}
