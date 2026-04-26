// Vitest stub for `import "server-only"`. The real module throws when
// imported in client/test bundles, but our server modules need to be
// reachable from jsdom tests. This intentional no-op replaces it.
export {};
