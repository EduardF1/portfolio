import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";
import enMessagesRaw from "./messages/en.json";

const enMessages = enMessagesRaw as Record<string, unknown>;

function lookup(path: string): string {
  const parts = path.split(".");
  let cur: unknown = enMessages;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return path;
    }
  }
  return typeof cur === "string" ? cur : path;
}

function interpolate(template: string, values?: Record<string, unknown>): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    k in values ? String(values[k]) : `{${k}}`,
  );
}

vi.mock("next-intl", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useTranslations:
      (namespace?: string) =>
      (key: string, values?: Record<string, unknown>) => {
        const fullKey = namespace ? `${namespace}.${key}` : key;
        return interpolate(lookup(fullKey), values);
      },
    useLocale: () => "en",
  };
});

vi.mock("next-intl/server", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    getTranslations: async (namespace?: string) => (key: string, values?: Record<string, unknown>) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      return interpolate(lookup(fullKey), values);
    },
    getLocale: async () => "en",
    setRequestLocale: () => {},
  };
});
