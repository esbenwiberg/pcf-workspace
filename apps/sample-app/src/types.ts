import type { IDataverseClient } from '@workspace/dataverse';

export interface Account {
  accountid: string;
  name: string;
  emailaddress1?: string;
  revenue?: number;
  address1_city?: string;
}

export interface AccountPickerProps {
  /** Currently selected account ID */
  selectedAccountId?: string;
  /** OData filter to apply to account query */
  filter?: string;
  /** Whether the control is disabled */
  disabled?: boolean;
  /** Callback when user selects an account */
  onAccountSelected?: (accountId: string | null) => void;
  /** Dataverse client implementation (injected) */
  dataverseClient: IDataverseClient;
}
