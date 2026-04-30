import type { Meta, StoryObj } from '@storybook/react';
import { ThemeToggle } from './theme-toggle';

const meta = {
  title: 'Components/ThemeToggle',
  component: ThemeToggle,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A hydration-safe theme toggle button (Moon ↔ Sun). Reads the resolved theme from next-themes and switches between light and dark on click.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: { story: 'Default state — renders based on the current resolved theme.' },
    },
  },
};

export const LightMode: Story = {
  parameters: {
    nextjs: { appDirectory: true },
    backgrounds: { default: 'light' },
    docs: {
      description: { story: 'Toggle shown on a light background.' },
    },
  },
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: { story: 'Toggle shown on a dark background.' },
    },
  },
};
