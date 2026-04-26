import { describe, it, expect, vi } from "vitest";
import { blockCopyShortcuts, type KeyEventLike } from "./cv-viewer-keyblock";

function ev(partial: Partial<KeyEventLike> & { key: string }): KeyEventLike {
  return {
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...partial,
  };
}

describe("blockCopyShortcuts", () => {
  it("blocks Ctrl+C", () => {
    const e = ev({ key: "c", ctrlKey: true });
    expect(blockCopyShortcuts(e)).toBe(true);
    expect(e.preventDefault).toHaveBeenCalled();
  });

  it("blocks Cmd+C (macOS)", () => {
    const e = ev({ key: "c", metaKey: true });
    expect(blockCopyShortcuts(e)).toBe(true);
    expect(e.preventDefault).toHaveBeenCalled();
  });

  it("blocks Ctrl+S, Ctrl+P, Ctrl+A, Ctrl+U", () => {
    for (const key of ["s", "p", "a", "u"]) {
      const e = ev({ key, ctrlKey: true });
      expect(blockCopyShortcuts(e), `Ctrl+${key.toUpperCase()}`).toBe(true);
      expect(e.preventDefault).toHaveBeenCalled();
    }
  });

  it("blocks F12", () => {
    const e = ev({ key: "F12" });
    expect(blockCopyShortcuts(e)).toBe(true);
    expect(e.preventDefault).toHaveBeenCalled();
  });

  it("blocks Ctrl+Shift+I", () => {
    const e = ev({ key: "I", ctrlKey: true, shiftKey: true });
    expect(blockCopyShortcuts(e)).toBe(true);
    expect(e.preventDefault).toHaveBeenCalled();
  });

  it("does NOT block plain ArrowLeft / ArrowRight (used for navigation)", () => {
    const left = ev({ key: "ArrowLeft" });
    const right = ev({ key: "ArrowRight" });
    expect(blockCopyShortcuts(left)).toBe(false);
    expect(blockCopyShortcuts(right)).toBe(false);
    expect(left.preventDefault).not.toHaveBeenCalled();
    expect(right.preventDefault).not.toHaveBeenCalled();
  });

  it("does NOT block plain typing (e.g. just 'c' without modifier)", () => {
    const e = ev({ key: "c" });
    expect(blockCopyShortcuts(e)).toBe(false);
    expect(e.preventDefault).not.toHaveBeenCalled();
  });

  it("does NOT block Ctrl+Shift+C (we only want to swallow the copy shortcut, not Chrome's element-picker)", () => {
    // Intentional: we only block the single-modifier copy/save/print/select-all/view-source set.
    // Ctrl+Shift+C still falls through to the browser. This is acceptable —
    // the point is to deter casual copying, not to fight DevTools.
    const e = ev({ key: "c", ctrlKey: true, shiftKey: true });
    expect(blockCopyShortcuts(e)).toBe(false);
  });

  it("is case-insensitive on the key letter", () => {
    const upper = ev({ key: "C", ctrlKey: true });
    expect(blockCopyShortcuts(upper)).toBe(true);
  });
});
