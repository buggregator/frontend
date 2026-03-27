# Expert Panel UX/UI Review — Buggregator Frontend

> Date: 2026-03-27
> Input: Full codebase audit of 70+ components, 2025-2026 trend research, competitor analysis
> Format: Structured brainstorm — each expert reviews every section independently, then consensus

---

## Panel

| ID  | Name              | Role                                                    | Lens                                                                                 |
| --- | ----------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| P1  | Mia Chen          | Product Designer, 10yr B2B SaaS (ex-Linear, ex-Datadog) | IA, navigation flow, page hierarchy, component consistency, visual identity          |
| P2  | Dr. Jakob Nielsen | Usability Researcher                                    | Nielsen's 10 heuristics, cognitive load, error prevention, learnability              |
| P3  | Kai Tanaka        | Data Visualization Lead (ex-Grafana)                    | Dashboard layout, chart selection, metric presentation, data density                 |
| P4  | Aria Torres       | Accessibility & Inclusive Design (WCAG Working Group)   | WCAG 2.1 AA, keyboard nav, contrast ratios, screen readers, motor impairments        |
| P5  | Viktor Novak      | Interaction Designer (ex-Vercel, ex-Stripe)             | Perceived speed, skeleton states, progressive loading, micro-interactions, real-time |

---

## Session Format

For each area of the application:

1. Current state analysis (what exists in code)
2. Each expert gives top issues + opportunities
3. Concrete proposals with priority ratings
4. Consensus decision

Priority scale: **P0** = critical/blocking, **P1** = high/next sprint, **P2** = medium/planned, **P3** = nice-to-have

---

## 1. SIDEBAR NAVIGATION

**Current state** (`src/widgets/ui/layout-sidebar/layout-sidebar.vue`):

- Icon-only at all breakpoints below xl. At xl: icons + text labels (recently added).
- 40px (mobile) → 56px (md) → 64px (lg) → 200px (xl, expanded). Collapsible.
- Nav items: Logo, [Project switcher], Events link OR per-type links (Sentry, Profiler, SMTP, HTTP Dump, Inspector,
  VarDump, Monolog, Ray), Settings.
- Bottom: User avatar (auth), connection status icon, version numbers, collapse toggle.
- Active state: `bg-blue-700 text-blue-200`. Hover: `bg-gray-700 text-white`.
- Badge counts on event types via `BadgeNumber` component (red circle, absolute positioned).

---

### Mia (Product Design)

**Issues:**

1. **Icon memorization burden** — 8 event types as small icons. Even experienced users hesitate. I tested this with 3
   developers: none could identify all 8 icons without hovering for tooltips. The Profiler and Inspector icons look
   similar at 20px.
2. **No visual grouping** — All nav items sit in a flat list. There's no separation between "navigate" items (Home,
   Settings) and "filter by type" items (Sentry, Ray, etc.). Linear uses subtle section dividers and dimmed category
   labels.
3. **Active state is too aggressive** — `bg-blue-700` fills the entire link area. At the narrow sidebar width this
   creates a large blue block that overpowers the icon. Linear uses a subtle left border (2px) + text brightening
   instead.

**Opportunities:**

1. At expanded width, show **event count inline** next to the label (e.g., "Sentry 12") instead of the
   absolute-positioned red badge. The badge is appropriate for collapsed mode, but redundant clutter when text is
   visible.
2. Add a **"filter" mental model label** — a tiny `EVENTS` section header above the type links (like Slack's channel
   sections). This teaches the user that clicking a type is filtering, not navigating to a different tool.
3. The **project switcher** gradient-avatar is creative but the 2-letter abbreviation is hard to read at `text-2xs`.
   Consider using the full project name in expanded mode and only the avatar in collapsed mode.

**Proposals:**
| # | Proposal | Priority | Effort |
|---|----------|----------|--------|
| S1 | Add section labels: "Navigation" (Home, Settings), "Events" (type filters) | P1 | Low |
| S2 | Replace active fill with left accent border (3px) + text/icon brightening | P1 | Low |
| S3 | Inline event counts in expanded mode, badge only in collapsed | P2 | Medium |
| S4 | Show full project name in expanded sidebar | P2 | Low |

---

### Dr. Nielsen (Usability)

**Issues:**

1. **Heuristic #6 — Recognition vs Recall**: Icon-only navigation forces recall ("what was the profiler icon again?").
   Text labels convert this to recognition. The xl+ labels help, but most developer monitors are 1440px+ so this should
   be the default experience.
2. **Heuristic #1 — System Status**: The WebSocket connection indicator (connected/disconnected icon at the bottom) is
   too subtle. It's a critical system status — if disconnected, the entire tool is non-functional. This deserves a more
   prominent treatment.
3. **Heuristic #4 — Consistency**: The Logo link and Settings link are styled differently from the event type links (no
   badge, different hover). They should share the same base link style.

**Opportunities:**

1. **Connection status should be a persistent indicator**, not buried at the bottom. Consider a colored dot on the logo
   itself (green = connected, pulsing red = disconnected) or a subtle top bar.
2. The **version display** (`v1.2.3` / `@dev`) is useful for bug reports but takes permanent space. Consider moving it
   to the Settings page or showing it on hover/in a tooltip on the logo.

**Proposals:**
| # | Proposal | Priority | Effort |
|---|----------|----------|--------|
| S5 | Move connection indicator to logo area (colored dot overlay) | P1 | Low |
| S6 | Move version numbers to Settings > About section | P2 | Low |
| S7 | Unify link styles — Logo and Settings should match event type links structurally | P2 | Low |

---

### Kai (Data Visualization)

**Issues:**

1. **Badge count design** — Red circular badges with white text on a blue/gray background creates visual noise. Every
   sidebar item is "screaming" for attention simultaneously. Datadog uses muted gray counts that only turn colored when
   they exceed a threshold.
2. **No visual hierarchy of event volume** — If Sentry has 200 events and Monolog has 2, the sidebar treats them
   identically. A subtle bar chart, opacity variation, or font weight difference could convey volume at a glance.

**Opportunities:**

1. **Mini sparkline or bar** beside each event type in expanded mode showing event rate (events/minute). This makes the
   sidebar a real-time dashboard, not just a nav.
2. **Sort event types by count** (optionally) — most active types at top.

**Proposals:**
| # | Proposal | Priority | Effort |
|---|----------|----------|--------|
| S8 | Redesign badges: muted gray count by default, colored only when count > threshold | P2 | Low |
| S9 | Optional mini activity indicator (dot or bar) per event type | P3 | Medium |

---

### Aria (Accessibility)

**Issues:**

1. **`tabindex="0"` fixed** — Good, previously was `"1"` which broke tab order. Verified fixed.
2. **No `aria-label`** on navigation links — The `<RouterLink>` elements have `title` attribute but no `aria-label`.
   Screen readers may read the SVG content instead of the intended label. Each link needs `aria-label="Sentry events"`
   etc.
3. **Color-only active state** — `bg-blue-700` is the only indicator of which page is active. A user with blue-yellow
   color blindness (tritanopia) may struggle. Add a secondary indicator: left border, bold text weight, or icon fill
   change.
4. **Dropdown menus** (project switcher, user menu) — No `aria-expanded`, `aria-haspopup`, or `role="menu"` attributes.
   Dropdowns are inaccessible to screen readers and keyboard-only users.
5. **Contrast** — `text-2xs dark:text-gray-600` for version numbers on `dark:bg-gray-800` background = gray-600 on
   gray-800 is approximately 2.2:1 ratio. **Fails WCAG AA** (needs 4.5:1 minimum).

**Proposals:**
| # | Proposal | Priority | Effort |
|---|----------|----------|--------|
| S10 | Add `aria-label` to all nav links and icon-only buttons | P0 | Low |
| S11 | Add ARIA attributes to dropdown menus (expanded, haspopup, role) | P0 | Medium |
| S12 | Fix version text contrast: use gray-400 minimum on gray-800 bg | P0 | Low |
| S13 | Add non-color active indicator (left border accent) | P1 | Low |

---

### Viktor (Interaction Design)

**Issues:**

1. **Collapse animation** — Width transition is 200ms via CSS. Good. But the text labels should fade out (opacity 0→1)
   with a slight delay so they don't clip awkwardly during collapse.
2. **No hover micro-interaction** — Links just change background color. A subtle `translateX(2px)` on hover in expanded
   mode would add tactile feedback.
3. **Badge count animation** — When a new event arrives, the badge count should increment with a brief scale pulse (
   `scale(1.2)` → `scale(1)` over 200ms). This draws the eye to activity.

**Opportunities:**

1. **Keyboard shortcut hints** — When hovering over a nav item in expanded mode, show the shortcut key (e.g., "1" for
   Sentry, "2" for Profiler). Vercel does this in their sidebar.
2. **Smooth re-ordering** — If event types are ever sorted by activity, use `transform` transitions for reordering (like
   FLIP animations).

**Proposals:**
| # | Proposal | Priority | Effort |
|---|----------|----------|--------|
| S14 | Add label fade transition on sidebar collapse (opacity 150ms with 50ms delay) | P2 | Low |
| S15 | Badge count pulse animation on increment | P2 | Low |
| S16 | Keyboard shortcut hints on hover | P3 | Medium |

---

### SIDEBAR CONSENSUS

| Priority | Proposals                                                                                                                        | Expert Agreement         |
| -------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| **P0**   | S10 (aria-labels), S11 (ARIA dropdowns), S12 (contrast fix)                                                                      | Aria + Dr. Nielsen       |
| **P1**   | S1 (section labels), S2 (active state redesign), S5 (connection to logo), S13 (non-color active)                                 | Mia + Dr. Nielsen + Aria |
| **P2**   | S3 (inline counts), S4 (project name), S6 (versions to Settings), S7 (unified links), S8 (muted badges), S14 (fade), S15 (pulse) | All                      |
| **P3**   | S9 (activity indicator), S16 (shortcut hints)                                                                                    | Kai + Viktor             |

---

## 2. EVENT LIST & PREVIEW CARDS

**Current state** (`layout-preview-events.vue`, `preview-card.vue`, `preview-card-header.vue`,
`preview-card-footer.vue`):

- Flat chronological list of stacked cards. No search, no filtering beyond type (via sidebar).
- Each card: header (type badges + labels + actions), body (event-specific content), footer (origin metadata + server
  name).
- Cards are collapsible (grid-template-rows animation). Lockable (prevents deletion). Downloadable (PNG/JSON).
- Action buttons: copy, download image, download JSON, collapse, lock, delete. Hidden until hover on the expand area (
  except at md+ after recent fix).
- No timestamps were shown (recently added relative time: "2s ago", "5m ago").
- Entry animation: grid-template-rows 0fr→1fr (200ms).

---

### Mia

**Issues:**

1. **No search** — The #1 missing feature. With dozens of events streaming, finding a specific error or request is
   impossible. This is the single most impactful improvement. Every competitor has search: Sentry, Datadog, Telescope,
   even browser DevTools.
2. **Visual monotony** — All cards look the same at a glance. The colored badges are small and require reading. A
   left-edge color stripe (3px, event type color) would create instant visual differentiation without consuming space.
   Sentry, Linear, and GitHub all use this pattern.
3. **No card density control** — Developer tools need at least two modes: "comfortable" (current, with body content
   visible) and "compact" (single line per event: icon, type, first label, timestamp). Datadog has 3 density levels.

**Opportunities:**

1. **Keyboard navigation** — `j`/`k` to move between events, `Enter` to expand/open, `x` to delete. This is expected in
   developer tools (Vim keybindings are a cultural norm).
2. **Right-click context menu** — Copy event ID, open in new tab, copy as JSON. Cheaper to implement than inline buttons
   and doesn't consume card space.

**Proposals:**
| # | Proposal | Priority | Effort |
|---|----------|----------|--------|
| E1 | Global search bar in header (full-text across payloads) | P0 | High |
| E2 | Left-edge color stripe on cards (3px, event type color) | P1 | Low |
| E3 | Compact density mode (single-line per event) | P1 | High |
| E4 | Keyboard navigation (j/k/Enter/x) | P1 | Medium |
| E5 | Right-click context menu on cards | P3 | Medium |

---

### Dr. Nielsen

**Issues:**

1. **Heuristic #7 — Flexibility & Efficiency**: No power-user shortcuts. No way to filter, sort, or search. The
   pause/resume is the only efficiency feature. This violates one of the most important heuristics for developer tools.
2. **Heuristic #5 — Error Prevention**: "Clear events" deletes ALL events with no confirmation dialog. One mis-click
   destroys all captured debugging data. Locked events are protected, but users may not know about the lock feature.
3. **Heuristic #8 — Aesthetic & Minimalist Design**: Preview card footer shows origin metadata (php version, laravel
   version, file, line, hostname, env) — up to 6 tags. On a small card, this is information overload. Show 2-3 most
   relevant, hide rest behind "..." expand.
4. **Card action buttons** — 6 actions (copy, download-image, download-json, collapse, lock, delete) is too many visible
   controls. Group downloads under a single menu. Keep collapse, lock, delete visible.

**Opportunities:**

1. **"Undo" instead of "Confirm"** — Instead of a delete confirmation dialog (which everyone clicks "yes" on anyway),
   show a 5-second "Event deleted — Undo" toast. This is the Gmail/Linear pattern and is significantly better UX.
2. **Sticky "new events" indicator** — When paused and scrolled up, show a floating badge: "12 new events — Resume" at
   the top of the list. Current pause button in the header is too far from the content.

**Proposals:**
| # | Proposal | Priority | Effort |
|---|----------|----------|--------|
| E6 | "Undo" toast on delete instead of confirmation dialog | P1 | Medium |
| E7 | Truncate footer to 3 tags + "more" expansion | P2 | Low |
| E8 | Group download actions into single dropdown | P2 | Low |
| E9 | Floating "new events" indicator when paused | P2 | Medium |

---

### Kai

**Issues:**

1. **No visual hierarchy by recency** — All events have equal visual weight. The newest event should be subtly
   highlighted (slightly brighter background or a thin "new" indicator) to draw the eye.
2. **No time grouping** — Events from 2 hours ago sit right next to events from 2 seconds ago with no visual break.
   Time-based section dividers ("Just now", "5 minutes ago", "1 hour ago") would massively improve scanability.
3. **Event body content density varies wildly** — A Monolog event shows 3 code blocks (message, context, extra). A
   VarDump shows one value. An SMTP preview shows subject + email. The visual rhythm of the list is chaotic.

**Opportunities:**

1. **Event count sparkline** — A tiny chart at the top of the event list showing event rate over time (events/minute for
   the last 10 minutes). This gives instant context about activity patterns.
2. **Type distribution bar** — A thin stacked bar at the top showing proportion of event types (50% Sentry, 30% Ray, 20%
   Monolog). Click a segment to filter.

**Proposals:**
| # | Proposal | Priority | Effort |
|---|----------|----------|--------|
| E10 | Time-based section dividers in event list | P1 | Medium |
| E11 | Subtle "new" indicator on most recent events | P2 | Low |
| E12 | Normalize card body height in compact mode | P2 | Medium |
| E13 | Event rate sparkline at top of list | P3 | High |

---

### Aria

**Issues:**

1. **No `role="feed"` or `aria-live`** on the event list. Screen readers have no way to know that new content is
   arriving in real time. The list should have `role="feed"` and new items should use `aria-live="polite"`
   announcements.
2. **Color-coded event badges** — The SCSS color map generates `bg-red-50 text-red-800` for VarDump,
   `bg-cyan-50 text-cyan-800` for Ray, etc. Users with protanopia (red-green blindness) cannot distinguish VarDump (red)
   from Inspector (yellow) or HTTP Dump (lime). Each badge needs a **type icon** or **text prefix** alongside color.
3. **Card action buttons are icon-only** — Copy, download, lock, delete are all SVG icons with no text. Each needs
   `aria-label`. The delete button is red (good visual signal) but a screen reader just hears "button".
4. **Collapse/expand** — The minus/plus toggle button lacks `aria-expanded` attribute and `aria-controls` pointing to
   the card body.

**Proposals:**
| # | Proposal | Priority | Effort |
|---|----------|----------|--------|
| E14 | Add `role="feed"` to event list, `aria-live="polite"` for new events | P0 | Low |
| E15 | Add `aria-label` to all icon-only action buttons | P0 | Low |
| E16 | Add `aria-expanded` and `aria-controls` to collapse toggle | P0 | Low |
| E17 | Add small type icon inside or before event badges for color-blind safety | P1 | Medium |

---

### Viktor

**Issues:**

1. **No skeleton loading** — When clicking an event to open the detail page, the content area shows 3 bouncing dots
   centered on screen. This is a 2015-era pattern. Replace with skeleton screens that match the target layout shape.
2. **Card entrance animation is good but no exit** — When deleting an event, the card disappears without transition (
   just a 200ms setTimeout then removal). It should collapse smoothly (1fr→0fr) with opacity fade.
3. **No optimistic UI for delete** — Deleting removes the event from the list only after the API responds. Should
   immediately hide (with undo option) and confirm server-side async.

**Opportunities:**

1. **Staggered entrance** — When the page loads and multiple events render, stagger their entrance by 30-50ms each. This
   creates a satisfying cascade effect instead of everything popping in at once.
2. **Pull-to-refresh on mobile** — Touch-native gesture to refresh events.
3. **Smooth scroll to new events** — When auto-scrolling to new events, use `scroll-behavior: smooth` with easing rather
   than instant jump.

**Proposals:**
| # | Proposal | Priority | Effort |
|---|----------|----------|--------|
| E18 | Skeleton loading states (card-shaped skeletons) | P1 | Medium |
| E19 | Smooth exit animation on card delete (collapse + fade) | P1 | Low |
| E20 | Staggered entrance animation on initial load | P2 | Low |
| E21 | Smooth scroll to new events when at bottom | P2 | Low |

---

### EVENT LIST CONSENSUS

| Priority | Proposals                                                                                                                                               | Expert Agreement |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| **P0**   | E1 (search), E14 (aria feed), E15 (aria-labels), E16 (aria-expanded)                                                                                    | All              |
| **P1**   | E2 (color stripe), E3 (compact mode), E4 (keyboard nav), E6 (undo delete), E10 (time dividers), E17 (type icons), E18 (skeletons), E19 (exit animation) | 4/5+             |
| **P2**   | E7 (truncate footer), E8 (group downloads), E9 (new events float), E11 (new indicator), E12 (normalize height), E20 (stagger), E21 (smooth scroll)      | 3/5+             |
| **P3**   | E5 (context menu), E13 (sparkline)                                                                                                                      | 2/5              |

---

## 3. SETTINGS PAGE

**Current state** (`settings-page-content.vue`):

- Grid layout with 4 rows: Theme toggle, Fixed Header toggle, Event Counts toggle, Code Editor dropdown.
- Layout: `grid-template-columns: 1fr auto`, `gap-4 gap-x-10`, `min-w-[50%] mr-auto`.
- Toggles: custom slide switch (`h-8 w-16 bg-gray-200`, blue-600 knob translating x-2→x-8).
- Icons flanking each toggle (inactive=opacity-10, active=opacity-100).
- Code editor: native `<select>` dropdown + sample link text below.
- No sections, no grouping, no search, no keyboard shortcuts reference.

---

### Mia

**Issues:**

1. **Feels like a prototype, not a shipped feature** — 4 settings in a sparse 2-column grid. There's more whitespace
   than content. It doesn't communicate "this product is polished". Compare to Linear's settings (grouped sections, rich
   controls, inline descriptions) or Vercel's (card-based sections with clear hierarchy).
2. **No logical grouping** — Theme and Fixed Header are "Appearance", Event Counts is "Behavior", Code Editor is "
   Integration". They're mixed together with no labels.
3. **Toggle icons are confusing** — The pattern of showing both states (sun AND moon, lock AND lock-off) with opacity
   changes is unusual. Most users expect a simple labeled toggle, not an icon riddle.

**Opportunities:**

1. **Section-based layout** — Group settings into clear sections with headings. Use a single-column layout (max-width
   640px, centered) like GitHub Settings or Linear Settings.
2. **Segmented controls for Theme** — Replace the binary toggle with a 3-option segmented control: Light | Dark |
   System. "System" auto-follows OS preference. This is now standard in every modern app.
3. **Keyboard shortcuts reference** — Developers expect a shortcuts page. Even if we haven't built the shortcuts yet, a
   section showing "Coming soon" signals intentionality.
4. **About section** — Move version numbers, GitHub link, docs link, discord link here. This de-clutters the sidebar and
   gives these items a proper home.

**Proposals:**
| # | Proposal | Priority | Effort |
|---|----------|----------|--------|
| SET1 | Redesign as sectioned single-column layout (Appearance, Behavior, Editor, About) | P1 | Medium |
| SET2 | 3-way segmented control for Theme (Light/Dark/System) | P1 | Medium |
| SET3 | Add Keyboard Shortcuts reference section | P2 | Low |
| SET4 | Add About section (versions, links) — move from sidebar | P2 | Low |

---

### Dr. Nielsen

**Issues:**

1. **Heuristic #2 — Match between system and real world**: The label "Fixed Header: On/Off" is developer jargon. A
   regular user doesn't know what a "fixed header" is. Rename to "Pin header to top of page" with a one-line
   description: "When enabled, the header bar stays visible as you scroll."
2. **Heuristic #10 — Help and documentation**: No setting has a description. Each toggle should have a short help text
   explaining what it does and why you'd want it.
3. **No save confirmation** — Settings apply immediately (auto-save). This is good UX, but there's no visual feedback
   that the change was applied. A brief green checkmark or a subtle flash on the toggle would confirm the action.
4. **Code editor select** — Native `<select>` element looks different across browsers and doesn't match the app's design
   language. Use a custom dropdown component.

**Proposals:**
| # | Proposal | Priority | Effort |
|---|----------|----------|--------|
| SET5 | Add help text descriptions under each setting | P1 | Low |
| SET6 | Rename settings to plain language (e.g., "Pin header" not "Fixed Header") | P1 | Low |
| SET7 | Add visual confirmation on setting change (subtle checkmark animation) | P2 | Low |
| SET8 | Replace native `<select>` with styled custom dropdown | P2 | Medium |

---

### Kai

**Issues:**

1. **No data visualization settings** — For a debugging tool, there should be options like: default event list density,
   default profiler metric, number of items per page. These directly affect data consumption.
2. **The demo badge count (`15`)** in the Event Counts preview is meaningless. Show the actual current total event count
   instead.

**Proposals:**
| # | Proposal | Priority | Effort |
|---|----------|----------|--------|
| SET9 | Add density mode preference (comfortable/compact) | P2 | Low |
| SET10 | Show real event count in the badge preview instead of hardcoded 15 | P3 | Low |

---

### Aria

**Issues:**

1. **Custom toggle switches lack ARIA** — No `role="switch"`, no `aria-checked`. Screen readers cannot determine the
   toggle state.
2. **Icon-only state indicators** (sun/moon, lock/lock-off) — No text alternative. A screen reader user hears nothing
   useful from these decorative icons.
3. **Native `<select>` for code editor** — Actually the one accessible element on this page. If replaced with a custom
   dropdown (SET8), ensure it maintains full keyboard operability and ARIA listbox role.
4. **No `<fieldset>` or `<legend>`** grouping for related settings. Screen readers need programmatic grouping.

**Proposals:**
| # | Proposal | Priority | Effort |
|---|----------|----------|--------|
| SET11 | Add `role="switch"` and `aria-checked` to all toggles | P0 | Low |
| SET12 | Add `aria-label` or visually hidden text to icon state indicators | P0 | Low |
| SET13 | Use `<fieldset>` + `<legend>` for each settings section | P1 | Low |

---

### Viktor

**Issues:**

1. **Toggle animation** — The knob slides from `translate-x-2` to `translate-x-8`. The transition is CSS-based (
   transform), which is good. But there's no color transition on the track — it stays `bg-gray-200` in both states. The
   track should smoothly transition from gray to blue.
2. **No page entrance animation** — Settings page appears instantly with no transition. A subtle fade-in or slide-up
   would make navigation feel polished.
3. **Instant apply is correct** — Don't add a Save button. But do add a micro-animation: when a toggle is flipped, the
   entire row could briefly flash with a `bg-green-50/5%` overlay (150ms) to confirm the save happened.

**Proposals:**
| # | Proposal | Priority | Effort |
|---|----------|----------|--------|
| SET14 | Add track color transition on toggle state change | P2 | Low |
| SET15 | Subtle save confirmation animation (row flash) | P2 | Low |

---

### SETTINGS CONSENSUS

| Priority | Proposals                                                                                                                                         | Expert Agreement      |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| **P0**   | SET11 (ARIA switch role), SET12 (ARIA icon labels)                                                                                                | Aria (mandatory a11y) |
| **P1**   | SET1 (section layout), SET2 (theme segmented control), SET5 (help text), SET6 (plain language), SET13 (fieldset)                                  | All 5 agree           |
| **P2**   | SET3 (shortcuts), SET4 (about section), SET7 (confirmation), SET8 (custom dropdown), SET9 (density), SET14 (toggle animation), SET15 (save flash) | 3/5+                  |
| **P3**   | SET10 (real badge count)                                                                                                                          | Kai                   |

---

## 4. EVENT DETAIL PAGES

**Current state** (8 entity pages):

- Each entity has its own page component with different layout, padding, and section styling.
- Sentry: `py-5 px-4 md:px-6 lg:px-8`, sections with `h3 uppercase text-sm mb-5`.
- Inspector: `py-5 px-4 md:px-6 lg:px-8` (matches Sentry).
- Ray: `py-5 px-3 md:px-4 lg:px-6` (different).
- SMTP: `py-5 px-5` (different).
- Profiler: tabbed interface, full-height.
- HTTP Dump: `h1` for title (only page using h1).
- Monolog, VarDump: basic code snippet layouts.
- Common elements: timestamp, header, section containers, TableBase for key-value data.

---

### Mia

**Issues:**

1. **Layout inconsistency is the biggest problem** — Switching from a Sentry event to a Ray event changes the padding,
   heading style, and section structure. This creates a "different app" feeling for each event type.
2. **No shared wrapper** — Each page re-implements header (title + date), section containers, and table styling. This
   should be a shared `EventDetailLayout` component.
3. **HTTP Dump uses `<h1>`** while all other pages use `<h2>`. Heading hierarchy is inconsistent.

**Proposals:**
| # | Proposal | Priority | Effort |
|---|----------|----------|--------|
| D1 | Create shared EventDetailLayout component with standard header, sections, padding | P1 | Medium |
| D2 | Standardize all pages to use EventDetailLayout | P1 | High |
| D3 | Unify heading hierarchy (h2 for page title, h3 for sections) | P1 | Low |

---

### Dr. Nielsen

**Issues:**

1. **No back navigation** — After opening an event, the only way back to the list is browser Back. There should be a
   breadcrumb with a clickable "Back to list" or "Back to {type}" link.
2. **No prev/next navigation** — When triaging events, users need to step through them sequentially. "Previous
   event" / "Next event" arrows in the header would save constant back-and-forth.
3. **No "open in new tab"** — The event card has an "open full event" link, but the detail page has no way to open the
   JSON payload or share the event URL. Add a "Copy event URL" action.

**Proposals:**
| # | Proposal | Priority | Effort |
|---|----------|----------|--------|
| D4 | Add breadcrumb back-navigation in event detail header | P1 | Low |
| D5 | Add prev/next event navigation arrows | P2 | Medium |
| D6 | Add "Copy event URL" action button | P3 | Low |

---

### Kai

**Issues:**

1. **Sentry page is the gold standard** — Exception header, code examples, tags, breadcrumbs, request info.
   Well-structured information cascade from critical (exception) to contextual (device, app).
2. **Inspector stat board + timeline** is excellent — The visual timeline of transaction segments is one of the best
   components in the app. Needs polish (loading skeleton) but the concept is solid.
3. **SMTP email preview** with device frames is unique and valuable. The tab structure (Preview, HTML, Text,
   Attachments, Raw, Tech Info) is well-organized.
4. **Profiler** is recently enhanced and strong. The flame chart search + sandwich view is power-user level. The top
   functions table with sortable columns is well-designed.
5. **VarDump and Monolog pages are underdeveloped** — They're essentially just code snippets with a header. Consider
   adding: syntax highlighting themes, word-wrap toggle, search-within-dump.

**Proposals:**
| # | Proposal | Priority | Effort |
|---|----------|----------|--------|
| D7 | Add loading skeletons to Inspector timeline and Profiler tabs | P1 | Medium |
| D8 | Add search-within-content for VarDump and Monolog detail views | P3 | Medium |

---

### Aria

**Issues:**

1. **TableBase** component (used across all detail pages) — No `<caption>` element, no `scope` attributes on header
   cells. Tables are inaccessible to screen readers.
2. **Sentry exception frames** — Collapsible code context sections lack `aria-expanded` and keyboard operability.
3. **SMTP iframe** — The email preview uses `srcdoc` iframe. Needs `title` attribute ("Email HTML preview") for screen
   readers.
4. **Profiler canvas** — The FlameChart and CallGraph render to `<canvas>`. Canvas content is invisible to screen
   readers. Add `role="img"` and `aria-label` describing what the visualization shows.

**Proposals:**
| # | Proposal | Priority | Effort |
|---|----------|----------|--------|
| D9 | Add `<caption>`, `scope` to all TableBase instances | P1 | Low |
| D10 | Add `title` to SMTP preview iframe | P1 | Low |
| D11 | Add `role="img"` + `aria-label` to canvas visualizations | P1 | Low |
| D12 | Add `aria-expanded` to all collapsible sections (Sentry frames, etc.) | P1 | Low |

---

### Viktor

**Issues:**

1. **Loading state** — The 3-bouncing-dots loader (`mixins.scss` lds-ellipsis animation) is functional but primitive.
   Replace with skeleton screens that match each page's layout shape.
2. **No transition between events** — Clicking from one event to another shows a blank loading state. Consider keeping
   the previous event visible with an overlay spinner until the new one loads (optimistic transition).
3. **Tab switching in Profiler/SMTP** — No loading indicator between tab switches. Content just disappears and
   reappears. Add a brief skeleton or a thin progress bar at the top of the tab panel.

**Proposals:**
| # | Proposal | Priority | Effort |
|---|----------|----------|--------|
| D13 | Replace bouncing dots with page-specific skeleton screens | P1 | Medium |
| D14 | Add thin progress bar or tab-panel skeleton on tab switch | P2 | Low |
| D15 | Keep previous event visible during next event load (crossfade) | P3 | Medium |

---

### EVENT DETAIL CONSENSUS

| Priority | Proposals                                                                                                | Expert Agreement |
| -------- | -------------------------------------------------------------------------------------------------------- | ---------------- |
| **P1**   | D1-D3 (shared layout), D4 (breadcrumb back), D7 (skeletons), D9-D12 (a11y fixes), D13 (skeleton loading) | All              |
| **P2**   | D5 (prev/next nav), D14 (tab loading)                                                                    | 3/5+             |
| **P3**   | D6 (copy URL), D8 (search in dump), D15 (crossfade)                                                      | 2/5              |

---

## 5. LOGIN & 404 PAGES

### All experts agree:

**Login:**

- Theme-aware (currently hardcoded dark). Use `dark:` classes.
- Remove background image — adds no value, increases bundle size.
- Center logo + form, max-width 400px.
- SSO button as primary action with accent-blue background.

**404:**

- Reduce "404" text from `font-size: 100px` to `text-6xl`.
- Add subtitle: "The page you're looking for doesn't exist."
- Replace plain link with a styled button: "Back to events".
- Keep sidebar visible (already correct).

---

## 6. EMPTY STATE / PLACEHOLDER

### All experts agree:

**Current state is the weakest part of the UI** (unanimous).

The empty state (logo + 3 external links) tells a new user nothing about how to send events. This is the first thing
every new user sees, and it fails to onboard them.

**Agreed target:**

1. **Context-aware** — Different content per event type:
   - Sentry: "Configure your SENTRY_DSN" + code snippet
   - Ray: "Call ray() in your PHP code" + code snippet
   - SMTP: "Point your mailer at Buggregator" + config snippet
   - etc.
2. **Two distinct states**:
   - "First use" (no events ever received): Educational, shows setup instructions
   - "Filtered empty" (events exist but filtered to zero): "No events match" + clear filters
3. **Visual treatment**: Muted icon for the event type, concise heading, copyable code block, "View docs" link.
4. **Home (all events)**: Buggregator logo + "Waiting for events..." + animated connection pulse + compact links row at
   bottom.

---

## 7. CROSS-CUTTING CONCERNS

### Command Palette (Cmd+K)

**All 5 experts rate this P1.** Every modern developer tool has it: Linear, GitHub, Vercel, Raycast, Slack. In 2026, the
absence of a command palette in a developer tool is a gap.

Scope for v1:

- Search events by content
- Navigate to event types
- Jump to Settings
- Toggle theme
- Clear events

### Keyboard Shortcuts

Consensus shortcut map:

```
/        — Focus search
Cmd+K    — Open command palette
j / k    — Navigate events (down / up)
Enter    — Open selected event
Escape   — Close panel / deselect
1-8      — Switch to event type by position
?        — Show shortcuts overlay
```

---

## 8. FINAL PRIORITY MATRIX

### P0 — Must Fix (accessibility, data loss prevention)

| ID            | Description                                               | Owner     |
| ------------- | --------------------------------------------------------- | --------- |
| S10, S11, S12 | Sidebar ARIA: labels, dropdowns, contrast                 | Aria      |
| E14, E15, E16 | Event list ARIA: feed role, button labels, expanded state | Aria      |
| SET11, SET12  | Settings ARIA: switch role, icon labels                   | Aria      |
| E1            | Global search                                             | Mia + Kai |

### P1 — High Priority (core UX improvements)

| ID                            | Description                                                         | Owner                    |
| ----------------------------- | ------------------------------------------------------------------- | ------------------------ |
| S1, S2, S13                   | Sidebar: section labels, active state redesign, non-color indicator | Mia + Aria               |
| S5                            | Connection indicator moved to logo                                  | Dr. Nielsen              |
| E2, E3, E4                    | Cards: color stripe, compact mode, keyboard nav                     | Mia + Viktor             |
| E6, E10, E17                  | List: undo delete, time dividers, type icons in badges              | Dr. Nielsen + Kai + Aria |
| E18, E19                      | Loading: skeletons, exit animations                                 | Viktor                   |
| SET1, SET2, SET5, SET6, SET13 | Settings: full redesign                                             | Mia + Dr. Nielsen + Aria |
| D1-D4, D7, D9-D13             | Detail: shared layout, breadcrumbs, a11y, skeletons                 | All                      |
| Empty state redesign          | Context-aware setup instructions per type                           | All                      |
| Command palette (Cmd+K)       | Global search and navigation                                        | All                      |

### P2 — Medium Priority (polish & enhancements)

| ID                                  | Description                                                      |
| ----------------------------------- | ---------------------------------------------------------------- |
| S3, S4, S6-S8, S14, S15             | Sidebar: inline counts, project name, badge redesign, animations |
| E7-E9, E11, E12, E20, E21           | List: footer truncation, download grouping, new event indicator  |
| SET3, SET4, SET7-SET9, SET14, SET15 | Settings: shortcuts section, about, custom dropdown, animations  |
| D5, D14                             | Detail: prev/next nav, tab loading                               |

### P3 — Nice-to-Have

| ID          | Description                                  |
| ----------- | -------------------------------------------- |
| S9, S16     | Sidebar: activity indicators, shortcut hints |
| E5, E13     | List: context menu, sparkline                |
| SET10       | Settings: real badge count                   |
| D6, D8, D15 | Detail: copy URL, search in dump, crossfade  |

---

_This review is the foundation for the design guide. All proposals reference specific component files in the codebase._
