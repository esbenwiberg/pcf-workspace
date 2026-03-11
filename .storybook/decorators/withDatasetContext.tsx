import React, { createContext, useContext } from 'react';
import type { Decorator } from '@storybook/react';
import {
  createDatasetContext,
  type DatasetContextOptions,
  type PcfDataset,
} from '@workspace/pcf-context';

const DatasetContextReact = createContext<PcfDataset | null>(null);

export function usePcfDatasetContext() {
  const ctx = useContext(DatasetContextReact);
  if (!ctx)
    throw new Error('usePcfDatasetContext must be used within withDatasetContext decorator');
  return ctx;
}

/**
 * Storybook decorator that provides a mock PCF dataset context.
 *
 * Usage in stories:
 * ```ts
 * export const GridView: Story = {
 *   decorators: [withDatasetContext({
 *     entityName: 'account',
 *     columns: [{ name: 'name', displayName: 'Name', isPrimary: true }],
 *     records: [{ accountid: '1', name: 'Contoso' }],
 *   })],
 * };
 * ```
 */
export function withDatasetContext(options: DatasetContextOptions): Decorator {
  return (Story) => {
    const dataset = createDatasetContext(options);
    return (
      <DatasetContextReact.Provider value={dataset}>
        <Story />
      </DatasetContextReact.Provider>
    );
  };
}
