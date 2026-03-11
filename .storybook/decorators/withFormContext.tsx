import React, { createContext, useContext } from 'react';
import type { Decorator } from '@storybook/react';
import {
  createFormContext,
  type FormContextOptions,
  type PcfContext,
  type PcfProperty,
} from '@workspace/pcf-context';

const FormContextReact = createContext<PcfContext<Record<string, PcfProperty>> | null>(null);

export function usePcfFormContext() {
  const ctx = useContext(FormContextReact);
  if (!ctx) throw new Error('usePcfFormContext must be used within withFormContext decorator');
  return ctx;
}

/**
 * Storybook decorator that provides a mock PCF form context.
 *
 * Usage in stories:
 * ```ts
 * export const Default: Story = {
 *   decorators: [withFormContext({ parameters: { selectedAccountId: 'abc' } })],
 * };
 * ```
 */
export function withFormContext(options?: FormContextOptions): Decorator {
  return (Story) => {
    const ctx = createFormContext(options);
    return (
      <FormContextReact.Provider value={ctx}>
        <Story />
      </FormContextReact.Provider>
    );
  };
}
