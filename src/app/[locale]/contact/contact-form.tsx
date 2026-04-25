"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { submitContact, type ContactState } from "@/app/actions/contact";
import { cn } from "@/lib/utils";

const initialState: ContactState = { status: "idle" };

export function ContactForm() {
  const t = useTranslations("contact.form");
  const [state, action, pending] = useActionState(submitContact, initialState);

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

  return (
    <form action={action} className="space-y-5" noValidate>
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

      {/* Cloudflare Turnstile placeholder. When NEXT_PUBLIC_TURNSTILE_SITE_KEY is set,
          drop in <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
          plus a <div className="cf-turnstile" data-sitekey={...} /> here. */}

      {state.status === "error" && state.message && (
        <p className="text-sm text-accent">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={cn(
          "inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90",
          pending && "opacity-60 cursor-not-allowed",
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
