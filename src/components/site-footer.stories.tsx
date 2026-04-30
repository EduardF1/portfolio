import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType, SVGProps } from 'react';
import { Mail } from 'lucide-react';
import NextLink from 'next/link';
import { GithubIcon, LinkedinIcon } from './icons';

/**
 * SiteFooter is an async React Server Component that calls getTranslations()
 * from next-intl/server, which requires a Next.js server runtime not available
 * in Storybook. This story renders an equivalent client-side shell to document
 * the footer's visual appearance and layout.
 */

type SocialItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;
  tooltip: string;
};

const socials: SocialItem[] = [
  {
    href: 'https://github.com/EduardF1',
    label: 'GitHub',
    icon: GithubIcon,
    tooltip: 'Visit my GitHub profile',
  },
  {
    href: 'https://www.linkedin.com/in/eduard-fischer-szava/',
    label: 'LinkedIn',
    icon: LinkedinIcon,
    tooltip: 'Visit my LinkedIn profile',
  },
  {
    href: 'mailto:fischer_eduard@yahoo.com',
    label: 'Send email',
    icon: Mail as unknown as ComponentType<SVGProps<SVGSVGElement> & { className?: string }>,
    tooltip: 'Send me an email',
  },
];

function SiteFooterShell() {
  return (
    <footer className="border-t border-border/60 mt-24">
      <div className="container-page flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-foreground-subtle">
          © {new Date().getFullYear()} Eduard Fischer-Szava · Aarhus, Denmark
          {' · '}
          <NextLink
            href="/privacy"
            title="Privacy policy"
            className="underline decoration-border underline-offset-4 hover:text-accent hover:decoration-accent"
          >
            Privacy
          </NextLink>
        </p>
        <div className="flex items-center gap-5">
          {socials.map(({ href, label, icon: Icon, tooltip }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              title={tooltip}
              className="text-foreground-subtle hover:text-accent transition-colors"
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              <Icon className="h-5 w-5" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

const meta = {
  title: 'Components/SiteFooter',
  component: SiteFooterShell,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The site footer with copyright, privacy link, and social icon links (GitHub, LinkedIn, Email). The actual `SiteFooter` component is an async RSC — this story renders an equivalent client-side shell.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SiteFooterShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: { story: 'Footer on a light background at desktop width.' },
    },
  },
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: { story: 'Footer on a dark background.' },
    },
  },
};
