import React from 'react';
import type { Decorator } from '@storybook/react';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';

/**
 * Simulates the PowerApps DOM nesting for PCF controls.
 * Catches styling issues from CSS inheritance, width constraints, font resets, etc.
 *
 * Real PowerApps DOM (simplified):
 *   Form:  .pa-canvas → .pa-form → .pa-section → .pa-cell → .customControl → [PCF]
 *   View:  .pa-canvas → .pa-grid-page → .pa-grid-cell → .customControl → [PCF]
 */

const shellStyles: Record<string, React.CSSProperties> = {
  'pa-canvas': {
    fontFamily:
      '"Segoe UI", "Segoe UI Web (West European)", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
    fontSize: '14px',
    color: '#323130',
    lineHeight: '20px',
    backgroundColor: '#f5f5f5',
    padding: '16px',
  },
  'pa-form': {
    backgroundColor: '#ffffff',
    borderRadius: '4px',
    padding: '16px',
    boxShadow: '0 1.6px 3.6px rgba(0,0,0,0.132), 0 0.3px 0.9px rgba(0,0,0,0.108)',
  },
  'pa-section': {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  'pa-cell': {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  'pa-grid-page': {
    backgroundColor: '#ffffff',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  'pa-grid-cell': {
    padding: '0',
  },
  customControl: {
    position: 'relative' as const,
    overflow: 'hidden',
  },
};

const FormShell: React.FC<{ children: React.ReactNode; width: string }> = ({
  children,
  width,
}) => (
  <div className="pa-canvas" style={shellStyles['pa-canvas']}>
    <div className="pa-form" style={{ ...shellStyles['pa-form'], width }}>
      <div className="pa-section" style={shellStyles['pa-section']}>
        <div className="pa-cell" style={shellStyles['pa-cell']}>
          <div className="customControl" style={shellStyles['customControl']}>
            {children}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ViewShell: React.FC<{ children: React.ReactNode; width: string }> = ({
  children,
  width,
}) => (
  <div className="pa-canvas" style={shellStyles['pa-canvas']}>
    <div className="pa-grid-page" style={{ ...shellStyles['pa-grid-page'], width }}>
      <div className="pa-grid-cell" style={shellStyles['pa-grid-cell']}>
        <div className="customControl" style={shellStyles['customControl']}>
          {children}
        </div>
      </div>
    </div>
  </div>
);

const CanvasShell: React.FC<{ children: React.ReactNode; width: string }> = ({
  children,
  width,
}) => (
  <div style={{ width, padding: '8px', backgroundColor: '#ffffff' }}>
    <div className="customControl" style={shellStyles['customControl']}>
      {children}
    </div>
  </div>
);

export const withPowerAppsShell: Decorator = (Story, context) => {
  const hostType = context.globals?.pcfHostType ?? 'form';
  const rawWidth = context.globals?.pcfWidth ?? '500';
  const width = rawWidth.includes('%') ? rawWidth : `${rawWidth}px`;

  const content = (
    <FluentProvider theme={webLightTheme}>
      <Story />
    </FluentProvider>
  );

  switch (hostType) {
    case 'form':
      return <FormShell width={width}>{content}</FormShell>;
    case 'view':
      return <ViewShell width={width}>{content}</ViewShell>;
    case 'canvas':
      return <CanvasShell width={width}>{content}</CanvasShell>;
    case 'bare':
    default:
      return <div style={{ width }}>{content}</div>;
  }
};
