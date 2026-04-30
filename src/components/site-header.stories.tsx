import type { Meta, StoryObj } from '@storybook/react';
import { SiteHeader } from './site-header';

const meta = {
  title: 'Components/SiteHeader',
  component: SiteHeader,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The sticky top navigation bar with brand link, desktop inline nav, locale toggle, theme toggle, palette selector, and a hamburger menu for mobile widths.',
      },
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/',
        query: {},
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SiteHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: { story: 'Desktop viewport — inline nav links are visible.' },
    },
  },
};

export const OnWorkPage: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: { pathname: '/work', query: {} },
    },
    docs: {
      description: {
        story: 'Header when the active route is /work — the Work link appears highlighted.',
      },
    },
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'Mobile viewport — inline nav is hidden and the hamburger trigger is shown instead.',
      },
    },
  },
};
