import { ImapFlow } from "imapflow";

/**
 * Live Yahoo IMAP helper for the contact-form e2e round-trip.
 *
 * Why a helper and not the email MCP directly: Playwright tests run
 * out-of-process and can't call MCP tools. We re-use the same Yahoo
 * IMAP credentials the MCP uses (Yahoo IMAP requires an app-specific
 * password — main account password will not work).
 *
 * Required env vars (only when RUN_LIVE_EMAIL=1):
 *   - YAHOO_IMAP_USER  → e.g. fischer_eduard@yahoo.com
 *   - YAHOO_IMAP_APP_PASS  → 16-char Yahoo app password (no spaces)
 *
 * Optional:
 *   - YAHOO_IMAP_HOST  (default: imap.mail.yahoo.com)
 *   - YAHOO_IMAP_PORT  (default: 993)
 *   - YAHOO_IMAP_FOLDER (default: INBOX)
 */

export type YahooImapCreds = {
  user: string;
  pass: string;
  host?: string;
  port?: number;
  folder?: string;
};

export type WaitForEmailOptions = {
  /** Subject substring (case-insensitive) the message must contain. */
  subject: string;
  /** Body substring (case-insensitive) the message must contain. */
  bodySnippet?: string;
  /** Maximum wait window in milliseconds. Defaults to 60_000. */
  timeoutMs?: number;
  /** Poll interval in milliseconds. Defaults to 5_000. */
  pollIntervalMs?: number;
  /** Only consider messages received at or after this Date. */
  since?: Date;
};

export type WaitForEmailResult = {
  uid: number;
  subject: string;
  from: string | null;
  date: Date | null;
};

export function readYahooCredsFromEnv(): YahooImapCreds | null {
  const user = process.env.YAHOO_IMAP_USER;
  const pass = process.env.YAHOO_IMAP_APP_PASS;
  if (!user || !pass) return null;
  return {
    user,
    pass,
    host: process.env.YAHOO_IMAP_HOST ?? "imap.mail.yahoo.com",
    port: process.env.YAHOO_IMAP_PORT
      ? Number(process.env.YAHOO_IMAP_PORT)
      : 993,
    folder: process.env.YAHOO_IMAP_FOLDER ?? "INBOX",
  };
}

/**
 * Polls a Yahoo IMAP folder until a message matching the given subject
 * (and optional body snippet) appears, or until the timeout elapses.
 *
 * Resolves with metadata about the matched message; rejects on
 * timeout. Caller is responsible for any inbox cleanup afterwards.
 */
export async function waitForYahooEmail(
  creds: YahooImapCreds,
  options: WaitForEmailOptions,
): Promise<WaitForEmailResult> {
  const {
    subject,
    bodySnippet,
    timeoutMs = 60_000,
    pollIntervalMs = 5_000,
    since,
  } = options;

  const deadline = Date.now() + timeoutMs;
  const folder = creds.folder ?? "INBOX";
  // Default `since` to ~5 minutes before the wait started so we don't
  // pick up an unrelated older message that happens to share the
  // subject string. The test always uses a unique timestamped subject
  // so this is mostly belt-and-braces.
  const sinceDate = since ?? new Date(Date.now() - 5 * 60_000);
  const subjectLc = subject.toLowerCase();
  const bodyLc = bodySnippet?.toLowerCase();

  let lastErr: unknown = null;

  while (Date.now() < deadline) {
    const client = new ImapFlow({
      host: creds.host ?? "imap.mail.yahoo.com",
      port: creds.port ?? 993,
      secure: true,
      auth: { user: creds.user, pass: creds.pass },
      logger: false,
    });

    try {
      await client.connect();
      const lock = await client.getMailboxLock(folder);
      try {
        // IMAP SEARCH: subject + since. Body is verified post-fetch
        // because Yahoo's BODY search is unreliable for inline text.
        const uids = (await client.search(
          { subject, since: sinceDate },
          { uid: true },
        )) || [];

        if (uids.length > 0) {
          for (const uid of uids) {
            const msg = await client.fetchOne(
              String(uid),
              { envelope: true, source: !!bodyLc },
              { uid: true },
            );
            if (!msg) continue;
            const envSubject = msg.envelope?.subject ?? "";
            if (!envSubject.toLowerCase().includes(subjectLc)) continue;
            if (bodyLc) {
              const src = msg.source?.toString("utf8").toLowerCase() ?? "";
              if (!src.includes(bodyLc)) continue;
            }
            return {
              uid: Number(uid),
              subject: envSubject,
              from: msg.envelope?.from?.[0]?.address ?? null,
              date: msg.envelope?.date ?? null,
            };
          }
        }
      } finally {
        lock.release();
        await client.logout().catch(() => {
          /* ignore — already disconnected */
        });
      }
    } catch (err) {
      lastErr = err;
      try {
        await client.logout();
      } catch {
        /* ignore */
      }
    }

    if (Date.now() + pollIntervalMs >= deadline) break;
    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }

  const reason =
    lastErr instanceof Error ? `: ${lastErr.message}` : "";
  throw new Error(
    `Timed out after ${timeoutMs}ms waiting for Yahoo email with subject "${subject}"${reason}`,
  );
}
