import { Component, type ReactNode, type ErrorInfo } from 'react';
import { MessageBar, MessageBarBody, Button } from '@fluentui/react-components';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <MessageBar intent="error">
          <MessageBarBody>
            {this.state.error.message}
            <Button
              appearance="transparent"
              size="small"
              onClick={() => this.setState({ error: null })}
            >
              Retry
            </Button>
          </MessageBarBody>
        </MessageBar>
      );
    }
    return this.props.children;
  }
}
