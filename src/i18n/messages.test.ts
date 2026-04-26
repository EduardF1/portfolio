import { describe, it, expect } from "vitest";
import en from "../../messages/en.json";
import da from "../../messages/da.json";

type MessageNode = string | { [key: string]: MessageNode };

function flatten(node: MessageNode, prefix = ""): Record<string, string> {
  if (typeof node === "string") return { [prefix]: node };
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${k}` : k;
    Object.assign(out, flatten(v, path));
  }
  return out;
}

const flatEn = flatten(en as MessageNode);
const flatDa = flatten(da as MessageNode);

describe("messages/en.json + messages/da.json", () => {
  it("define identical key sets — no missing translations either way", () => {
    const enKeys = new Set(Object.keys(flatEn));
    const daKeys = new Set(Object.keys(flatDa));
    const onlyEn = [...enKeys].filter((k) => !daKeys.has(k));
    const onlyDa = [...daKeys].filter((k) => !enKeys.has(k));
    expect(onlyEn, "keys present in en.json but missing in da.json").toEqual([]);
    expect(onlyDa, "keys present in da.json but missing in en.json").toEqual([]);
  });

  it("hold no empty translation values", () => {
    const blanks: string[] = [];
    for (const [k, v] of Object.entries(flatEn)) if (!v.trim()) blanks.push(`en:${k}`);
    for (const [k, v] of Object.entries(flatDa)) if (!v.trim()) blanks.push(`da:${k}`);
    expect(blanks).toEqual([]);
  });

  it("hold no ICU placeholder mismatches between locales", () => {
    // ICU vars look like {name} or {count, plural, ...}. We compare the
    // set of variable names referenced in each pair so a dropped {count}
    // in da.json fails the test.
    const varRe = /\{(\w+)/g;
    const mismatched: string[] = [];
    for (const k of Object.keys(flatEn)) {
      const enVars = new Set(Array.from(flatEn[k]!.matchAll(varRe), (m) => m[1]));
      const daVars = new Set(Array.from((flatDa[k] ?? "").matchAll(varRe), (m) => m[1]));
      if (enVars.size !== daVars.size || [...enVars].some((v) => !daVars.has(v))) {
        mismatched.push(`${k}: en={${[...enVars].join(",")}} da={${[...daVars].join(",")}}`);
      }
    }
    expect(mismatched).toEqual([]);
  });

  it("cover the collection-page namespaces both locales render", () => {
    // Sanity: the namespaces wired up by feat/v1-i18n-sweep must exist
    // in both files. If any namespace got dropped on rebase/merge, this
    // catches it before the page 500s in production.
    const required = [
      "nav",
      "home",
      "work",
      "travel",
      "culinary",
      "recommends",
      "writing",
      "personal",
      "contact",
      "now",
      "myStory",
      "tooltips",
    ];
    const missing = required.filter(
      (ns) => !(ns in (en as Record<string, unknown>)) || !(ns in (da as Record<string, unknown>)),
    );
    expect(missing).toEqual([]);
  });
});
