import { useState, useMemo, useEffect } from 'react';
import {
  Combobox,
  Option,
  makeStyles,
  tokens,
  Text,
  Persona,
} from '@fluentui/react-components';
import { BuildingRegular } from '@fluentui/react-icons';
import { useDebounce, useAsync } from '@workspace/hooks';
import { LoadingSpinner, ErrorBoundary } from '@workspace/ui';
import type { AccountPickerProps, Account } from './types';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    width: '100%',
  },
  combobox: {
    width: '100%',
  },
});

function AccountPickerInner({
  selectedAccountId,
  filter,
  disabled = false,
  onAccountSelected,
  dataverseClient,
}: AccountPickerProps) {
  const styles = useStyles();
  const [searchText, setSearchText] = useState('');
  const [initialized, setInitialized] = useState(false);
  const debouncedSearch = useDebounce(searchText, 300);

  const queryFilter = useMemo(() => {
    const parts: string[] = [];
    if (filter) parts.push(filter);
    if (debouncedSearch) {
      parts.push(`contains(name, '${debouncedSearch}')`);
    }
    return parts.join(' and ') || undefined;
  }, [filter, debouncedSearch]);

  const { data, loading, error } = useAsync(
    () =>
      dataverseClient.retrieveMultiple<Account>({
        entityType: 'account',
        select: ['accountid', 'name', 'emailaddress1', 'address1_city'],
        filter: queryFilter,
        top: 50,
        orderBy: 'name asc',
      }),
    [queryFilter],
  );

  const accounts = data?.entities ?? [];

  // Resolve selected account name on initial load
  useEffect(() => {
    if (!initialized && selectedAccountId && accounts.length > 0) {
      const selected = accounts.find((a) => a.accountid === selectedAccountId);
      if (selected) {
        setSearchText(selected.name);
      }
      setInitialized(true);
    }
  }, [initialized, selectedAccountId, accounts]);

  return (
    <div className={styles.root}>
      <Combobox
        className={styles.combobox}
        placeholder="Search accounts..."
        disabled={disabled}
        value={searchText}
        selectedOptions={selectedAccountId ? [selectedAccountId] : []}
        onInput={(e) => setSearchText((e.target as HTMLInputElement).value)}
        onOptionSelect={(_e, optionData) => {
          const id = optionData.optionValue ?? null;
          onAccountSelected?.(id);
          const selected = accounts.find((a) => a.accountid === id);
          if (selected) setSearchText(selected.name);
        }}
        freeform
      >
        {loading && (
          <Option key="__loading" value="" text="" disabled>
            <LoadingSpinner size="tiny" label="Searching..." />
          </Option>
        )}
        {error && (
          <Option key="__error" value="" text="" disabled>
            <Text style={{ color: tokens.colorPaletteRedForeground1 }}>
              Error: {error.message}
            </Text>
          </Option>
        )}
        {!loading &&
          !error &&
          accounts.map((account) => (
            <Option key={account.accountid} value={account.accountid} text={account.name}>
              <Persona
                name={account.name}
                secondaryText={account.address1_city ?? account.emailaddress1}
                avatar={{ icon: <BuildingRegular />, color: 'brand' }}
                size="small"
              />
            </Option>
          ))}
        {!loading && !error && accounts.length === 0 && (
          <Option key="__empty" value="" text="" disabled>
            <Text>No accounts found</Text>
          </Option>
        )}
      </Combobox>
    </div>
  );
}

export function AccountPicker(props: AccountPickerProps) {
  return (
    <ErrorBoundary>
      <AccountPickerInner {...props} />
    </ErrorBoundary>
  );
}
