import { Spinner, type SpinnerProps } from '@fluentui/react-components';

export interface LoadingSpinnerProps {
  label?: string;
  size?: SpinnerProps['size'];
}

export function LoadingSpinner({ label = 'Loading...', size = 'medium' }: LoadingSpinnerProps) {
  return <Spinner size={size} label={label} />;
}
