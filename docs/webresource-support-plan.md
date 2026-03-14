# Web Resource Support Plan

## Overview

Mirror the PCF shell pattern: a new `webresources/` top-level directory with thin HTML+JS shells that mount the same pure React apps, but instead of PCF's `context.webAPI`, they use a new `XrmDataverseClient` that wraps `Xrm.WebApi`.

## What We're Building

### 1. `XrmDataverseClient` — new impl in `packages/dataverse/`

- Implements `IDataverseClient` using `Xrm.WebApi`
- Runtime detection: `window.Xrm` → `parent.Xrm` → throw
- Lives alongside `PcfDataverseClient` and `MockDataverseClient`

### 2. Minimal Xrm type definitions in `packages/dataverse/`

- Just the subset we need (`Xrm.WebApi`, `Xrm.Utility`, `Xrm.Navigation`)
- Avoids pulling in the massive `@types/xrm` package
- Trade-off: lean but requires maintenance vs complete but huge dependency

### 3. `webresources/` directory — parallel to `pcf/`

Each app gets:

- `webresources/<name>/index.html` — minimal host HTML
- `webresources/<name>/src/index.tsx` — mounts React app with `XrmDataverseClient` + parsed query params
- `webresources/<name>/build.mjs` — esbuild config with workspace resolver plugin (same pattern as PCF)
- `webresources/<name>/package.json` + `tsconfig.json`

### 4. Query param parsing utility

- Parses the `data` query string parameter (D365's standard param-passing mechanism for web resources)
- Returns typed config object, falls back to defaults when params are absent
- Supports both iframe-embedded and standalone page contexts

### 5. Updated scaffold tool — `pnpm new:app`

```bash
pnpm new:app my-app              # App only (no shells)
pnpm new:app my-app --pcf        # App + PCF shell
pnpm new:app my-app --webresource # App + web resource shell
pnpm new:app my-app --pcf --webresource  # Full stack
```

### 6. Demo: AccountPicker web resource shell

- Add `webresources/sample-app/` alongside existing `pcf/sample-app/`
- Proves the same `AccountPicker` component works in both host contexts
- Zero changes to the existing app or PCF shell

## Directory Structure After

```
pcf-workspace/
├── apps/sample-app/              # Pure React (unchanged)
├── pcf/sample-app/               # PCF shell (unchanged)
├── webresources/sample-app/      # NEW: Web resource shell
│   ├── package.json
│   ├── tsconfig.json
│   ├── build.mjs                 # esbuild config
│   ├── index.html                # Host HTML
│   └── src/
│       └── index.tsx             # Mount React app with XrmDataverseClient
├── packages/dataverse/
│   └── src/
│       ├── client.interface.ts   # IDataverseClient (unchanged)
│       ├── pcf-client.ts         # PcfDataverseClient (unchanged)
│       ├── mock-client.ts        # MockDataverseClient (unchanged)
│       ├── xrm-client.ts         # NEW: XrmDataverseClient
│       └── xrm-types.ts          # NEW: Minimal Xrm type definitions
```

## Xrm Context Detection

Web resources in D365 can run in two contexts. The `XrmDataverseClient` detects at runtime:

```typescript
function getXrm(): Xrm {
  // Standalone page (SiteMap navigation)
  if (window.Xrm?.WebApi)
    return window.Xrm;
  // Iframe embedded in form
  if (window.parent?.Xrm?.WebApi)
    return window.parent.Xrm;
  throw new Error('No Xrm context found');
}
```

## Build & Deploy

- `pnpm build:webresources` — esbuild bundles each web resource
- Output: `webresources/<name>/out/bundle.js` + `index.html`
- Deploy to D365: upload `index.html` and `bundle.js` as web resources

## Workspace Config Changes

- Add `'webresources/*'` to `pnpm-workspace.yaml`
- Add `build:webresources` script to root `package.json`
- Add aliases in `vite.config.ts` if needed for test/storybook resolution

## Architecture Rules (preserved)

- **Apps remain pure React** — zero host-environment knowledge
- **`IDataverseClient` interface unchanged** — new client is just another implementation
- **Web resource shells are thin** — mount app, inject client, parse params, done
- **Tests, stories, existing PCF shells — untouched**

## Trade-offs

| Decision | Chosen | Alternative | Rationale |
|----------|--------|-------------|-----------|
| Xrm types | Hand-rolled minimal | `@types/xrm` | We only need `WebApi`; avoids huge dependency |
| Bundle strategy | Single HTML + JS per app | Shared vendor bundles | Simpler deployment; optimize later if needed |
| Deployment model | Two web resources per app | Single self-contained HTML | Separating HTML + JS allows cache-friendly updates |
| Scaffold approach | Combined with flags | Separate commands | One entry point, explicit opt-in per shell type |
