import type { Meta, StoryObj } from '@storybook/react';
import { PagePlaceholder } from './page-placeholder';

const meta = {
  title: 'Components/PagePlaceholder',
  component: PagePlaceholder,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A full-section placeholder shown while page content is still being authored. Displays a kicker, heading, description, and a "Content arriving soon" badge.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PagePlaceholder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    kicker: 'Now',
    title: 'What I\'m focused on right now.',
    description:
      'A snapshot of what has my attention: work, study, side bets, reading. Updated every month or two.',
  },
};

export const WithTitle: Story = {
  args: {
    kicker: 'Culinary',
    title: 'Notes from the table.',
    description:
      'Dishes that earned the trip. Short tasting notes, where they were eaten, and whether I would order them again.',
  },
};

export const MinimalKicker: Story = {
  args: {
    kicker: 'Coming soon',
    title: 'Page under construction.',
    description: 'This section is being prepared. Check back soon.',
  },
};
