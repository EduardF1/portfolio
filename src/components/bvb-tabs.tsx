"use client";

import {
  Children,
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type TabKey = "standings" | "fixtures" | "results";

const TABS: TabKey[] = ["standings", "fixtures", "results"];

const HASH_TO_TAB: Record<string, TabKey> = {
  "#standings": "standings",
  "#next": "fixtures",
  "#fixtures": "fixtures",
  "#results": "results",
};

const TAB_TO_HASH: Record<TabKey, string> = {
  standings: "#standings",
  fixtures: "#next",
  results: "#results",
};

type Props = {
  labels: Record<TabKey, string>;
  isMock: boolean;
  mockBadge: string;
  /** Children must be exactly three panels in order: standings, fixtures, results. */
  children: ReactNode;
};

// useSyncExternalStore subscription bits — kept outside the component so the
// reference is stable and React doesn't resubscribe on every render.
//
// We drive the active tab DIRECTLY from the URL hash via
// useSyncExternalStore. Click handlers call history.replaceState() and
// then dispatch a synthetic "hashchange" event so the store re-snapshots
// (the platform only fires hashchange for real navigations). This pattern
// avoids the react-hooks/set-state-in-effect lint warning entirely
// because we never call setState() inside a useEffect — React itself
// handles the SSR / client snapshot reconciliation for us.
function subscribeToHash(callback: () => void): () => void {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

function getHashSnapshot(): string {
  return typeof window === "undefined" ? "" : window.location.hash.toLowerCase();
}

function getServerSnapshot(): string {
  return "";
}

export function BvbTabs({ labels, isMock, mockBadge, children }: Props) {
  const panels = Children.toArray(children);

  const hash = useSyncExternalStore(
    subscribeToHash,
    getHashSnapshot,
    getServerSnapshot,
  );
  const active: TabKey = HASH_TO_TAB[hash] ?? "standings";

  // Tracks whether we should move keyboard focus to the active tab on next
  // render. We only do this when the user pressed an arrow key, not on
  // initial mount or hashchange (which would steal focus on page load).
  const moveFocus = useRef(false);
  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({
    standings: null,
    fixtures: null,
    results: null,
  });
  const reactId = useId();

  // After an arrow-key tab change, move focus to the newly active tab
  // (WAI-ARIA tab pattern). Plain clicks don't request focus movement.
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    tabRefs.current[active]?.focus();
  }, [active]);

  function selectTab(next: TabKey, opts?: { focus?: boolean }) {
    if (opts?.focus) moveFocus.current = true;
    if (typeof window === "undefined") return;
    const targetHash = TAB_TO_HASH[next];
    if (window.location.hash !== targetHash) {
      // history.replaceState avoids cluttering history with each tab
      // click while still being shareable. replaceState does NOT fire a
      // hashchange event natively, so we dispatch one ourselves to nudge
      // useSyncExternalStore into re-snapshotting the new hash.
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}${targetHash}`,
      );
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const idx = TABS.indexOf(active);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      selectTab(TABS[(idx + 1) % TABS.length], { focus: true });
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      selectTab(TABS[(idx - 1 + TABS.length) % TABS.length], { focus: true });
    } else if (e.key === "Home") {
      e.preventDefault();
      selectTab(TABS[0], { focus: true });
    } else if (e.key === "End") {
      e.preventDefault();
      selectTab(TABS[TABS.length - 1], { focus: true });
    }
  }

  return (
    <div data-testid="bvb-feed">
      {isMock && (
        <p
          data-testid="bvb-mock-badge"
          className="mb-3 inline-flex items-center rounded-full border border-dashed border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-foreground-subtle"
        >
          {mockBadge}
        </p>
      )}
      <div
        role="tablist"
        aria-label="Borussia Dortmund feed"
        onKeyDown={onKeyDown}
        className="flex flex-wrap gap-2 border-b border-border"
      >
        {TABS.map((tab) => {
          const selected = tab === active;
          return (
            <button
              key={tab}
              ref={(el) => {
                tabRefs.current[tab] = el;
              }}
              role="tab"
              type="button"
              id={`${reactId}-tab-${tab}`}
              aria-selected={selected}
              aria-controls={`${reactId}-panel-${tab}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectTab(tab)}
              data-tab={tab}
              data-active={selected || undefined}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
                selected
                  ? "border-accent font-semibold text-accent"
                  : "border-transparent text-foreground-muted hover:text-accent",
              )}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>
      {TABS.map((tab, i) => (
        <div
          key={tab}
          role="tabpanel"
          id={`${reactId}-panel-${tab}`}
          aria-labelledby={`${reactId}-tab-${tab}`}
          hidden={tab !== active}
          tabIndex={0}
          data-panel={tab}
          className="pt-6 focus-visible:outline-none"
        >
          {panels[i]}
        </div>
      ))}
    </div>
  );
}
