/**
 * Constants shared between the contact server action and the contact form
 * client component. These live in a separate module because Next.js'
 * `"use server"` files may only export async functions — exporting non-async
 * values from `contact.ts` causes Next to wrap them in a server-action proxy,
 * which then breaks at the import site (e.g. `.join is not a function`).
 *
 * See: node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-server.md
 */

export const ATTACHMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5 MB
