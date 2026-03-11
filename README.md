# pcf-workspace

Monorepo for developing PowerApps Component Framework (PCF) controls with modern tooling and agent-friendly workflows.

**Core idea:** PCF is a deployment target, not a development environment. Apps are pure React/TypeScript with zero PCF knowledge. Thin PCF shells (~50 lines) map `context` → props at the boundary.

## Quick Start

```bash
pnpm install
pnpm dev              # Storybook on http://localhost:6006
pnpm test             # Unit + component tests
pnpm typecheck        # TypeScript validation
pnpm validate         # Full pipeline: typecheck → lint → test → e2e
```

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  pcf/<name>/              Thin PCF shells (<100 lines)       │
│  Maps context.parameters → props, context.webAPI → client    │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│  apps/<name>/             Pure React components              │
│  Own state, own tests, own stories. Zero PCF imports.        │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│  packages/                Shared libraries                   │
│  dataverse/  UI client abstraction (mock / proxy / pcf)      │
│  pcf-context/ Mock form + dataset contexts for Storybook     │
│  ui/         Fluent UI 9 shared components                   │
│  hooks/      useDebounce, useAsync                           │
│  test-utils/ Fixtures, render helpers, vitest setup           │
└──────────────────────────────────────────────────────────────┘
```

## Project Structure

```
pcf-workspace/
├── apps/                   # Feature apps (pure React)
│   └── sample-app/         # AccountPicker example
├── packages/
│   ├── dataverse/          # IDataverseClient + implementations
│   ├── pcf-context/        # Mock PCF contexts (form + dataset)
│   ├── hooks/              # Shared React hooks
│   ├── ui/                 # Fluent UI 9 components
│   └── test-utils/         # Test fixtures and helpers
├── pcf/                    # PCF shells (deployment adapters)
│   └── sample-app/         # AccountPickerControl
├── .storybook/             # Storybook config + decorators
│   └── decorators/         # PowerApps shell, form/dataset context
├── e2e/                    # Playwright e2e tests
├── tooling/                # Scaffolding scripts
└── .agent/                 # Agent development docs
```

## Creating a New Control

```bash
pnpm new:app my-control-name
```

This scaffolds:
- `apps/my-control-name/` — React component, types, exports
- `pcf/my-control-name/` — PCF shell, manifest, esbuild config

Then add stories, write tests, and implement your component.

## Development Workflow

### Storybook (primary dev environment)

Storybook wraps every component in a simulated PowerApps DOM with the global toolbar:

- **Host Type** — Switch between Model-driven Form, View, Canvas App, or bare
- **Width** — 300px / 500px / 800px / full width

This catches styling issues from PowerApps CSS inheritance, overflow constraints, and font resets.

### Dataverse Client Injection

Apps never talk to Dataverse directly. They receive an `IDataverseClient` as a prop:

| Context | Implementation | Data Source |
|---------|---------------|-------------|
| Tests | `MockDataverseClient` | In-memory fixtures |
| Storybook | `MockDataverseClient` | In-memory fixtures |
| Dev proxy | `ProxyDataverseClient` | Live Dataverse via [pcf-dev-proxy](https://github.com/kristoffer88/pcf-dev-proxy) |
| Production | `PcfDataverseClient` | `context.webAPI` |

### Form vs Dataset Controls

PCF controls come in two flavors with fundamentally different contexts:

- **Form controls** — `context.parameters` with bound/input properties, `notifyOutputChanged` for outputs
- **Dataset controls** — `context.parameters.<dataset>` with `sortedRecordIds`, `columns`, `paging`, `filtering`

Use the appropriate Storybook decorator:
```tsx
// Form control
decorators: [withFormContext({ parameters: { selectedAccountId: 'abc-123' } })]

// Dataset control
decorators: [withDatasetContext({ entityName: 'account', columns: [...], records: [...] })]
```

## Validation Levels

| Level | Command | Speed | What it catches |
|-------|---------|-------|-----------------|
| 1 | `pnpm typecheck` | ~2s | Type errors, missing imports |
| 2 | `pnpm test` | ~5s | Logic bugs, component behavior |
| 3 | `pnpm test:e2e:mock` | ~30s | Visual/interaction bugs in browser |
| 4 | pcf-dev-proxy | ~60s | Real Dataverse integration issues |

**Agent default:** Always run levels 1–2 after changes. Run level 3 for UI changes.

## Live Dataverse Testing (Level 4)

Uses [pcf-dev-proxy](https://github.com/kristoffer88/pcf-dev-proxy) — an HTTPS MITM proxy that intercepts PCF bundle requests from live Dataverse and serves your local build instead.

```bash
# Terminal 1 — build watcher
pnpm --filter @workspace/pcf-sample-app build --watch

# Terminal 2 — proxy (opens Chrome with persistent Dataverse session)
npx pcf-dev-proxy --hot

# Terminal 3 — trigger reload after build
npx pcf-dev-proxy reload --control cc_PcfWorkspace.AccountPickerControl --trigger build
```

First run requires interactive Dataverse login. Session persists across restarts.

## Styling Gotchas

PCF controls are nested deep in the PowerApps DOM. Common issues:

| Issue | Cause | Fix |
|-------|-------|-----|
| Width overflow | Container has fixed width | Always use `width: 100%` |
| Font mismatch | PowerApps uses Segoe UI | Storybook shell decorator simulates this |
| Clipped dropdowns | `.customControl` has `overflow: hidden` | Use Fluent UI portals for popups |
| Missing theme | No `FluentProvider` wrapper | PCF shell wraps in `FluentProvider`; tests use `renderWithProviders` |

Use Storybook's Host Type toolbar to toggle between form/view/canvas shells and catch these early.

## Tech Stack

| Tool | Purpose |
|------|---------|
| pnpm workspaces | Monorepo management |
| React 19 | UI framework |
| Fluent UI 9 | Microsoft design system |
| TypeScript 5 | Type safety |
| Vite | Dev server (via Storybook) |
| Vitest | Unit + component tests |
| Playwright | E2E tests |
| Storybook 8 | Component development + visual testing |
| esbuild | PCF bundle builds |
| Zustand | State management (when needed) |

## Scripts Reference

```bash
pnpm dev                    # Start Storybook
pnpm test                   # Run all unit/component tests
pnpm test:watch             # Watch mode
pnpm test:e2e               # Run Playwright e2e tests
pnpm test:e2e:mock          # E2e against Storybook only
pnpm typecheck              # TypeScript project references build
pnpm lint                   # ESLint
pnpm build                  # Build all packages
pnpm build:pcf              # Build PCF shells only
pnpm validate               # Full validation pipeline
pnpm new:app <name>         # Scaffold new app + PCF shell
```

## Agent Instructions

See [`.agent/DEVELOPMENT.md`](.agent/DEVELOPMENT.md) for agent-specific workflow docs and [`.agent/TROUBLESHOOTING.md`](.agent/TROUBLESHOOTING.md) for common issues.
