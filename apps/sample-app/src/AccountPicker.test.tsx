import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@workspace/test-utils';
import { MockDataverseClient } from '@workspace/dataverse';
import type { IDataverseClient } from '@workspace/dataverse';
import { AccountPicker } from './AccountPicker';

const mockAccounts = [
  {
    accountid: '1',
    name: 'Contoso Ltd',
    emailaddress1: 'info@contoso.com',
    address1_city: 'Seattle',
  },
  {
    accountid: '2',
    name: 'Fabrikam Inc',
    emailaddress1: 'hello@fabrikam.com',
    address1_city: 'Portland',
  },
  {
    accountid: '3',
    name: 'Adventure Works',
    emailaddress1: 'contact@aw.com',
    address1_city: 'Denver',
  },
];

function setup(overrides: Record<string, unknown> = {}) {
  const client = new MockDataverseClient({ entities: { account: mockAccounts } });
  const onAccountSelected = vi.fn();
  const user = userEvent.setup();

  const result = renderWithProviders(
    <AccountPicker
      dataverseClient={client}
      onAccountSelected={onAccountSelected}
      {...overrides}
    />,
  );

  return { ...result, client, onAccountSelected, user };
}

describe('AccountPicker', () => {
  it('renders a combobox', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  it('shows accounts after initial load', async () => {
    const { user } = setup();
    const combobox = screen.getByRole('combobox');
    await user.click(combobox);

    await waitFor(() => {
      expect(screen.getByText('Contoso Ltd')).toBeInTheDocument();
      expect(screen.getByText('Fabrikam Inc')).toBeInTheDocument();
      expect(screen.getByText('Adventure Works')).toBeInTheDocument();
    });
  });

  it('is disabled when disabled prop is true', async () => {
    setup({ disabled: true });
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeDisabled();
    });
  });

  it('calls onAccountSelected when an account is picked', async () => {
    const { user, onAccountSelected } = setup();
    const combobox = screen.getByRole('combobox');
    await user.click(combobox);

    await waitFor(() => {
      expect(screen.getByText('Contoso Ltd')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Contoso Ltd'));

    expect(onAccountSelected).toHaveBeenCalledWith('1');
  });

  it('filters accounts when user types a search term', async () => {
    const { user } = setup();
    const combobox = screen.getByRole('combobox');

    // Type a search term — debounce is 300ms
    await user.click(combobox);
    await user.type(combobox, 'contoso');

    await waitFor(() => {
      expect(screen.getByText('Contoso Ltd')).toBeInTheDocument();
    });

    // The mock client now filters via contains(name, 'contoso')
    // so only Contoso should remain
    await waitFor(() => {
      expect(screen.queryByText('Fabrikam Inc')).not.toBeInTheDocument();
      expect(screen.queryByText('Adventure Works')).not.toBeInTheDocument();
    });
  });

  it('shows "No accounts found" when results are empty', async () => {
    const emptyClient = new MockDataverseClient();
    const { user } = setup({ dataverseClient: emptyClient });
    const combobox = screen.getByRole('combobox');
    await user.click(combobox);

    await waitFor(() => {
      expect(screen.getByText('No accounts found')).toBeInTheDocument();
    });
  });

  it('shows error message when the API call fails', async () => {
    const errorClient: IDataverseClient = {
      retrieveMultiple: () => Promise.reject(new Error('Network error')),
      retrieve: () => Promise.reject(new Error('Network error')),
      create: () => Promise.reject(new Error('Network error')),
      update: () => Promise.reject(new Error('Network error')),
      delete: () => Promise.reject(new Error('Network error')),
      getEntityMetadata: () => Promise.reject(new Error('Network error')),
      getOptionSet: () => Promise.reject(new Error('Network error')),
    };

    const { user } = setup({ dataverseClient: errorClient });
    const combobox = screen.getByRole('combobox');
    await user.click(combobox);

    await waitFor(() => {
      expect(screen.getByText('Error: Network error')).toBeInTheDocument();
    });
  });

  it('populates combobox text when selectedAccountId is provided', async () => {
    setup({ selectedAccountId: '1' });

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toHaveValue('Contoso Ltd');
    });
  });
});
