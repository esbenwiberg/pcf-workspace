# PCF Workspace — Agent Development Guide

## Quick Start

```bash
pnpm install
pnpm dev          # Start Storybook
pnpm validate     # Run all checks
```

## Architecture

- **apps/** — Pure React components. Zero PCF knowledge. Features live here.
- **packages/** — Shared libraries (UI, Dataverse client, hooks, test utils, PCF context mocks).
- **pcf/** — Thin PCF shells (<100 lines). Maps PCF context → app props.
- **.storybook/** — Dev environment with PowerApps DOM simulation.

## Creating a new control

```bash
pnpm new:app my-control-name
```

## Validation Levels

| Level | Command | Speed | What |
|-------|---------|-------|------|
| 1 | `pnpm typecheck` | ~2s | Type errors |
| 2 | `pnpm test` | ~5s | Unit tests (vitest) |
| 3 | `pnpm test:e2e:mock` | ~30s | Visual tests against Storybook |
| 4 | Manual | ~60s | Live Dataverse via pcf-dev-proxy |

Always run at least levels 1-2 after changes. Run level 3 for UI changes.

## Key Patterns

### Dataverse Client Injection
Apps receive an `IDataverseClient` as a prop. Never import Dataverse directly.
- Tests/Storybook: `MockDataverseClient`
- Production PCF: `PcfDataverseClient` (wraps `context.webAPI`)

### Form vs Dataset Controls
- Form controls: get parameters as props, return outputs via callback
- Dataset controls: get `PcfDataset` with records, columns, paging
- Use Storybook's Host Type toolbar to toggle between form/view/canvas shells

### Styling Gotchas
PCF controls are nested in PowerApps DOM. Common issues:
- **Width**: controls inherit container width. Always use `width: 100%`.
- **Font**: PowerApps uses Segoe UI. Our Storybook shell simulates this.
- **Overflow**: `.customControl` has `overflow: hidden`. Don't rely on content outside bounds.
- **z-index**: Dropdowns/popups need portals to escape the container.

## File Conventions
- Component: `apps/<name>/src/<Name>.tsx`
- Test: `apps/<name>/src/<Name>.test.tsx`
- Story: `apps/<name>/src/<Name>.stories.tsx`
- Types: `apps/<name>/src/types.ts`
- PCF Shell: `pcf/<name>/<Name>Control/index.tsx`
