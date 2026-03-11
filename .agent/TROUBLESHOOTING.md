# Troubleshooting

## Common Issues

### "Module not found: @workspace/*"
Run `pnpm install` — workspace links may be stale.

### Storybook shows blank page
Check browser console. Usually a missing dependency or import error.
Run `pnpm typecheck` to find TS errors first.

### Styles look different in real PowerApps
Use Storybook's Host Type toolbar to switch between form/view/canvas shells.
The decorator simulates PowerApps DOM nesting but isn't pixel-perfect.

### Fluent UI components not styled
Ensure `FluentProvider` wraps your component. The Storybook decorator handles
this globally, but tests need `renderWithProviders` from `@workspace/test-utils`.

### PCF build fails
Check `ControlManifest.Input.xml` matches your control's namespace/constructor.
Ensure esbuild can resolve all imports.

### pcf-dev-proxy not intercepting
1. Is Chrome launched by the proxy? (Check for proxy profile)
2. Is your control name correct? (`cc_PcfWorkspace.AccountPickerControl`)
3. Are you on the right Dataverse page (form/view with the control)?
