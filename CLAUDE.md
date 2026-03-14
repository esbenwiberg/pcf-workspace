# PCF Workspace — Agent Instructions

## Read First
- `README.md` — Architecture overview, commands, conventions
- `.agent/DEVELOPMENT.md` — Development workflow and patterns
- `.agent/TROUBLESHOOTING.md` — Common issues and fixes

## Architecture Rules (non-negotiable)

1. **Apps are pure React.** No PCF imports in `apps/`. Ever.
2. **PCF and web resource shells are thin.** <100 lines. Map `context` → props, nothing else.
3. **Dataverse client is injected.** Apps receive `IDataverseClient` as a prop. Use `MockDataverseClient` in tests/stories, `PcfDataverseClient` in pcf shells, `XrmDataverseClient` in web resource shells.
4. **Fluent UI 9 only.** No Fluent UI 8, no custom CSS frameworks.
5. **Stories required.** Every app must have Storybook stories with appropriate decorators.

## Environment Notes

- `pnpm` is not globally installed. Use `npx pnpm` instead (e.g. `npx pnpm typecheck`).
- `NODE_ENV` may default to `production` — prefix commands with `NODE_ENV=development` when dev dependencies are needed (e.g. install).
- Playwright/Chromium won't execute in sandboxed environments (EACCES). Skip `test:e2e` and use the validate MCP for visual validation instead.

## Self-Validation (validate MCP)

Use this exact sequence to visually validate Storybook via the validate MCP:

### 1. Install deps & build Storybook
```bash
NODE_ENV=development npx pnpm install --force <<< "Y"
npx storybook build    # outputs to storybook-static/
```

### 2. Fix `serve` clean URLs (one-time, regenerate after each build)
Storybook needs `iframe.html` to resolve literally. `serve` strips `.html` by default, breaking it.
But `cleanUrls: false` also disables `index.html` auto-resolve, so add a rewrite:
```bash
cat > storybook-static/serve.json << 'EOF'
{
  "cleanUrls": false,
  "rewrites": [
    { "source": "/", "destination": "/index.html" }
  ]
}
EOF
```

### 3. Start the validation server
```
validate_start(
  start: "npx serve storybook-static -l ${PORT:-3000} --no-clipboard",
  mode: "serve",
  health: "/"
)
```

### 4. Browse stories via iframe URL
Use `validate_browse` with the iframe URL pattern — the main Storybook UI shell won't render previews correctly when served statically through a proxy:
```
validate_browse(url: "http://localhost:<PORT>/iframe.html?id=<story-id>&viewMode=story")
```

Story ID format: `apps-<componentname>--<storyname>` (lowercase, hyphens).
Examples:
- `apps-accountpicker--default`
- `apps-accountpicker--with-selection`
- `apps-accountpicker--disabled`

## Before Making Changes

```bash
npx pnpm typecheck    # Must pass
npx pnpm test         # Must pass
```

## After Making Changes

```bash
npx pnpm typecheck && npx pnpm test    # Minimum bar
npx pnpm validate                      # Full pipeline for UI changes
```

## File Conventions

| File | Location |
|------|----------|
| Component | `apps/<name>/src/<Name>.tsx` |
| Types | `apps/<name>/src/types.ts` |
| Tests | `apps/<name>/src/<Name>.test.tsx` |
| Stories | `apps/<name>/src/<Name>.stories.tsx` |
| PCF Shell | `pcf/<name>/<Name>Control/index.tsx` |
| PCF Manifest | `pcf/<name>/ControlManifest.Input.xml` |
| WR Shell | `webresources/<name>/src/index.tsx` |
| WR HTML Host | `webresources/<name>/index.html` |
| WR Build | `webresources/<name>/build.mjs` |

## Creating New Controls

```bash
pnpm new:app <name>                        # App only
pnpm new:app <name> --pcf                  # App + PCF shell
pnpm new:app <name> --webresource          # App + web resource shell
pnpm new:app <name> --pcf --webresource    # App + both shells
```

Then: implement component → add stories → add tests → validate.

## Key Packages

- `@workspace/dataverse` — `IDataverseClient` interface + mock/pcf/xrm implementations
- `@workspace/pcf-context` — `createFormContext()` / `createDatasetContext()` for Storybook
- `@workspace/ui` — Shared Fluent UI 9 components (`ErrorBoundary`, `LoadingSpinner`)
- `@workspace/hooks` — `useDebounce`, `useAsync`
- `@workspace/test-utils` — `renderWithProviders`, mock fixtures

## Storybook Decorators

- `withPowerAppsShell` (global) — Simulates PowerApps DOM nesting. Toggle host type via toolbar.
- `withFormContext(options)` — Provides mock PCF form context
- `withDatasetContext(options)` — Provides mock PCF dataset context

## Common Mistakes

- Importing PCF or Xrm types in `apps/` — use `@workspace/pcf-context` types instead
- Forgetting `FluentProvider` — the Storybook decorator handles it, but tests need `renderWithProviders`
- Hardcoding widths — PCF controls must be responsive, use `width: 100%`
- Skipping stories — visual validation is the primary agent feedback loop
