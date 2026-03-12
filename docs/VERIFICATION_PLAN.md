# PCF Workspace — Verification Plan

Status: **In Progress**
Created: 2026-03-12

This plan covers everything we need to verify before this monorepo setup is considered production-ready.

---

## 1. Baseline Checks

| # | Check | Command | Status |
|---|-------|---------|--------|
| 1.1 | TypeScript compiles | `npx pnpm typecheck` | ✅ Pass |
| 1.2 | Unit tests pass | `npx pnpm test` | ✅ Pass (8/8) |
| 1.3 | Lint passes | `npx pnpm lint` | ✅ Pass (fixed: removed unused `act`, wrapped `accounts` in `useMemo`) |
| 1.4 | Full recursive build | `npx pnpm build` | ✅ Pass — 7/8 projects built, PCF bundle produced |
| 1.5 | PCF esbuild bundle | `npx pnpm build:pcf` | ✅ Pass — `out/bundle.js` (464kb) |

### Fixes applied
- [x] Removed unused `act` import in `AccountPicker.test.tsx`
- [x] Wrapped `accounts` in `useMemo` in `AccountPicker.tsx` to satisfy exhaustive-deps

---

## 2. Storybook Build

| # | Check | Command | Status |
|---|-------|---------|--------|
| 2.1 | Storybook builds to static | `npx storybook build` | ✅ Pass — built in 21s, output in `storybook-static/` |
| 2.2 | Static serve works | `npx serve storybook-static` | ⬜ Not tested (needs visual validation MCP) |
| 2.3 | Stories render in all host modes | Browse iframe URLs per host type | ⬜ Not tested (needs visual validation MCP) |

### Notes
- Build produces large chunks (some >500kb) — Storybook default, not a concern for dev tooling
- eval warnings from `@storybook/core` runtime — known Storybook issue, not actionable

---

## 3. PowerApps DOM Fidelity (Storybook Decorator)

**Context:** A huge source of PCF bugs is styling that works in isolation but breaks inside the real PowerApps DOM. The `withPowerAppsShell` decorator already simulates basic nesting, but it needs to be more realistic to catch real issues.

### Current state (`withPowerAppsShell.tsx`)
- Simulates `.pa-canvas → .pa-form → .pa-section → .pa-cell → .customControl → [PCF]`
- Uses inline styles only (not real CSS classes)
- Covers form, view, canvas, and bare shells
- Has width/host-type toolbar controls in Storybook

### What the real Dataverse DOM does that we don't simulate
- **CSS resets cascade from ancestors** — PowerApps applies `box-sizing: border-box`, font resets, line-height resets on ancestor elements. Our inline styles don't cascade the same way.
- **`customcontrolframe`** — In model-driven apps, controls can be rendered inside an iframe (`customcontrolframe`). This changes z-index stacking, portal behavior, and scroll context.
- **Fluent v8 CSS bleed** — PowerApps loads Fluent UI v8 globally. Its CSS resets (`ms-Fabric`) can bleed into PCF controls and override Fluent v9 styles.
- **`overflow: hidden` on multiple ancestors** — Not just `.customControl` but also parent cells clip overflow. Dropdowns/popovers that aren't portaled get cut off.
- **Theme CSS variables** — PowerApps injects theme colors as CSS custom properties on the container. Controls that don't use FluentProvider may accidentally inherit these.
- **Fixed height containers** — In views/grids, the cell height is constrained. Controls must not exceed it or they get clipped.

### Action items
- [ ] **Add real CSS classes + a `<style>` block** instead of inline styles — lets us simulate cascading resets (`box-sizing`, `font-family`, `line-height`, `margin: 0`) on all ancestor elements
- [ ] **Add Fluent v8 CSS bleed simulation** — inject a minimal subset of `ms-Fabric` resets (font-size, color, line-height) above the PCF control to catch conflicts
- [ ] **Add `overflow: hidden` on multiple ancestor levels** — not just `.customControl` but also cell/section containers, to catch dropdown/popover clipping
- [ ] **Add fixed-height mode for grid/view cells** — simulate the constrained row height in views, expose as toolbar option
- [ ] **Add iframe simulation option** — optional `<iframe>` wrapper (off by default) to test portal/z-index behavior in iframe-hosted controls
- [ ] **Add dark theme / high-contrast option** — PowerApps supports these and they break controls that hardcode colors

### Verification
- [ ] Render AccountPicker in form shell → dropdown should not be clipped
- [ ] Render AccountPicker in view shell with fixed height → verify graceful handling
- [ ] Render with Fluent v8 CSS bleed → verify Fluent v9 styles still win
- [ ] Render at 300px width → verify responsive layout doesn't break

---

## 4. Bundle Correctness ⚠️ ISSUES FOUND

The esbuild output must actually work as a PCF control, not just compile.

| # | Check | Status |
|---|-------|--------|
| 4.1 | Bundle exposes PCF constructor correctly | ❌ **BUG: IIFE doesn't export to global scope** |
| 4.2 | Bundle includes all workspace dependencies | ✅ Workspace resolver plugin resolves `@workspace/*` to TS source |
| 4.3 | React/ReactDOM bundled | ✅ Bundled (intentional — PCF platform React is opt-in) |
| 4.4 | `ControlManifest.Input.xml` properties match control | ✅ `selectedAccountId` + `filter` match |
| 4.5 | Bundle size reasonable | ⚠️ 464kb unminified — React 19 + ReactDOM + Fluent v9 Combobox. Acceptable but could shrink with minification + platform React |

### Bug: IIFE doesn't export constructor to global scope

The bundle wraps everything in `(()=>{...})()` — a pure IIFE that returns nothing. The PCF framework expects the constructor to be accessible via the namespace declared in the manifest (`PcfWorkspace.AccountPickerControl`).

**Current:** `export class AccountPickerControl` in source → esbuild IIFE → trapped in closure, invisible to PCF runtime.

**Fix options:**
1. Add esbuild `globalName` option: `globalName: 'PcfWorkspace'` — this makes the IIFE assign exports to `globalThis.PcfWorkspace`
2. Add a manual `globalThis` assignment in the control source
3. Switch to a format that `pac`/`pcf-scripts` expects (if using pac for packaging, pac may re-bundle and handle this)

**Recommendation:** Option 1 is cleanest — one line in `build.mjs`. But if `pac` will re-bundle anyway, this may be moot. Need to decide whether esbuild is the final bundler or a pre-bundler for `pac`.

### Action items
- [ ] **Fix constructor export** — add `globalName: 'PcfWorkspace'` to `build.mjs` (and scaffold template)
- [ ] Decide: is esbuild the final bundler, or will `pac`/`pcf-scripts` re-bundle?
- [ ] Consider `external: ['react', 'react-dom']` if targeting PCF platform React (saves ~130kb)
- [ ] Enable minification for production builds (currently only minifies when `NODE_ENV=production`)
- [ ] Verify bundle loads correctly in a real PCF harness (blocked on pac/environment)

---

## 5. Workspace Dependency Graph

| # | Check | Status |
|---|-------|--------|
| 5.1 | `workspace:*` references resolve correctly | ✅ All `link:` references resolve (verified via `pnpm ls -r`) |
| 5.2 | No circular dependencies | ✅ Clean: `pcf/` → `apps/` → `packages/`, no back-references |
| 5.3 | Each package's `exports`/`main` field is correct | ✅ All point to `./src/index.ts` |
| 5.4 | TypeScript project references match package deps | ✅ `tsconfig.json` references align with `package.json` deps |

### Notes
- Single version of React (19.2.4) across all packages — no duplicates
- Fluent UI resolved to single version (9.73.2) — good
- Unmet peer dep warning for `@storybook/test` (8.6.15 vs 8.6.18) — cosmetic, not blocking

---

## 6. Scaffold Pipeline ❌ BROKEN

| # | Check | Status |
|---|-------|--------|
| 6.1 | Scaffold creates correct file structure | ❌ **PCF shell `index.tsx` not generated** |
| 6.2 | Scaffolded code typechecks | ✅ App typechecks (PCF shell is empty) |
| 6.3 | Scaffolded tests pass | ⚠️ No test file generated |
| 6.4 | Scaffolded stories render | ⚠️ No stories file generated |
| 6.5 | Scaffolded PCF shell builds | ❌ Fails — missing entry point `./TestWidgetControl/index.tsx` |

### Bugs in `tooling/scaffold-app.mjs`

1. **PCF control file not generated** — `line 124` creates the `<Name>Control/` directory but never writes `index.tsx` into it. The user is told to "wire up the PCF shell" manually, but the build script already references the file and fails.

2. **Missing workspace resolver plugin** — scaffolded `build.mjs` doesn't include the workspace resolver plugin from `pcf/sample-app/build.mjs`. Any `@workspace/*` imports in the PCF shell will fail to resolve.

3. **Missing dependencies in PCF `package.json`** — scaffold only adds `esbuild` as devDep. Missing: `@workspace/<name>`, `@workspace/dataverse`, `@fluentui/react-components`, `react`, `react-dom`.

4. **No stories file generated** — scaffold says "add stories" but doesn't create even a skeleton `.stories.tsx`.

5. **No test file generated** — same for tests.

6. **No `tsconfig.json` for PCF shell** — not in scaffold output, may break incremental `tsc -b`.

7. **Missing `globalName`** in scaffolded `build.mjs` — same constructor export bug as sample-app.

### Action items
- [ ] Generate PCF control `index.tsx` with full lifecycle boilerplate
- [ ] Include workspace resolver plugin in scaffolded `build.mjs`
- [ ] Add correct dependencies to PCF `package.json` template
- [ ] Generate skeleton stories file
- [ ] Generate skeleton test file
- [ ] Add `tsconfig.json` for PCF shell
- [ ] Add `globalName` to scaffolded esbuild config
- [ ] Re-test full scaffold → typecheck → test → build → stories pipeline

---

## 7. Solution Packaging (`pac` CLI)

**Blocked:** `pac` CLI not yet available in this environment (orcha team working on it).

| # | Check | Status |
|---|-------|--------|
| 7.1 | `.pcfproj` file exists and is valid | ⬜ Not created yet |
| 7.2 | `.cdsproj` solution project exists | ⬜ Not created yet |
| 7.3 | `pac pcf push` works against a dev environment | ⬜ Blocked |
| 7.4 | `dotnet build` produces solution `.zip` | ⬜ Blocked |
| 7.5 | Solution import succeeds in Dataverse | ⬜ Blocked |

### Action items (once `pac` is available)
- [ ] Create `.pcfproj` for `pcf/sample-app`
- [ ] Create `.cdsproj` solution wrapper
- [ ] Add `build:solution` script to root package.json
- [ ] Test full pipeline: esbuild → pac solution → .zip
- [ ] Test `pac pcf push` for dev inner loop
- [ ] Decide: esbuild as final bundler vs pre-bundler for pac

---

## 8. CI/CD Pipeline

No GitHub Actions exist yet. Needed for PR validation and release.

| # | Check | Status |
|---|-------|--------|
| 8.1 | PR validation workflow | ⬜ Not created |
| 8.2 | Solution build + artifact upload | ⬜ Not created |
| 8.3 | Automated Storybook deploy (for visual review) | ⬜ Not created |

### Action items
- [ ] Define GitHub Actions workflow for PRs: typecheck → lint → test → build:pcf
- [ ] Add solution packaging step (once pac is available)
- [ ] Optional: deploy Storybook static build to GitHub Pages / Azure Static Web Apps

---

## Summary of Findings

### What works ✅
- TypeScript compilation (incremental, project references)
- Unit tests (Vitest + Testing Library)
- Linting (after fixes)
- Full monorepo build (`pnpm build`)
- PCF esbuild bundling (produces bundle)
- Storybook static build
- Workspace dependency resolution (no duplicates, no circular deps)
- PowerApps DOM simulation (basic — form/view/canvas shells exist)

### What's broken ❌
- **Bundle constructor export** — IIFE doesn't expose `AccountPickerControl` to global scope (PCF can't find it)
- **Scaffold pipeline** — PCF shell `index.tsx` not generated, missing deps, missing workspace plugin

### What needs improvement ⚠️
- **PowerApps DOM fidelity** — needs CSS resets, Fluent v8 bleed sim, overflow clipping, fixed-height cells
- **Bundle size** — 464kb unminified, could shrink with minification + platform React
- **Scaffold** — needs stories, tests, tsconfig for PCF shell
- **Solution packaging** — blocked on `pac` CLI
- **CI/CD** — no automated pipeline

### Priority order for fixes
1. Fix bundle constructor export (`globalName` in `build.mjs`) — **correctness bug**
2. Fix scaffold pipeline — **developer experience**
3. Enhance PowerApps DOM decorator — **catch real bugs early**
4. Solution packaging — **blocked on pac**
5. CI/CD — **last mile**
