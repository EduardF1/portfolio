import type { Meta, StoryObj } from '@storybook/react';
import { TechChip } from './tech-chip';

/**
 * TechChip renders a pill-shaped filter link for a technology slug. When the
 * tech maps to a GitHub language with demo repos, it also shows an inline
 * "demo ↗" badge with a hover popover listing those repos.
 *
 * The component calls `findTech(slug)` at render time — slugs that exist in
 * the tech registry (src/lib/tech.ts) will render; unknown slugs return null.
 */
const meta = {
  title: 'Components/TechChip',
  component: TechChip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A tech filter chip linking to /work?tech=<slug>#technologies. When the tech has demo repos, a "demo ↗" badge with popover is shown inline.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TechChip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A common chip with no demo repos (plain link only). */
export const Default: Story = {
  args: { slug: 'typescript' },
};

export const DotNet: Story = {
  args: { slug: 'dotnet' },
  parameters: {
    docs: { description: { story: '.NET chip — typically has demo repos attached.' } },
  },
};

export const React: Story = {
  args: { slug: 'react' },
};

export const WithDataTechSlug: Story = {
  name: 'With data-tech-slug attribute',
  args: { slug: 'typescript', 'data-tech-slug': 'typescript' },
  parameters: {
    docs: {
      description: {
        story: 'The `data-tech-slug` prop is forwarded for test selectors.',
      },
    },
  },
};

export const List: Story = {
  args: { slug: 'typescript' },
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(['typescript', 'react', 'dotnet', 'nextjs', 'tailwind'] as const).map((slug) => (
        <TechChip key={slug} slug={slug} />
      ))}
    </div>
  ),
  parameters: {
    docs: { description: { story: 'A row of chips as they appear inside role/project sections.' } },
  },
};
