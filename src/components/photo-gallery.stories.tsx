import type { Meta, StoryObj } from '@storybook/react';
import { PhotoGallery } from './photo-gallery';

const SAMPLE_PHOTOS = [
  { src: '/photos/trips/germany-2022-10/01.jpg', alt: 'Brandenburg Gate at dusk, Berlin' },
  { src: '/photos/trips/germany-2022-10/02.jpg', alt: 'Checkpoint Charlie, Berlin' },
  { src: '/photos/trips/germany-2022-10/03.jpg', alt: 'East Side Gallery mural, Berlin' },
  { src: '/photos/trips/romania-2024-06/01.jpg', alt: 'Old town square, Bucharest' },
  { src: '/photos/trips/romania-2024-06/02.jpg', alt: 'Palace of the Parliament, Bucharest' },
  { src: '/photos/trips/romania-2024-06/03.jpg', alt: 'Bran Castle at sunset, Brasov' },
];

const meta = {
  title: 'Components/PhotoGallery',
  component: PhotoGallery,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A responsive photo grid using Next.js Image with object-cover aspect-square tiles. Collapses to fewer columns when fewer photos are provided.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PhotoGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SmallGallery: Story = {
  args: {
    photos: SAMPLE_PHOTOS.slice(0, 3),
  },
};

export const FullGallery: Story = {
  args: {
    photos: SAMPLE_PHOTOS,
  },
};

export const SinglePhoto: Story = {
  args: {
    photos: SAMPLE_PHOTOS.slice(0, 1),
  },
};

export const Empty: Story = {
  args: {
    photos: [],
  },
  parameters: {
    docs: {
      description: { story: 'Returns null when no photos are provided.' },
    },
  },
};
