---
name: e2e-testing
description: Write and run Playwright end-to-end tests for the Buggregator frontend. Use when the user asks to create e2e tests, test navigation flows, verify page transitions, test links, or validate UI interactions across pages. Also triggers on "e2e", "playwright", "end-to-end", "integration test", "navigation test".
---

# E2E Testing Skill — Buggregator

## Role

You write and run Playwright e2e tests that verify real user flows against a running Buggregator instance (Docker). Tests live in the **server** repo, not the frontend repo.

## Architecture

```
buggregator/
├── server/
│   ├── docker-compose.yaml      # Buggregator + Examples app
│   ├── Dockerfile
│   └── e2e/
│       ├── playwright.config.ts
│       ├── package.json          # @playwright/test dependency
│       └── tests/
│           ├── helpers.ts        # Shared utilities
│           ├── events.spec.ts    # Existing module tests
│           └── *.spec.ts         # Your new tests go here
├── frontend/
│   └── dist/                     # Built frontend (mounted into Docker)
└── examples/
    └── app/                      # Laravel demo app with all integrations
```

### Services

| Service     | URL                     | Purpose                                |
| ----------- | ----------------------- | -------------------------------------- |
| Buggregator | `http://localhost:8000` | Main app (Go server + frontend)        |
| Examples    | `http://localhost:8080` | Laravel app that generates test events |

### Docker Setup

The `docker-compose.yaml` mounts `frontend/dist` into the container. Always build the frontend before starting Docker:

```bash
# From frontend/
npx vite build

# From server/
docker compose up -d
```

Verify both services:

```bash
curl -s http://localhost:8000 | head -1   # Should return HTML
curl -s http://localhost:8080 | head -1   # Should return HTML
```

## Helpers (`tests/helpers.ts`)

```typescript
import { triggerExample, clearEvents, openBuggregator, waitForEvents, navigateTo } from './helpers'
```

| Function                                  | Purpose                                               |
| ----------------------------------------- | ----------------------------------------------------- |
| `triggerExample(action, route?)`          | POST to Examples app to generate an event             |
| `clearEvents()`                           | DELETE all events via API                             |
| `openBuggregator(page)`                   | Navigate to `http://localhost:8000` and wait for load |
| `waitForEvents(page, minCount, timeout?)` | Poll API until N events exist                         |
| `navigateTo(page, section)`               | Click sidebar link by text                            |
| `getEventCount(type?)`                    | Get event count from API                              |

## Available Test Actions

Events are generated via the Examples Laravel app using `triggerExample(action)`:

### Sentry

| Action                     | What it sends                                                    |
| -------------------------- | ---------------------------------------------------------------- |
| `sentry:event`             | Exception with message (captureMessage)                          |
| `sentry:report`            | Exception with stack trace (report)                              |
| `sentry:trace`             | Transaction with db.query + http.client + cache.get spans        |
| `sentry:trace_with_error`  | Transaction with error span + RuntimeException                   |
| `sentry:logs`              | Raw Sentry log envelope (5 log items)                            |
| `sentry:model_not_found`   | ModelNotFoundException                                           |
| `sentry:validation`        | ValidationException                                              |
| `sentry:with_context`      | Exception with user/tags/extra context                           |
| `sentry:nested_exceptions` | Chained exceptions (InvalidArgumentException → RuntimeException) |
| `sentry:database_error`    | Database query error                                             |
| `sentry:type_error`        | TypeError                                                        |

### Other Modules

| Action                                              | Module    |
| --------------------------------------------------- | --------- |
| `ray:string`                                        | Ray       |
| `monolog:error`                                     | Monolog   |
| `var_dump:array`                                    | VarDumper |
| `smtp:welcome_mail`                                 | SMTP      |
| `inspector:request`                                 | Inspector |
| `profiler:report` (route: `/example/call/profiler`) | Profiler  |
| `http:post`                                         | HTTP Dump |

SMS events are sent directly via POST to `http://localhost:8000/sms/twilio`.

## Writing Tests

### Test File Template

```typescript
import { test, expect, Page } from '@playwright/test'
import { triggerExample, clearEvents, openBuggregator, waitForEvents } from './helpers'

const BUGGREGATOR = 'http://localhost:8000'

test.describe.configure({ mode: 'serial' })

test.describe('Feature Name', () => {
  test.beforeAll(async () => {
    await clearEvents()
    await triggerExample('sentry:trace_with_error')
    await waitForEvents(undefined as unknown as Page, 1)
  })

  test('description of what user does', async ({ page }) => {
    await openBuggregator(page)
    // ... test steps
  })
})
```

### Key Patterns

#### Wait for events from API (not page)

```typescript
// waitForEvents needs a Page param but only uses API — pass undefined
await waitForEvents(undefined as unknown as Page, 1)
// Or wait with extra time for structured data processing
await new Promise((r) => setTimeout(r, 3000))
```

#### Navigate to a module section

```typescript
await openBuggregator(page)
await page.locator('a').filter({ hasText: 'Sentry' }).first().click()
await page.waitForTimeout(1500)
```

#### Wait for a card to appear

```typescript
await expect(page.locator('.preview-card').first()).toBeVisible({ timeout: 15_000 })
```

#### Find a specific event type card

```typescript
// By CSS class (type is part of the class)
const sentryCard = page.locator('.preview-card--type-sentry').first()
const profilerCard = page.locator('.preview-card--type-profiler').first()
```

#### Click an event to open detail

```typescript
// Body link (inside the card content)
await page.locator('.preview-card a').first().click()

// "Open full event" header button
await page.locator('.preview-card a[title="Open full event"]').first().click()
```

#### Check URL patterns

```typescript
// Sentry event detail (two possible patterns due to named route vs path match)
expect(page.url()).toMatch(/\/sentry\/(event\/)?[0-9a-f-]+/)

// Sentry sub-pages
expect(page.url()).toContain('/sentry/exceptions')
expect(page.url()).toContain('/sentry/traces')
expect(page.url()).toContain('/sentry/logs')

// Trace detail
expect(page.url()).toMatch(/\/sentry\/traces\/[0-9a-f]+/)

// Generic event detail
expect(page.url()).toMatch(/\/(sentry|ray|monolog|profiler)\/[0-9a-f-]+/)
```

#### Conditional tests (data may or may not exist)

```typescript
const tracesTab = page.locator('a').filter({ hasText: 'Traces' }).first()
if (await tracesTab.isVisible().catch(() => false)) {
  await tracesTab.click()
  // ... assertions
}
```

#### Fetch event IDs from API

```typescript
const res = await fetch(`${BUGGREGATOR}/api/events?type=sentry`)
const json = await res.json()
const eventId = json.data?.[0]?.uuid
```

### Sentry-Specific Selectors

| Element                 | Selector                                                           |
| ----------------------- | ------------------------------------------------------------------ |
| Sub-nav tabs            | `a` filtered by `hasText: 'Exceptions'` / `'Traces'` / `'Logs'`    |
| Timeline/Grouped toggle | `text=Timeline`, `text=Group by type`                              |
| Waterfall/Map toggle    | `text=Waterfall list`, `text=Service map`                          |
| Trace card              | `.trace-card`                                                      |
| Exception group card    | `.exc-group`                                                       |
| Log filter chips        | `button` filtered by `hasText: /^all$/i`, `/^error$/i`, etc.       |
| Span detail tabs        | `button` filtered by `hasText: 'Related Errors'`, `'Related Logs'` |
| Waterfall op badges     | `text=db.query`, `text=http.client`, `text=http.server`            |
| Log level badge         | `.log-row__level`                                                  |

### Sentry Route Map

| URL                       | What renders                         |
| ------------------------- | ------------------------------------ |
| `/sentry`                 | Redirects to `/sentry/exceptions`    |
| `/sentry/exceptions`      | Exception list (Timeline or Grouped) |
| `/sentry/traces`          | Trace list or Service map            |
| `/sentry/traces/:traceId` | Trace detail with waterfall          |
| `/sentry/logs`            | Log list with level filters          |
| `/sentry/event/:id`       | Event detail page (dedicated route)  |
| `/sentry/:id`             | Redirects to `/sentry/event/:id`     |

## Running Tests

```bash
# Install dependencies (first time)
cd server/e2e && npm install

# Build frontend + start Docker
cd frontend && npx vite build
cd server && docker compose up -d

# Run all e2e tests
cd server/e2e && npx playwright test

# Run specific test file
npx playwright test tests/sentry-navigation.spec.ts

# Run with visible browser
npx playwright test --headed

# List tests without running
npx playwright test --list

# Run specific test by name
npx playwright test -g "Related Errors"
```

## Rules

- **ALWAYS** `clearEvents()` in `beforeAll` to start with a clean slate
- **ALWAYS** use `test.describe.configure({ mode: 'serial' })` — tests within a describe share state
- **NEVER** hardcode event UUIDs — they change on every run
- **ALWAYS** wait for events via API polling before checking the page
- **ALWAYS** add `await page.waitForTimeout()` after navigation (1000–2000ms)
- **ALWAYS** use `.catch(() => false)` with `.isVisible()` when element may not exist
- **ALWAYS** build frontend before running tests: `npx vite build`
- **NEVER** test against `localhost:4173` (that's Vite preview, not Docker)
- Test files go in `server/e2e/tests/`, NOT in `frontend/`
- Use `text=` locators for visible text, `.class` for CSS classes
- Prefer conditional assertions (`if visible`) over hard assertions for data-dependent UI
- Keep tests focused on navigation flows and link correctness, not pixel-perfect UI
