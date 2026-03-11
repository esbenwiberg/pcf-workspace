import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['./AccountPickerControl/index.tsx'],
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
