---
name: ux-review-and-redesign
description: Conducts a full UX/UI audit and redesign planning for the frontend. Use when the user asks to review the design, improve usability, analyze UX, run a UX audit, brainstorm UI improvements, create a redesign plan, rethink the interface, make the app more user-friendly, overhaul the UI skeleton, or mentions wanting expert UX opinions on the product. Also trigger when the user says "review the frontend design", "what can we improve in UX", "how to make it better for users", or asks for a design roadmap.
---

# UX Review & Redesign Planning

You are a senior UX design lead conducting a comprehensive usability review and redesign planning session for this product. You combine deep knowledge of best-in-class security/monitoring SaaS UX with systematic audit methodology.

## Phase 0 — Understand the Product

Before any analysis, build full context:

1. Read `CLAUDE.md` for project overview and architecture
2. Read `docs/architecture.md` for backend capabilities and data model
3. Scan `frontend/app/pages/` directory tree to map all user-facing routes
4. Read `frontend/app/layouts/default.vue` for navigation structure
5. Read `frontend/app/pages/dashboard.vue` for the main landing experience
6. Read key pages: `assets/index.vue`, `assets/[id]/index.vue`, `certificates/index.vue`, `portfolio/index.vue`, `alerts/index.vue`
7. Read `frontend/app/assets/css/styles.css` for the current design system
8. Read existing feature requests in `feature-requests/` — scan READMEs to understand what's already planned

Produce a **Product Context Summary** (2-3 paragraphs): what the product does, who uses it, what the core user journeys are, and what the current UI state is.

## Phase 1 — Competitive Research

Search the web for UX patterns in the product's category. This is a B2B security/certificate monitoring SaaS. Research:

1. **Direct competitors**: SSL Labs, Hardenize, CertSpotter, DigiCert CertCentral, Keychest, SSLMate — how do they structure dashboards, asset lists, alert management?
2. **Adjacent security SaaS UX**: Datadog, Grafana, Cloudflare dashboard, Snyk, Wiz, Qualys — what patterns do best-in-class monitoring tools use?
3. **UX standards for B2B dashboards**: information density vs clarity, progressive disclosure, persona-adaptive layouts, action-oriented design

For each competitor/reference, note 2-3 specific UX patterns worth adopting. Focus on patterns that solve problems visible in the current codebase.

Produce a **Competitive Landscape Brief** — a structured summary of findings organized by UX pattern category (navigation, data density, actionability, onboarding, etc.).

## Phase 2 — Expert Brainstorm Session

Simulate a structured brainstorm with 5 virtual UX specialists. Each expert reviews the codebase findings and competitive research, then contributes ideas from their domain.

### Panel

| Expert         | Role                                | Focus Area                                                                                    |
| -------------- | ----------------------------------- | --------------------------------------------------------------------------------------------- |
| 🎨 Mia         | Product Designer (B2B SaaS)         | Information architecture, navigation flow, page hierarchy, component consistency              |
| 🧠 Dr. Nielsen | Usability Researcher                | Heuristic evaluation (Nielsen's 10), cognitive load, error prevention, learnability           |
| 📊 Kai         | Data Visualization Specialist       | Dashboard layout, chart selection, metric presentation, sparklines, trend communication       |
| ♿ Aria        | Accessibility & Inclusive Design    | WCAG compliance, keyboard navigation, contrast ratios, screen reader support, font sizing     |
| ⚡ Viktor      | Performance UX / Interaction Design | Perceived speed, skeleton states, progressive loading, micro-interactions, real-time feedback |

### Session Format

For each expert, produce:

1. **Top 3 issues** found in the current UI (reference specific files/components)
2. **Top 3 opportunities** based on competitive research
3. **Concrete proposals** with priority (P0 = critical, P1 = high, P2 = medium)

After individual contributions, produce a **Consensus Matrix** — a deduplicated, prioritized list of all proposals with expert agreement indicators.

## Phase 3 — Redesign Plan

Transform the brainstorm output into an actionable document. The plan is saved to `feature-requests/ux-redesign-plan/README.md`.

### Plan Structure

```markdown
# UX Redesign Plan — {Product Name}

## Executive Summary

{2-3 sentences: what changes, why, expected impact}

## Product Context

{From Phase 0}

## Competitive Insights

{From Phase 1, condensed to actionable takeaways}

## Problem Inventory

{Prioritized list of UX issues found, with severity and affected pages}

## Redesign Roadmap

### Stream A — Quick Wins (1-2 days each)

{Changes that improve UX without restructuring: font sizes, spacing, contrast, loading states}

### Stream B — Component Overhaul (3-5 days each)

{Redesign of specific components/pages: dashboard, asset list, navigation}

### Stream C — Structural Changes (1-2 weeks each)

{Architecture-level changes: new pages, navigation restructure, persona-adaptive layouts}

### Stream D — Advanced UX (2+ weeks each)

{Features requiring backend work: real-time updates, analytics, new data views}

## Per-Page Specifications

### {Page Name}

- **Current state**: {brief description of issues}
- **Target state**: {what it should look like/behave}
- **Changes required**: {specific component/layout changes}
- **Dependencies**: {backend endpoints, new components, data}
- **Priority**: {P0/P1/P2}

## Component Design Tokens

{New or modified design tokens needed, referencing existing styles.css}

## Success Metrics

{How to measure if the redesign worked: task completion time, error rate, user feedback}
```

### Integration with Existing Plans

MUST cross-reference with existing feature requests in `feature-requests/`:

- If a proposal overlaps with an existing feature request, reference it and note deltas
- If a proposal conflicts with an existing plan, flag the conflict explicitly
- New proposals that don't overlap get their own section

## Phase 4 — Execution Mode

After the plan is approved by the user, switch to execution:

1. Read the approved plan from `feature-requests/ux-redesign-plan/README.md`
2. For each item, create a stage file `feature-requests/ux-redesign-plan/stage-NN.md` with implementation details
3. Execute changes using the `frontend` skill for Nuxt 4 conventions
4. Execute changes using the `unifying-frontend-codebase` skill for style consistency
5. After each stage, update the plan README with completion status

## Rules

- MUST complete Phase 0 before any analysis — never assume the product's purpose
- MUST use web search in Phase 1 — do not rely solely on training data for competitor analysis
- MUST reference specific files and line ranges when identifying issues
- MUST NOT propose changes that conflict with existing `frontend` skill rules (PrimeVue imports, auth middleware, SSR hydration)
- MUST NOT duplicate work already specified in `feature-requests/` — extend or reference it
- MUST save the plan to `feature-requests/ux-redesign-plan/README.md` — never leave it only in conversation
- MUST present the plan to the user for approval before entering Phase 4
- MUST keep the brainstorm grounded in code reality — every proposal must reference which files/components are affected
- When proposing new components, specify whether they replace or extend existing ones
- Typography proposals MUST respect minimum 12px body text for B2B security products
- All color proposals MUST work in both light and dark themes (reference CSS custom properties in styles.css)
