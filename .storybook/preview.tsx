import type { Preview, Decorator } from '@storybook/react';
import { NextIntlClientProvider } from 'next-intl';
import React from 'react';
import '../src/app/globals.css';
import messages from '../messages/en.json';

const withNextIntl: Decorator = (Story) => (
  <NextIntlClientProvider locale="en" messages={messages}>
    <Story />
  </NextIntlClientProvider>
);

const preview: Preview = {
  decorators: [withNextIntl],
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/ } },
    nextjs: { appDirectory: true },
  },
};

export default preview;
