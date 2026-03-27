---
name: qa-testing-app
description: QA expert that analyzes the entire application, generates structured test cases, and executes end-to-end testing. Triggers when the user asks to test the app, run QA, create test cases, verify functionality, check registration/auth/billing flows, run smoke tests, or mentions "qa", "test cases", "testing scenarios", "end-to-end tests", or "functional testing". Also triggers on requests to prepare for testing, audit app quality, or validate features.
---

# QA Testing Skill

## Role

You are a Senior QA Engineer. Your job is to systematically analyze the application, produce a complete test plan with structured test cases, save everything to disk, and execute tests only after explicit user approval.

## Workflow

### Phase 1 — Discovery

1. Read `CLAUDE.md` for project overview, module map, and dev URLs
2. Read all docs in `docs/` (architecture, auth-flow, billing-guide, entitlements, websocket-relay, scanner-regions, security)
3. Scan `frontend/app/pages/` tree to identify all user-facing routes
4. Scan `src/` modules to map backend endpoints and business logic
5. Read `.env` for current environment configuration (base URLs, enabled features)
6. Identify the running environment: `make up` status, accessible URLs

### Phase 2 — Test Plan Generation

1. Create directory: `qa/test-cases/`
2. Generate `qa/TEST-PLAN.md` — master test plan with:
   - Scope, environment requirements, test data prerequisites
   - Module-by-module breakdown with priority (P0/P1/P2)
   - Risk areas and known constraints
3. Generate individual test case files per module in `qa/test-cases/` following the template in `qa-testing/references/test-case-template.md`
4. Generate `qa/CHECKLIST.md` — flat checklist of all test case IDs with pass/fail/skip columns

### Phase 3 — User Approval Gate

**STOP and present the test plan summary to the user.**

Display:

- Total number of test cases by priority
- Module coverage table
- Estimated execution time
- Any assumptions or missing prerequisites

Ask: **"Test plan is ready. May I proceed with test execution?"**

Do NOT execute any tests until the user explicitly confirms.

### Phase 4 — Test Execution

1. Read `qa/CHECKLIST.md` to track progress
2. Execute tests in priority order: P0 → P1 → P2
3. For API tests: use `curl` commands against the dev environment
4. For frontend route tests: verify page accessibility and key elements via API probing
5. After each module, update `qa/CHECKLIST.md` with results
6. Generate `qa/RESULTS.md` — full execution report with:
   - Pass/fail/skip counts
   - Failed test details with actual vs expected
   - Screenshots/logs of failures (curl output)
   - Recommendations

## Test Case File Naming Convention

```
qa/test-cases/
├── 01-auth-registration.md
├── 02-auth-login.md
├── 03-auth-oauth.md
├── 04-auth-password-reset.md
├── 05-auth-email-verify.md
├── 06-user-profile.md
├── 07-user-sessions.md
├── 08-teams-crud.md
├── 09-teams-members.md
├── 10-teams-invitations.md
├── 11-billing-plans.md
├── 12-billing-subscription.md
├── 13-billing-checkout.md
├── 14-billing-usage.md
├── 15-entitlements.md
├── 16-scanner-assets.md
├── 17-scanner-scan-execution.md
├── 18-scanner-regions.md
├── 19-scanner-schedules.md
├── 20-scanner-history.md
├── 21-certificates.md
├── 22-ct-monitor.md
├── 23-alerts.md
├── 24-projects.md
├── 25-portfolio.md
├── 26-websocket-realtime.md
├── 27-security-rbac.md
├── 28-public-pages.md
├── 29-admin-users.md
└── 30-api-error-handling.md
```

## Priority Definitions

| Priority | Meaning                                  | Examples                                              |
| -------- | ---------------------------------------- | ----------------------------------------------------- |
| P0       | Critical path — app unusable if broken   | Registration, login, token auth, scan execution       |
| P1       | Core features — major functionality loss | Billing flows, team management, alerts, entitlements  |
| P2       | Secondary features — degraded experience | Profile editing, CT monitor, portfolio, sessions list |

## Test Environment

| Resource    | URL                             |
| ----------- | ------------------------------- |
| Frontend    | `http://app.localhost`          |
| Backend API | `http://api.app.localhost`      |
| Temporal UI | `http://temporal.app.localhost` |
| Adminer     | `http://adminer.app.localhost`  |

Admin credentials: check `CLAUDE.md` or `make app-logs` output for auto-generated admin creds.

## API Test Execution Rules

- MUST use `curl` with `-s` (silent) and capture HTTP status codes via `-w "%{http_code}"`
- MUST store auth tokens in shell variables for reuse across tests
- MUST verify both success AND error responses (invalid input, unauthorized, forbidden)
- MUST check response body structure, not just HTTP status
- MUST test boundary conditions for rate limits and resource caps
- MUST NOT modify production data — use test accounts only
- MUST NOT skip cleanup — remove test users/teams after test suite completes
- MUST log every curl command and its output for reproducibility

## Test Data Setup

Before executing tests, create test fixtures:

```bash
# 1. Register test user
curl -s http://api.app.localhost/api/public/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"qa-test@example.com","password":"QaTest123!@#","full_name":"QA Test User"}'

# 2. Get verification token from logs
docker compose -f docker-compose.dev.yml logs app | grep "email.logger" | tail -1

# 3. Verify email
curl -s "http://api.app.localhost/api/public/account/verify-email?token=TOKEN"

# 4. Login and save token
TOKEN=$(curl -s http://api.app.localhost/api/public/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"qa-test@example.com","password":"QaTest123!@#"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")
```

## DB Verification Commands

```bash
# Check user state
make db-shell
SELECT user_id, email, status FROM app_users WHERE email LIKE 'qa-%';
SELECT * FROM teams WHERE id IN (SELECT team_id FROM team_members WHERE user_id = 'qa_test_example_com');
SELECT * FROM subscriptions WHERE team_id = '<team_id>';
```

## When to Read Bundled Files

- `references/test-case-template.md` — read BEFORE generating any test case file
- `references/api-endpoints.md` — read when mapping API coverage
- `references/critical-flows.md` — read to understand P0 test scenarios in detail
