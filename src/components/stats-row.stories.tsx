import type { Meta, StoryObj } from '@storybook/react';
import { StatsRow } from './stats-row';

const meta = {
  title: 'Components/StatsRow',
  component: StatsRow,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Four stat tiles displayed as a flex-wrap row: years of engineering, spoken languages, major projects shipped, and countries visited. Uses container queries to shift from 2-up to 4-up layout.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StatsRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'All four stats: 5+ years, 4 languages, 4 projects, 20+ countries.',
      },
    },
  },
};

export const WideViewport: Story = {
  parameters: {
    viewport: { defaultViewport: 'tablet' },
    docs: {
      description: { story: 'On wider viewports the stats display in a single 4-up row.' },
    },
  },
};

export const NarrowViewport: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile2' },
    docs: {
      description: { story: 'On mobile the stats wrap into two rows of two.' },
    },
  },
};
