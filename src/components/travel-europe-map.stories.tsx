import type { Meta, StoryObj } from '@storybook/react';
import { TravelEuropeMap } from './travel-europe-map';
import type { MapDestination, MapCity } from './travel-europe-map';

const MOCK_DESTINATIONS: MapDestination[] = [
  {
    country: 'Germany',
    slug: 'germany',
    centroid: { lat: 51.165691, lon: 10.451526 },
    cities: ['Berlin', 'Hamburg', 'Munich'],
    photoCount: 120,
    firstTripSlug: 'germany-2022-10',
  },
  {
    country: 'Denmark',
    slug: 'denmark',
    centroid: { lat: 56.26392, lon: 9.501785 },
    cities: ['Copenhagen', 'Aarhus', 'Odense'],
    photoCount: 95,
    firstTripSlug: 'denmark-2023-05',
  },
  {
    country: 'France',
    slug: 'france',
    centroid: { lat: 46.227638, lon: 2.213749 },
    cities: ['Paris', 'Lyon'],
    photoCount: 78,
    firstTripSlug: 'france-2023-08',
  },
  {
    country: 'Italy',
    slug: 'italy',
    centroid: { lat: 41.87194, lon: 12.56738 },
    cities: ['Rome', 'Florence', 'Venice'],
    photoCount: 110,
    firstTripSlug: 'italy-2022-06',
  },
  {
    country: 'Czech Republic',
    slug: 'czech-republic',
    centroid: { lat: 49.817492, lon: 15.472962 },
    cities: ['Prague'],
    photoCount: 45,
    firstTripSlug: 'czech-republic-2023-04',
  },
];

const MOCK_CITIES: MapCity[] = [
  { city: 'Berlin', country: 'Germany', slug: 'germany-berlin', photoCount: 60, lat: 52.520008, lon: 13.404954 },
  { city: 'Hamburg', country: 'Germany', slug: 'germany-hamburg', photoCount: 35, lat: 53.55108, lon: 9.99368 },
  { city: 'Copenhagen', country: 'Denmark', slug: 'denmark-copenhagen', photoCount: 50, lat: 55.676098, lon: 12.568337 },
  { city: 'Paris', country: 'France', slug: 'france-paris', photoCount: 78, lat: 48.856613, lon: 2.352222 },
  { city: 'Rome', country: 'Italy', slug: 'italy-rome', photoCount: 55, lat: 41.902782, lon: 12.496366 },
  { city: 'Prague', country: 'Czech Republic', slug: 'czech-republic-prague', photoCount: 45, lat: 50.075538, lon: 14.4378 },
];

const MOCK_TRIP_COUNTS: Record<string, number> = {
  Germany: 3,
  Denmark: 2,
  France: 2,
  Italy: 3,
  'Czech Republic': 1,
};

const meta = {
  title: 'Components/TravelEuropeMap',
  component: TravelEuropeMap,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'An interactive SVG map of Europe showing visited countries as a chloropleth and per-city dots. Supports two view modes: combined "Map" (chloropleth + dots) and "Destinations" (country pins only).',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TravelEuropeMap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    destinations: MOCK_DESTINATIONS,
    cities: MOCK_CITIES,
    tripCounts: MOCK_TRIP_COUNTS,
    initialView: 'map',
  },
};

export const DestinationsView: Story = {
  args: {
    destinations: MOCK_DESTINATIONS,
    cities: MOCK_CITIES,
    tripCounts: MOCK_TRIP_COUNTS,
    initialView: 'destinations',
  },
  parameters: {
    docs: {
      description: {
        story: 'Destinations view — shows country pins without the city overlay.',
      },
    },
  },
};

export const FewCountries: Story = {
  args: {
    destinations: MOCK_DESTINATIONS.slice(0, 2),
    cities: MOCK_CITIES.slice(0, 3),
    tripCounts: { Germany: 3, Denmark: 2 },
    initialView: 'map',
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal dataset with only two countries visited.',
      },
    },
  },
};
