import type { Meta, StoryObj } from '@storybook/react';
import { MockDataverseClient } from '@workspace/dataverse';
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
