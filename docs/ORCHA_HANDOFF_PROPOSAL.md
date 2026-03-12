# Validate MCP: Interactive Browser Handoff Proposal

## What we're trying to do

The agent builds a PCF control locally, then needs to validate it works against a **real Dataverse environment**. This means:

1. A browser navigates to a Power Apps form (e.g. `https://org.crm4.dynamics.com/main.aspx?...`)
2. The user logs in with their Microsoft account (interactive, MFA, etc.)
3. `pcf-dev-proxy` intercepts the PCF bundle request and serves the locally-built `bundle.js` instead
4. The agent takes screenshots to verify the control rendered correctly with real data

## The gap

The current validate MCP is **read-only** — `validate_browse` navigates and screenshots, but there's no way for the **human user** to interact with the browser. The login flow requires the user to type credentials, handle MFA prompts, consent screens, etc. That can't be automated and shouldn't be.

## What we need: an interactive handoff

Something like this flow:

1. **Agent** calls `validate_start` to spin up `pcf-dev-proxy` with `--agent-browser --cdp-port <port>`
2. **Agent** calls something like `validate_browse("https://org.crm4.dynamics.com")` — Playwright opens the Dataverse login page
3. **Orcha exposes the browser session to the user** — either:
   - A live VNC/noVNC stream of the browser viewport
   - A CDP (Chrome DevTools Protocol) websocket URL the user can connect to from their own Chrome via `chrome://inspect`
   - An iframe/embed of the remote browser in the Orcha UI
4. **User** logs in manually (handles MFA, picks account, etc.)
5. **User** signals "I'm done logging in" (button click, or Orcha detects navigation away from login)
6. **Control returns to agent** — the browser is now authenticated, the proxy is intercepting, and the agent resumes with `validate_browse` / `validate_screenshot` to visually verify the control

## The key primitive Orcha needs to add

A **"hand the browser to the human"** step. Concretely:

- **`validate_handoff`** (or similar) — pauses agent control, exposes the browser viewport to the user for interactive use, then resumes when the user signals done
- The user needs to **see and interact with** the actual Playwright/Chromium instance running in the ACA session
- The agent needs to **wait** for the handoff to complete, then continue using the same browser session

## Why this matters

PCF controls run *inside* Power Apps. You can't fake that context — the DOM structure, the `context.webAPI` auth, the CSS inheritance, the form events. The proxy approach is the only way to test this for real, and it requires a real authenticated browser session. Everything else (service principals, API-only testing) tests the React app in isolation, not the actual deployed control experience.
