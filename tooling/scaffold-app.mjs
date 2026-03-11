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

// Create app
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

// Create PCF shell
fs.mkdirSync(path.join(pcfDir, `${pascalName}Control`), { recursive: true });

fs.writeFileSync(
  path.join(pcfDir, 'package.json'),
  JSON.stringify(
    {
      name: `@workspace/pcf-${name}`,
      version: '1.0.0',
      private: true,
      scripts: { build: 'node build.mjs' },
      devDependencies: { esbuild: '^0.24.0' },
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

await esbuild.build({
  entryPoints: ['./${pascalName}Control/index.tsx'],
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
  logLevel: 'info',
});
`,
);

console.log(`
Created app:       apps/${name}/
Created PCF shell: pcf/${name}/

Next steps:
  1. Implement your component in apps/${name}/src/${pascalName}.tsx
  2. Add stories in apps/${name}/src/${pascalName}.stories.tsx
  3. Wire up the PCF shell in pcf/${name}/${pascalName}Control/index.tsx
  4. Run: pnpm install && pnpm dev
`);
