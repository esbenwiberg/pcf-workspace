import type { StorybookConfig } from '@storybook/react-vite';
import path from 'path';

const config: StorybookConfig = {
  stories: ['../apps/*/src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@chromatic-com/storybook',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@workspace/ui': path.resolve(__dirname, '../packages/ui/src'),
      '@workspace/dataverse': path.resolve(__dirname, '../packages/dataverse/src'),
      '@workspace/pcf-context': path.resolve(__dirname, '../packages/pcf-context/src'),
      '@workspace/hooks': path.resolve(__dirname, '../packages/hooks/src'),
      '@workspace/test-utils': path.resolve(__dirname, '../packages/test-utils/src'),
      '@workspace/sample-app': path.resolve(__dirname, '../apps/sample-app/src'),
    };
    return config;
  },
};

export default config;
