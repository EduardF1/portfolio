// No-op stub for `server-only` under Vitest. The real module is a
// runtime guard that throws when imported from a client bundle; in
// tests there is no such boundary, so we resolve it to an empty module.
export {};
