#!/usr/bin/env node

/**
 * Scaffolds a new app with optional PCF and/or web resource shells.
 *
 * Usage:
 *   pnpm new:app <name>                        — App only
 *   pnpm new:app <name> --pcf                  — App + PCF shell
 *   pnpm new:app <name> --webresource          — App + web resource shell
 *   pnpm new:app <name> --pcf --webresource    — App + both shells
 */

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const name = args.find((a) => !a.startsWith('--'));

if (!name) {
  console.error('Usage: pnpm new:app <name> [--pcf] [--webresource]');
  process.exit(1);
}

const flags = new Set(args.filter((a) => a.startsWith('--')));
const shouldScaffoldPcf = flags.has('--pcf');
const shouldScaffoldWr = flags.has('--webresource');

const pascalName = name
  .split('-')
  .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
  .join('');

const appDir = path.join(process.cwd(), 'apps', name);

if (fs.existsSync(appDir)) {
  console.error(`App already exists: ${appDir}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// App scaffold (always created)
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
// Shared: esbuild workspace resolver plugin source (used by both shells)
// ---------------------------------------------------------------------------

const workspacePluginSource = `
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
};`.trim();

// ---------------------------------------------------------------------------
// PCF shell scaffold (opt-in with --pcf)
// ---------------------------------------------------------------------------

if (shouldScaffoldPcf) {
  const pcfDir = path.join(process.cwd(), 'pcf', name);
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

  fs.writeFileSync(
    path.join(pcfDir, 'build.mjs'),
    `import * as esbuild from 'esbuild';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

${workspacePluginSource}

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
}

// ---------------------------------------------------------------------------
// Web resource shell scaffold (opt-in with --webresource)
// ---------------------------------------------------------------------------

if (shouldScaffoldWr) {
  const wrDir = path.join(process.cwd(), 'webresources', name);
  fs.mkdirSync(path.join(wrDir, 'src'), { recursive: true });

  fs.writeFileSync(
    path.join(wrDir, 'package.json'),
    JSON.stringify(
      {
        name: `@workspace/wr-${name}`,
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
    path.join(wrDir, 'tsconfig.json'),
    JSON.stringify(
      {
        extends: '../../tsconfig.base.json',
        compilerOptions: { outDir: './out', rootDir: '.' },
        include: ['src'],
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
    path.join(wrDir, 'build.mjs'),
    `import * as esbuild from 'esbuild';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

${workspacePluginSource}

const watch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: ['./src/index.tsx'],
  bundle: true,
  outfile: './out/bundle.js',
  format: 'iife',
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

  fs.writeFileSync(
    path.join(wrDir, 'index.html'),
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${pascalName}</title>
  <style>
    html, body, #root {
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="out/bundle.js"></script>
</body>
</html>
`,
  );

  fs.writeFileSync(
    path.join(wrDir, 'src', 'index.tsx'),
    `import { createRoot } from 'react-dom/client';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { ${pascalName} } from '@workspace/${name}';
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
    <${pascalName}
      dataverseClient={client}
    />
  </FluentProvider>,
);
`,
  );
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

const generated = [`  apps/${name}/src/${pascalName}.tsx          — Component`];
generated.push(`  apps/${name}/src/types.ts                  — Props interface`);
generated.push(`  apps/${name}/src/index.ts                  — Exports`);
generated.push(`  apps/${name}/src/${pascalName}.stories.tsx  — Storybook stories`);
generated.push(`  apps/${name}/src/${pascalName}.test.tsx     — Unit tests`);

if (shouldScaffoldPcf) {
  generated.push(`  pcf/${name}/${pascalName}Control/index.tsx  — PCF shell`);
  generated.push(`  pcf/${name}/build.mjs                      — PCF esbuild config`);
  generated.push(`  pcf/${name}/ControlManifest.Input.xml      — PCF manifest`);
}

if (shouldScaffoldWr) {
  generated.push(`  webresources/${name}/src/index.tsx          — Web resource mount`);
  generated.push(`  webresources/${name}/index.html             — Web resource HTML host`);
  generated.push(`  webresources/${name}/build.mjs              — Web resource esbuild config`);
}

const shells = [];
if (shouldScaffoldPcf) shells.push(`PCF shell:  pcf/${name}/`);
if (shouldScaffoldWr) shells.push(`WR shell:   webresources/${name}/`);

console.log(`
Created app:       apps/${name}/
${shells.length ? shells.join('\n') : '(no shells — use --pcf and/or --webresource to add them)'}

Files generated:
${generated.join('\n')}

Next steps:
  1. Run: npx pnpm install
  2. Implement your component in apps/${name}/src/${pascalName}.tsx
${shouldScaffoldPcf ? `  3. Add properties to pcf/${name}/ControlManifest.Input.xml and wire them in the shell\n` : ''}  ${shouldScaffoldPcf || shouldScaffoldWr ? '' : '3'}. Run: npx pnpm dev
`);
