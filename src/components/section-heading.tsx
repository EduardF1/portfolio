import { Info } from "lucide-react";

type Props = {
  kicker?: string;
  children: React.ReactNode;
  tooltip?: string;
  id?: string;
  level?: "h1" | "h2";
  headingClassName?: string;
};

export function SectionHeading({
  kicker,
  children,
  tooltip,
  id,
  level = "h2",
  headingClassName,
}: Props) {
  const Heading = level;
  const ariaLabel = `What is ${kicker || "this section"}?`;
  const baseHeadingClass = kicker ? "mt-4" : "";
  const mergedHeadingClass = [baseHeadingClass, headingClassName ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      {kicker && (
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-subtle">
          {kicker}
        </p>
      )}
      <Heading id={id} className={mergedHeadingClass || undefined}>
        <span className="inline-flex items-baseline gap-2">
          <span>{children}</span>
          {tooltip && (
            <span className="group relative inline-flex">
              <button
                type="button"
                aria-label={ariaLabel}
                className="inline-flex h-4 w-4 items-center justify-center text-foreground-subtle transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none"
              >
                <Info className="h-4 w-4" aria-hidden="true" />
              </button>
              <span
                role="tooltip"
                className="pointer-events-none absolute left-6 top-full z-10 mt-2 max-w-[280px] rounded-md bg-foreground px-3 py-2 text-xs font-normal normal-case tracking-normal text-background opacity-0 shadow transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
              >
                {tooltip}
              </span>
            </span>
          )}
        </span>
      </Heading>
    </div>
  );
}
