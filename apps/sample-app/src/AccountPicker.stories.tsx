import type { Meta, StoryObj } from '@storybook/react';
import { MockDataverseClient } from '@workspace/dataverse';
import type { IDataverseClient } from '@workspace/dataverse';
import { mockAccounts } from '@workspace/test-utils';
import { AccountPicker } from './AccountPicker';

const mockClient = new MockDataverseClient({
  entities: { account: mockAccounts },
});

const emptyClient = new MockDataverseClient();

const slowClient = new MockDataverseClient({
  entities: { account: mockAccounts },
  latency: 2000,
});

/** Client that throws on every call */
const errorClient: IDataverseClient = {
  retrieveMultiple: () => Promise.reject(new Error('Network error: Failed to fetch')),
  retrieve: () => Promise.reject(new Error('Network error: Failed to fetch')),
  create: () => Promise.reject(new Error('Network error: Failed to fetch')),
  update: () => Promise.reject(new Error('Network error: Failed to fetch')),
  delete: () => Promise.reject(new Error('Network error: Failed to fetch')),
  getEntityMetadata: () => Promise.reject(new Error('Network error: Failed to fetch')),
  getOptionSet: () => Promise.reject(new Error('Network error: Failed to fetch')),
};

const meta = {
  title: 'Apps/AccountPicker',
  component: AccountPicker,
  tags: ['autodocs'],
  args: {
    dataverseClient: mockClient,
    onAccountSelected: () => {},
  },
  argTypes: {
    dataverseClient: { table: { disable: true } },
    selectedAccountId: { control: 'text' },
    filter: { control: 'text' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof AccountPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default state — shows all mock accounts */
export const Default: Story = {};

/** Pre-selected account */
export const WithSelection: Story = {
  args: {
    selectedAccountId: '00000000-0000-0000-0001-000000000001',
  },
};

/** Disabled state */
export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

/** Empty state — no accounts returned */
export const EmptyResults: Story = {
  args: {
    dataverseClient: emptyClient,
  },
};

/** Slow loading — simulates network latency */
export const SlowLoading: Story = {
  args: {
    dataverseClient: slowClient,
  },
};

/** Error state — API call fails */
export const ErrorState: Story = {
  args: {
    dataverseClient: errorClient,
  },
};
