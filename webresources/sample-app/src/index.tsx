import { createRoot } from 'react-dom/client';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { AccountPicker } from '@workspace/sample-app';
import { XrmDataverseClient } from '@workspace/dataverse';

/**
 * Parse D365's standard "data" query parameter passed to web resources.
 * Supports both JSON-encoded and key=value URL-encoded formats.
 */
function parseDataParam(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const data = params.get('data');
  if (!data) return {};

  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(data));
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
  } catch {
    // Not JSON — try URL-encoded key=value pairs
  }

  return Object.fromEntries(new URLSearchParams(data));
}

const config = parseDataParam();
const client = new XrmDataverseClient();

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');

const root = createRoot(container);
root.render(
  <FluentProvider theme={webLightTheme}>
    <AccountPicker
      selectedAccountId={config.selectedAccountId}
      filter={config.filter}
      dataverseClient={client}
      onAccountSelected={(id) => {
        // Notify parent frame for iframe scenarios
        window.parent?.postMessage(
          { type: 'webresource:accountSelected', accountId: id },
          '*',
        );
      }}
    />
  </FluentProvider>,
);
