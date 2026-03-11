import { createRoot, type Root } from 'react-dom/client';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { AccountPicker } from '@workspace/sample-app';
import { PcfDataverseClient } from '@workspace/dataverse';

interface IInputs {
  selectedAccountId: ComponentFramework.PropertyTypes.StringProperty;
  filter: ComponentFramework.PropertyTypes.StringProperty;
}

interface IOutputs {
  selectedAccountId?: string;
}

export class AccountPickerControl
  implements ComponentFramework.StandardControl<IInputs, IOutputs>
{
  private root: Root | null = null;
  private container!: HTMLDivElement;
  private notifyOutputChanged!: () => void;
  private currentValue: string | null = null;

  init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    _state: ComponentFramework.Dictionary,
    container: HTMLDivElement,
  ): void {
    this.container = container;
    this.notifyOutputChanged = notifyOutputChanged;
    this.root = createRoot(container);
    this.render(context);
  }

  updateView(context: ComponentFramework.Context<IInputs>): void {
    this.render(context);
  }

  private render(context: ComponentFramework.Context<IInputs>): void {
    this.root?.render(
      <FluentProvider theme={webLightTheme}>
        <AccountPicker
          selectedAccountId={context.parameters.selectedAccountId?.raw ?? undefined}
          filter={context.parameters.filter?.raw ?? undefined}
          disabled={context.mode.isControlDisabled}
          dataverseClient={new PcfDataverseClient(context.webAPI)}
          onAccountSelected={(id) => {
            this.currentValue = id;
            this.notifyOutputChanged();
          }}
        />
      </FluentProvider>,
    );
  }

  getOutputs(): IOutputs {
    return {
      selectedAccountId: this.currentValue ?? undefined,
    };
  }

  destroy(): void {
    this.root?.unmount();
    this.root = null;
  }
}
