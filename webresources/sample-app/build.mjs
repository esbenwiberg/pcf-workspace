import * as esbuild from 'esbuild';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

// Resolve @workspace/* packages to their TypeScript source
const workspacePlugin = {
  name: 'workspace-resolver',
  setup(build) {
    build.onResolve({ filter: /^@workspace\// }, (args) => {
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
