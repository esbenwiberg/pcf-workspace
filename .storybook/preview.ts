import type { Preview } from '@storybook/react';
import { withPowerAppsShell } from './decorators/withPowerAppsShell';

const preview: Preview = {
  decorators: [withPowerAppsShell],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'centered',
  },
  globalTypes: {
    pcfHostType: {
      description: 'PCF host context type',
      toolbar: {
        title: 'Host Type',
        icon: 'component',
        items: [
          { value: 'form', title: 'Model-driven Form' },
          { value: 'view', title: 'Model-driven View' },
          { value: 'canvas', title: 'Canvas App' },
          { value: 'bare', title: 'No Shell' },
        ],
        dynamicTitle: true,
      },
    },
    pcfWidth: {
      description: 'Container width',
      toolbar: {
        title: 'Width',
        icon: 'grow',
        items: [
          { value: '300', title: '300px (narrow)' },
          { value: '500', title: '500px (medium)' },
          { value: '800', title: '800px (wide)' },
          { value: '100%', title: 'Full width' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    pcfHostType: 'form',
    pcfWidth: '500',
  },
};

export default preview;
