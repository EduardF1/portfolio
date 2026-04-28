import "server-only";
import rehypePrettyCode, {
  type Options as RehypePrettyCodeOptions,
} from "rehype-pretty-code";
import type { PluggableList } from "unified";

/**
 * Shared MDX options for next-mdx-remote/rsc.
 *
 * Adds Shiki-based syntax highlighting via rehype-pretty-code. We render a
 * single HTML output that carries CSS variables for two themes (light + dark),
 * and let next-themes flip between them by toggling the `.dark` class on
 * <html>. That keeps SSR deterministic and avoids re-rendering MDX when the
 * user changes theme.
 *
 * Theme pairing:
 *   - light: `min-light`   (warm, calm — pairs with mountain-navy + woodsy)
 *   - dark:  `night-owl`   (high-contrast cool blues — readable in dark mode)
 *
 * `keepBackground: false` strips Shiki's bg colour so our `bg-surface` shell
 * (set in globals.css) wins. Token colours come through as inline styles
 * keyed off `--shiki-light` / `--shiki-dark` CSS vars (see globals.css).
 */
const prettyCodeOptions: RehypePrettyCodeOptions = {
  theme: {
    light: "min-light",
    dark: "night-owl",
  },
  keepBackground: false,
  defaultLang: {
    block: "plaintext",
    inline: "plaintext",
  },
};

const rehypePlugins: PluggableList = [[rehypePrettyCode, prettyCodeOptions]];

export const mdxOptions = {
  mdxOptions: {
    rehypePlugins,
  },
};
