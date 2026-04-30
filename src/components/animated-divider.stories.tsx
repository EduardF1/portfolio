import type { Meta, StoryObj } from '@storybook/react';
import { AnimatedDivider } from './animated-divider';

const meta = {
  title: 'Components/AnimatedDivider',
  component: AnimatedDivider,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A subtle animated gradient line that sweeps in when scrolled into view. Purely decorative — hidden from assistive technology.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AnimatedDivider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DarkBackground: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
    docs: { description: { story: 'On a dark background the accent sweep is more visible.' } },
  },
};
