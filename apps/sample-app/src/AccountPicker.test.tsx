import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@workspace/test-utils';
import { MockDataverseClient } from '@workspace/dataverse';
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

function setup(overrides = {}) {
  const client = new MockDataverseClient({ entities: { account: mockAccounts } });
  const onAccountSelected = vi.fn();

  const result = renderWithProviders(
    <AccountPicker
      dataverseClient={client}
      onAccountSelected={onAccountSelected}
      {...overrides}
    />,
  );

  return { ...result, client, onAccountSelected };
}

describe('AccountPicker', () => {
  it('renders without crashing', () => {
    setup();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('shows accounts when opened', async () => {
    setup();
    const combobox = screen.getByRole('combobox');
    await userEvent.click(combobox);

    await waitFor(() => {
      expect(screen.getByText('Contoso Ltd')).toBeInTheDocument();
    });
  });

  it('is disabled when disabled prop is true', () => {
    setup({ disabled: true });
    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});
