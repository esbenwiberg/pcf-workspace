# PCF Workspace — Agent Instructions

## Read First
- `README.md` — Architecture overview, commands, conventions
- `.agent/DEVELOPMENT.md` — Development workflow and patterns
- `.agent/TROUBLESHOOTING.md` — Common issues and fixes

## Architecture Rules (non-negotiable)

1. **Apps are pure React.** No PCF imports in `apps/`. Ever.
2. **PCF shells are thin.** <100 lines. Map `context` → props, nothing else.
3. **Dataverse client is injected.** Apps receive `IDataverseClient` as a prop. Use `MockDataverseClient` in tests/stories, `PcfDataverseClient` only in pcf shells.
4. **Fluent UI 9 only.** No Fluent UI 8, no custom CSS frameworks.
5. **Stories required.** Every app must have Storybook stories with appropriate decorators.

## Environment Notes

- `pnpm` is not globally installed. Use `npx pnpm` instead (e.g. `npx pnpm typecheck`).
- `NODE_ENV` may default to `production` — prefix commands with `NODE_ENV=development` when dev dependencies are needed (e.g. install).

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

## Creating New Controls

```bash
pnpm new:app <name>    # Scaffolds app + pcf shell
```

Then: implement component → add stories → add tests → validate.

## Key Packages

- `@workspace/dataverse` — `IDataverseClient` interface + mock/pcf implementations
- `@workspace/pcf-context` — `createFormContext()` / `createDatasetContext()` for Storybook
- `@workspace/ui` — Shared Fluent UI 9 components (`ErrorBoundary`, `LoadingSpinner`)
- `@workspace/hooks` — `useDebounce`, `useAsync`
- `@workspace/test-utils` — `renderWithProviders`, mock fixtures

## Storybook Decorators

- `withPowerAppsShell` (global) — Simulates PowerApps DOM nesting. Toggle host type via toolbar.
- `withFormContext(options)` — Provides mock PCF form context
- `withDatasetContext(options)` — Provides mock PCF dataset context

## Common Mistakes

- Importing PCF types in `apps/` — use `@workspace/pcf-context` types instead
- Forgetting `FluentProvider` — the Storybook decorator handles it, but tests need `renderWithProviders`
- Hardcoding widths — PCF controls must be responsive, use `width: 100%`
- Skipping stories — visual validation is the primary agent feedback loop
