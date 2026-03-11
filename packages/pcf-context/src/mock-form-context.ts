import type {
  PcfContext,
  PcfProperty,
  PcfMode,
  PcfWebApi,
  PcfFormatting,
  PcfNavigation,
  PcfUtility,
} from './pcf-types';

export interface FormContextOptions<TInputs = Record<string, unknown>> {
  parameters?: TInputs;
  disabled?: boolean;
  visible?: boolean;
  label?: string;
  width?: number;
  height?: number;
}

function createProperty<T>(value: T | null, type = 'SingleLine.Text'): PcfProperty<T> {
  return {
    raw: value,
    formatted: value != null ? String(value) : undefined,
    type,
  };
}

function createMode(options: FormContextOptions): PcfMode {
  return {
    isControlDisabled: options.disabled ?? false,
    isVisible: options.visible ?? true,
    label: options.label ?? 'Control',
    allocatedHeight: options.height ?? -1,
    allocatedWidth: options.width ?? -1,
    trackContainerResize: () => {},
  };
}

function createStubWebApi(): PcfWebApi {
  return {
    createRecord: async () => ({ id: { guid: crypto.randomUUID() } }),
    retrieveRecord: async () => ({}),
    retrieveMultipleRecords: async () => ({ entities: [] }),
    updateRecord: async () => {},
    deleteRecord: async () => {},
  };
}

function createStubFormatting(): PcfFormatting {
  return {
    formatCurrency: (v, p) => `$${v.toFixed(p ?? 2)}`,
    formatDecimal: (v, p) => v.toFixed(p ?? 2),
    formatInteger: (v) => v.toString(),
    formatDateShort: (v) => v.toLocaleDateString(),
    formatDateLong: (v) => v.toLocaleDateString(undefined, { dateStyle: 'long' }),
  };
}

function createStubNavigation(): PcfNavigation {
  return {
    openForm: async (options) => {
      console.log('[PCF Mock] openForm:', options);
    },
    openUrl: (url) => {
      console.log('[PCF Mock] openUrl:', url);
    },
    openAlertDialog: async (alertStrings) => {
      console.log('[PCF Mock] alert:', alertStrings.text);
    },
    openConfirmDialog: async (confirmStrings) => {
      console.log('[PCF Mock] confirm:', confirmStrings.text);
      return { confirmed: true };
    },
  };
}

function createStubUtility(): PcfUtility {
  return {
    getEntityMetadata: async () => ({}),
    lookupObjects: async () => [],
  };
}

/**
 * Creates a mock PCF form context for Storybook and tests.
 */
export function createFormContext<
  TInputs extends Record<string, unknown> = Record<string, unknown>,
>(options: FormContextOptions<TInputs> = {}): PcfContext<Record<string, PcfProperty>> {
  const rawParams = (options.parameters ?? {}) as Record<string, unknown>;
  const parameters: Record<string, PcfProperty> = {};

  for (const [key, value] of Object.entries(rawParams)) {
    parameters[key] = createProperty(value);
  }

  return {
    parameters,
    mode: createMode(options),
    webAPI: createStubWebApi(),
    formatting: createStubFormatting(),
    navigation: createStubNavigation(),
    utils: createStubUtility(),
    updatedProperties: Object.keys(rawParams),
  };
}
