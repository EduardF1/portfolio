/**
 * Keyboard-shortcut blocker for the read-only CV viewer.
 *
 * Best-effort, not security: the goal is "deters casual copying". Inspecting
 * the canvas via DevTools is still possible — true client-side DRM does not
 * exist on the open web. Documented in the viewer's footnote.
 *
 * Allowed (for navigation):
 *   - ArrowLeft, ArrowRight, PageUp, PageDown, Home, End
 *
 * Blocked (with preventDefault):
 *   - Ctrl/Cmd + C (copy)
 *   - Ctrl/Cmd + S (save page)
 *   - Ctrl/Cmd + P (print)
 *   - Ctrl/Cmd + A (select all)
 *   - Ctrl/Cmd + U (view source)
 *   - Ctrl/Cmd + Shift + I (devtools)
 *   - F12 (devtools)
 */
export type KeyEventLike = {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  preventDefault: () => void;
  stopPropagation?: () => void;
};

/** Returns true if the event was blocked (preventDefault called). */
export function blockCopyShortcuts(e: KeyEventLike): boolean {
  const mod = e.ctrlKey || e.metaKey;
  const k = e.key.toLowerCase();

  // F12 — open DevTools
  if (k === "f12") {
    e.preventDefault();
    e.stopPropagation?.();
    return true;
  }

  // Ctrl+Shift+I — open DevTools (Chrome / Firefox / Edge)
  if (mod && e.shiftKey && k === "i") {
    e.preventDefault();
    e.stopPropagation?.();
    return true;
  }

  // Single-modifier shortcuts on c / s / p / a / u
  if (mod && !e.shiftKey) {
    if (k === "c" || k === "s" || k === "p" || k === "a" || k === "u") {
      e.preventDefault();
      e.stopPropagation?.();
      return true;
    }
  }

  return false;
}
