import type { Meta, StoryObj } from '@storybook/react';
import { SectionHeading } from './section-heading';

const meta = {
  title: 'Components/SectionHeading',
  component: SectionHeading,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A section heading with an optional kicker label above, an optional info icon with tooltip, and support for h1/h2 levels.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SectionHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Selected case studies.',
  },
};

export const WithKicker: Story = {
  args: {
    kicker: 'Work',
    children: 'Selected case studies.',
  },
};

export const WithTooltip: Story = {
  args: {
    kicker: 'Open source',
    children: 'Public repositories',
    tooltip:
      'A live feed of my public GitHub repositories, updated automatically with the latest activity and pinned projects.',
  },
};

export const HeadingH1: Story = {
  args: {
    kicker: 'About',
    children: 'How I got here.',
    level: 'h1',
  },
};

export const WithId: Story = {
  args: {
    kicker: 'Technologies',
    children: 'Tools and languages.',
    id: 'technologies',
    tooltip: 'Background on a specific technology I work with.',
  },
};
