#!/usr/bin/env node

/**
 * Scaffolds a new app + PCF shell.
 * Usage: pnpm new:app <name>
 */

import fs from 'fs';
import path from 'path';

const name = process.argv[2];
if (!name) {
  console.error('Usage: pnpm new:app <name>');
  process.exit(1);
}

const pascalName = name
  .split('-')
  .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
  .join('');

const appDir = path.join(process.cwd(), 'apps', name);
const pcfDir = path.join(process.cwd(), 'pcf', name);

if (fs.existsSync(appDir)) {
  console.error(`App already exists: ${appDir}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// App scaffold
// ---------------------------------------------------------------------------

fs.mkdirSync(path.join(appDir, 'src'), { recursive: true });

fs.writeFileSync(
  path.join(appDir, 'package.json'),
  JSON.stringify(
    {
      name: `@workspace/${name}`,
      version: '1.0.0',
      private: true,
      type: 'module',
      main: './src/index.ts',
      types: './src/index.ts',
      scripts: { typecheck: 'tsc --noEmit' },
      dependencies: {
        '@workspace/ui': 'workspace:*',
        '@workspace/dataverse': 'workspace:*',
        '@workspace/hooks': 'workspace:*',
        '@fluentui/react-components': '^9.56.0',
        react: '^19.0.0',
      },
      devDependencies: {
        '@workspace/test-utils': 'workspace:*',
        '@workspace/pcf-context': 'workspace:*',
      },
    },
    null,
    2,
  ),
);

fs.writeFileSync(
  path.join(appDir, 'tsconfig.json'),
  JSON.stringify(
    {
      extends: '../../tsconfig.base.json',
      compilerOptions: { outDir: './dist', rootDir: './src' },
      include: ['src'],
      references: [
        { path: '../../packages/dataverse' },
        { path: '../../packages/hooks' },
        { path: '../../packages/ui' },
      ],
    },
    null,
    2,
  ),
);

fs.writeFileSync(
  path.join(appDir, 'src', 'types.ts'),
  `import type { IDataverseClient } from '@workspace/dataverse';

export interface ${pascalName}Props {
  disabled?: boolean;
  dataverseClient: IDataverseClient;
}
`,
);

fs.writeFileSync(
  path.join(appDir, 'src', `${pascalName}.tsx`),
  `import { makeStyles, tokens } from '@fluentui/react-components';
import type { ${pascalName}Props } from './types';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    width: '100%',
  },
});

export function ${pascalName}({ disabled = false }: ${pascalName}Props) {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <p>${pascalName} — replace this with your implementation</p>
    </div>
  );
}
`,
);

fs.writeFileSync(
  path.join(appDir, 'src', 'index.ts'),
  `export { ${pascalName} } from './${pascalName}';
export type { ${pascalName}Props } from './types';
`,
);

// Stories
fs.writeFileSync(
  path.join(appDir, 'src', `${pascalName}.stories.tsx`),
  `import type { Meta, StoryObj } from '@storybook/react';
import { MockDataverseClient } from '@workspace/dataverse';
import { ${pascalName} } from './${pascalName}';

const mockClient = new MockDataverseClient();

const meta = {
  title: 'Apps/${pascalName}',
  component: ${pascalName},
  tags: ['autodocs'],
  args: {
    dataverseClient: mockClient,
  },
  argTypes: {
    dataverseClient: { table: { disable: true } },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof ${pascalName}>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default state */
export const Default: Story = {};

/** Disabled state */
export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
`,
);

// Tests
fs.writeFileSync(
  path.join(appDir, 'src', `${pascalName}.test.tsx`),
  `import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@workspace/test-utils';
import { MockDataverseClient } from '@workspace/dataverse';
import { ${pascalName} } from './${pascalName}';

function setup(overrides: Record<string, unknown> = {}) {
  const client = new MockDataverseClient();

  return renderWithProviders(
    <${pascalName} dataverseClient={client} {...overrides} />,
  );
}

describe('${pascalName}', () => {
  it('renders', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByText('${pascalName} — replace this with your implementation')).toBeInTheDocument();
    });
  });

  it('respects disabled prop', async () => {
    setup({ disabled: true });
    // Add assertions once the component has interactive elements
  });
});
`,
);

// ---------------------------------------------------------------------------
// PCF shell scaffold
// ---------------------------------------------------------------------------

fs.mkdirSync(path.join(pcfDir, `${pascalName}Control`), { recursive: true });

fs.writeFileSync(
  path.join(pcfDir, 'package.json'),
  JSON.stringify(
    {
      name: `@workspace/pcf-${name}`,
      version: '1.0.0',
      private: true,
      scripts: { build: 'node build.mjs' },
      dependencies: {
        [`@workspace/${name}`]: 'workspace:*',
        '@workspace/dataverse': 'workspace:*',
        '@fluentui/react-components': '^9.56.0',
        react: '^19.0.0',
        'react-dom': '^19.0.0',
      },
      devDependencies: { esbuild: '^0.24.0' },
    },
    null,
    2,
  ),
);

fs.writeFileSync(
  path.join(pcfDir, 'tsconfig.json'),
  JSON.stringify(
    {
      extends: '../../tsconfig.base.json',
      compilerOptions: { outDir: './out', rootDir: '.' },
      include: [`${pascalName}Control`],
      references: [
        { path: `../../apps/${name}` },
        { path: '../../packages/dataverse' },
      ],
    },
    null,
    2,
  ),
);

fs.writeFileSync(
  path.join(pcfDir, 'ControlManifest.Input.xml'),
  `<?xml version="1.0" encoding="utf-8" ?>
<manifest>
  <control namespace="PcfWorkspace" constructor="${pascalName}Control" version="1.0.0" display-name-key="${pascalName}" description-key="${pascalName} control" control-type="standard">
    <external-service-usage enabled="false"></external-service-usage>
    <resources>
      <code path="out/bundle.js" order="1"/>
    </resources>
  </control>
</manifest>
`,
);

// build.mjs — includes workspace resolver plugin and globalName
fs.writeFileSync(
  path.join(pcfDir, 'build.mjs'),
  `import * as esbuild from 'esbuild';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

// Resolve @workspace/* packages to their TypeScript source
const workspacePlugin = {
  name: 'workspace-resolver',
  setup(build) {
    build.onResolve({ filter: /^@workspace\\// }, (args) => {
      const pkg = args.path.replace('@workspace/', '');
      const candidates = [
        path.join(root, 'apps', pkg, 'src', 'index.ts'),
        path.join(root, 'packages', pkg, 'src', 'index.ts'),
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          return { path: candidate };
        }
      }
      return undefined;
    });
  },
};

const watch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: ['./${pascalName}Control/index.tsx'],
  bundle: true,
  outfile: './out/bundle.js',
  format: 'iife',
  globalName: 'PcfWorkspace',
  target: ['es2020'],
  minify: process.env.NODE_ENV === 'production',
  sourcemap: process.env.NODE_ENV !== 'production',
  jsx: 'automatic',
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  plugins: [workspacePlugin],
  logLevel: 'info',
};

if (watch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log('Watching for changes...');
} else {
  await esbuild.build(buildOptions);
}
`,
);

// PCF control shell — the actual index.tsx
fs.writeFileSync(
  path.join(pcfDir, `${pascalName}Control`, 'index.tsx'),
  `import { createRoot, type Root } from 'react-dom/client';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { ${pascalName} } from '@workspace/${name}';
import { PcfDataverseClient } from '@workspace/dataverse';

interface IInputs {
  // Add your control properties here (must match ControlManifest.Input.xml)
}

interface IOutputs {
  // Add your output properties here
}

export class ${pascalName}Control
  implements ComponentFramework.StandardControl<IInputs, IOutputs>
{
  private root: Root | null = null;
  private container!: HTMLDivElement;
  private notifyOutputChanged!: () => void;

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
        <${pascalName}
          disabled={context.mode.isControlDisabled}
          dataverseClient={new PcfDataverseClient(context.webAPI)}
        />
      </FluentProvider>,
    );
  }

  getOutputs(): IOutputs {
    return {};
  }

  destroy(): void {
    this.root?.unmount();
    this.root = null;
  }
}
`,
);

console.log(`
Created app:       apps/${name}/
Created PCF shell: pcf/${name}/

Files generated:
  apps/${name}/src/${pascalName}.tsx          — Component
  apps/${name}/src/types.ts                  — Props interface
  apps/${name}/src/index.ts                  — Exports
  apps/${name}/src/${pascalName}.stories.tsx  — Storybook stories
  apps/${name}/src/${pascalName}.test.tsx     — Unit tests
  pcf/${name}/${pascalName}Control/index.tsx  — PCF shell
  pcf/${name}/build.mjs                      — esbuild config
  pcf/${name}/ControlManifest.Input.xml      — PCF manifest

Next steps:
  1. Run: npx pnpm install
  2. Implement your component in apps/${name}/src/${pascalName}.tsx
  3. Add properties to pcf/${name}/ControlManifest.Input.xml and wire them in the shell
  4. Run: npx pnpm dev
`);
