# Buggregator Design Guide & UI Specification

> Version: 1.0 | Date: 2026-03-27
> Based on: audit of 70+ components, 2025-2026 trend research, competitor analysis (Linear, Vercel, Raycast, Sentry,
> Datadog)

---

## 1. Design Philosophy

### Direction: "Function-Forward" (inspired by Linear)

Buggregator is a developer debugging tool. The design must be:

- **Dark-first** — primary mode is dark, light theme adapts from it
- **Information-dense, not cluttered** — high data density without visual noise
- **Keyboard-first** — every action reachable via keyboard
- **Content over chrome** — navigation recedes, content dominates
- **Monotype for data** — monospaced font for technical data creates rhythm and readability

### Principles

1. **Hierarchy through brightness, not size** — active content is brighter, supporting elements are muted
2. **One or two accent colors** — saturated color only for critical states
3. **Micro-interactions, not animations** — subtle lifts, soft glows, smooth transitions (200-300ms)
4. **Modular cards** — Bento-grid approach for information blocks
5. **Thin borders or no borders** — separation through elevation (background shade differences)

---

## 2. Expert Panel Review

Five UX specialists reviewed every section of the Buggregator UI based on the full component audit and competitive
research.

### Panel

| Expert      | Role                                | Focus                                                       |
| ----------- | ----------------------------------- | ----------------------------------------------------------- |
| Mia         | Product Designer (B2B SaaS)         | Information architecture, navigation, component consistency |
| Dr. Nielsen | Usability Researcher                | Heuristic evaluation, cognitive load, error prevention      |
| Kai         | Data Visualization Specialist       | Dashboard layout, metric presentation, data density         |
| Aria        | Accessibility & Inclusive Design    | WCAG compliance, keyboard nav, contrast, screen readers     |
| Viktor      | Performance UX / Interaction Design | Perceived speed, loading states, micro-interactions         |

---

### 2.1 Sidebar Review

**Mia (Product Design):**

- The icon-only sidebar forces memorization of 8+ cryptic icons. Linear solves this with text labels that appear at
  wider viewports.
- The project switcher dropdown is well-placed but needs a clearer active state.
- Recommendation: P0 — show text labels at xl+, consistent icon sizing, clear active/hover states.

**Aria (Accessibility):**

- `tabindex="1"` was misused (fixed to `0`). Good.
- No visible focus indicators on sidebar links. Needs `focus-visible` ring.
- Color alone distinguishes active state (`bg-blue-700`). Add a left border or icon weight change for non-color
  indicator.

**Viktor (Interaction):**

- Sidebar collapse should animate width smoothly (200ms ease).
- Connection status icon at the bottom is too subtle. When disconnected, it should pulse or glow red.

### 2.2 Event List Review

**Kai (Data Visualization):**

- The flat chronological list lacks density controls. Developers scanning hundreds of events need a compact mode.
- No timestamp on preview cards forces mental load to gauge recency. The newly added relative timestamps are essential.
- Recommendation: P1 — add compact/table density modes.

**Dr. Nielsen (Usability):**

- No search or filtering violates the "flexibility and efficiency of use" heuristic. This is the #1 usability gap.
- The pause/listen toggle is well-designed but the badge counter could be more prominent.
- "Clear events" button has no confirmation. Risk of accidental data loss.

**Mia:**

- Event type color coding is effective but badges are too small (`text-2xs` at 9.6px was below minimum, now fixed to
  11.2px).
- The left color strip pattern (used by Sentry, Datadog) would add a strong type signal without taking space.

### 2.3 Preview Card Review

**Viktor:**

- Card entrance animation (`grid-template-rows 0fr->1fr`) is smooth. Good.
- Action buttons (copy, download, delete) hidden behind hover is a discoverability problem on touch devices. Fix: always
  visible at md+ (implemented).
- The lock feature is clever but the green locked state needs more contrast against the card background.

**Kai:**

- Footer origin tags (`php: 8.2`, `laravel: 11`, `file: App.php`) are valuable metadata. Keep them but use monospace
  font for values.
- Server name should be visually distinct from origin tags.

**Aria:**

- Delete button needs `aria-label="Delete event"` — icon-only buttons require accessible names.
- Color-coded badges work but should be supplemented with event-type icons for color-blind users.

### 2.4 Settings Page Review

**Mia:**

- Current state: 4 toggles in a sparse grid. Feels unfinished.
- Needs sections: Appearance, Behavior, Editor, About.
- Theme should be a 3-way segmented control (Light/Dark/System), not a binary toggle.
- Code editor dropdown needs a visual preview of what the link will look like.

**Dr. Nielsen:**

- Settings are saved immediately on toggle (no Save button). This is good but needs visual confirmation (subtle flash or
  checkmark).
- The IDE link preview at the bottom is useful but poorly positioned. Should be inline with the dropdown.

**Viktor:**

- Toggle switches feel dated. Use a modern slide toggle with smooth knob animation.
- Add keyboard shortcuts reference section — developers expect this.

### 2.5 Empty State Review

**Mia:**

- Current: logo + 3 links. Identical for all event types. Generic and unhelpful.
- Should be context-aware: show setup instructions specific to the current event type.
- Each type needs a code snippet showing the minimum setup to send that event type.

**Dr. Nielsen:**

- Empty state violates "help and documentation" heuristic. A new user sees no guidance on how to send events.
- Distinguish between "first use" (educational) and "filtered to zero results" (show "clear filters" button).

### 2.6 Event Detail Pages Review

**Mia:**

- Each entity page (Sentry, Ray, Inspector, SMTP, etc.) has different padding, section styling, and header layout.
  Creates jarring context switches.
- Need a shared `EventDetailLayout` wrapper standardizing: header, section titles, padding, table styling.

**Kai:**

- Sentry page is the best-designed entity page. Use it as the reference.
- Inspector timeline is valuable but lacks loading skeleton.
- SMTP email preview with device frames (mobile/tablet/desktop) is excellent. Keep it.

**Viktor:**

- Profiler page (flame chart, call graph, top functions) is well-built after recent enhancements. Needs skeleton loading
  between tab switches.
- SMTP page tabs should show loading state while fetching attachments.

### 2.7 Login & 404 Pages Review

**Aria:**

- Login page has hardcoded `bg-gray-800`. Does not respect theme preference. Fix: use theme-aware classes.
- 404 page uses `font-size: 100px`. Excessive. Reduce to `text-6xl` and add a helpful subtitle.

**Dr. Nielsen:**

- Login page background image adds no value for a dev tool. Replace with clean branded design.
- 404 should have a "Back to events" button, not a plain link.

---

## 3. Color Palette

### Dark Theme (primary)

```
Backgrounds (deepest to surface):
  --bg-deepest:    #0c0e14    (body, sidebar)
  --bg-base:       #111318    (main content area)
  --bg-surface:    #1a1d24    (cards, panels)
  --bg-elevated:   #22262e    (hover states, raised elements)
  --bg-overlay:    #2a2f38    (modals, dropdowns)

Borders:
  --border-subtle:  #1e2128   (card dividers)
  --border-default: #2a2f38   (visible borders)
  --border-strong:  #3a4049   (active/focus)

Text:
  --text-primary:   #e8eaed   (main text)
  --text-secondary: #8b919a   (labels, supporting)
  --text-muted:     #555b65   (hints, timestamps)
  --text-disabled:  #3a3f48

Accents:
  --accent-blue:        #3b82f6  (primary actions, links, active states)
  --accent-blue-subtle: #1d4ed8  (hover on primary)
```

### Light Theme (adapted)

```
Backgrounds:
  --bg-deepest:    #f0f1f3
  --bg-base:       #f8f9fa
  --bg-surface:    #ffffff
  --bg-elevated:   #f3f4f6
  --bg-overlay:    #ffffff

Borders:
  --border-subtle:  #e5e7eb
  --border-default: #d1d5db
  --border-strong:  #9ca3af

Text:
  --text-primary:   #111827
  --text-secondary: #6b7280
  --text-muted:     #9ca3af
```

### Event Type Colors

Each event type has a signature color used for badges, card left-stripe, sidebar icon tint:

```
Sentry:     #f43f5e (rose-500)       — errors, critical
Profiler:   #8b5cf6 (violet-500)     — analysis, performance
SMTP:       #f59e0b (amber-500)      — mail, communication
HTTP Dump:  #22c55e (green-500)      — network, requests
Inspector:  #eab308 (yellow-500)     — inspection, observation
VarDump:    #ef4444 (red-500)        — dump, debug
Monolog:    #6b7280 (gray-500)       — logs, neutral
Ray:        #06b6d4 (cyan-500)       — debug, interactive
```

---

## 4. Typography

### Font Pairing

```
UI text (headings, labels, navigation):
  font-family: "DM Sans", system-ui, sans-serif
  Character: geometric, clean, modern

Technical data (code, metrics, timestamps, badge labels):
  font-family: "JetBrains Mono", ui-monospace, monospace
  Character: crisp, rhythmic, developer-oriented
```

### Size Scale

```
--text-2xs:   0.7rem / 11.2px   (badge labels, fine metadata)
--text-xs:    0.75rem / 12px    (timestamps, metadata, footer tags)
--text-sm:    0.875rem / 14px   (card body text, sidebar labels)
--text-base:  1rem / 16px       (section headings, main content)
--text-lg:    1.125rem / 18px   (page headings)
--text-xl:    1.25rem / 20px    (event detail titles)
--text-2xl:   1.5rem / 24px     (main headings, exception types)
```

### Rules

- Minimum UI text size: **12px** (text-xs)
- Minimum badge/label size: **11.2px** (text-2xs)
- Monospaced font for: code, metrics, timestamps, file paths, URLs, versions
- `font-feature-settings: 'kern' 1, 'liga' 1` on body
- `-webkit-font-smoothing: antialiased` required

---

## 5. Component Specifications

### 5.1 Sidebar

| Property        | Collapsed                                | Expanded (xl+)                             |
| --------------- | ---------------------------------------- | ------------------------------------------ |
| Width           | 56px                                     | 200px                                      |
| Background      | `--bg-deepest`                           | `--bg-deepest`                             |
| Icon size       | 20px                                     | 20px                                       |
| Text labels     | Hidden                                   | Visible (text-xs, font-medium)             |
| Active state    | bg `accent-blue/10`, icon `accent-blue`  | Same + text `accent-blue`                  |
| Hover state     | `--bg-elevated`                          | `--bg-elevated`                            |
| Bottom section  | Connection icon centered, version hidden | Single row: connection left, version right |
| Collapse toggle | Hidden                                   | Visible, chevron icon                      |
| Transition      | 200ms ease                               | 200ms ease                                 |

### 5.2 Preview Card

| Property        | Value                                                         |
| --------------- | ------------------------------------------------------------- |
| Background      | `--bg-surface`                                                |
| Border          | `--border-subtle`, 1px                                        |
| Left stripe     | 3px, event type color                                         |
| Hover           | bg `--bg-elevated`, shadow `card-hover`                       |
| Header left     | Type badge (pill) + labels + relative timestamp (mono, muted) |
| Header right    | Action buttons (always visible md+, hover-reveal mobile)      |
| Footer          | Origin tags (mono values) + server name                       |
| Entry animation | slide-up + fade-in, 200ms                                     |
| Collapsed       | Header only, single line                                      |

### 5.3 Settings Page

```
Sections:
  Appearance
    - Theme: segmented control (Light / Dark / System)
    - Sidebar: segmented control (Expanded / Collapsed)
    - Event counts: toggle

  Behavior
    - Fixed header: toggle
    - Auto-scroll on new events: toggle

  Editor Integration
    - Code editor: dropdown + inline link preview

  Keyboard Shortcuts
    - Reference table (read-only)

  About
    - Server version, Client version
    - Links (GitHub, Docs, Discord)
```

Layout: single column, max-width 640px, section headings (text-xs uppercase tracking-wide text-muted).

### 5.4 Empty State

| Context                   | Content                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| Home (no events)          | Buggregator logo + "Waiting for events..." + pulsing connection indicator + quick links     |
| Type-specific (no events) | Type icon (large, muted) + "No {type} events yet" + setup code snippet + "View docs" button |
| Filtered to zero          | "No events match your filters" + "Clear all filters" button                                 |

### 5.5 Event Detail Layout (shared wrapper)

```
Padding:        px-5 md:px-6 lg:px-8 py-5
Section gap:    space-y-6
Section title:  font-mono, text-xs, uppercase, tracking-wider, text-muted, mb-3
Table rows:     alternating --bg-surface / --bg-elevated, subtle row dividers
```

### 5.6 Login Page

- Respect current theme (dark/light)
- Centered form, max-width 400px
- Logo + heading + SSO button
- Remove decorative background image
- SSO button: primary style (`--accent-blue`)

### 5.7 404 Page

- Reduce "404" to text-6xl (not 100px)
- Add subtitle: "The page you're looking for doesn't exist"
- "Back to events" button instead of plain link

---

## 6. Spacing & Layout

### Spacing Scale

```
4px   — inner padding of small elements (badges)
8px   — gap between inline elements
12px  — card padding (mobile)
16px  — card padding (desktop), gap between cards
24px  — section padding
32px  — gap between page sections
48px  — header height (mobile)
56px  — header height (desktop)
```

### Layout Structure

- Sidebar: fixed, 56px / 200px
- Header: fixed/sticky, 48px / 56px
- Content: fills remaining space, scrollable
- Breakpoints: sm:640, md:768, lg:1024, xl:1280 (Tailwind defaults)

---

## 7. Animation & Transitions

### Timing

```
--duration-fast:    100ms   (hover colors, button press)
--duration-normal:  200ms   (expand/collapse, sidebar, tabs)
--duration-slow:    300ms   (page transitions, modals, banners)
```

### Easing

```
--ease-default:  cubic-bezier(0.4, 0, 0.2, 1)   (general purpose)
--ease-in:       cubic-bezier(0.4, 0, 1, 1)       (element exit)
--ease-out:      cubic-bezier(0, 0, 0.2, 1)       (element entrance)
```

### Patterns

| Interaction          | Animation          | Duration |
| -------------------- | ------------------ | -------- |
| New event arrives    | slide-up + fade-in | 200ms    |
| Card expand/collapse | grid-template-rows | 200ms    |
| Sidebar collapse     | width transition   | 200ms    |
| Card hover           | background-color   | 100ms    |
| Connection banner    | slide-down + fade  | 300ms    |
| Tab switch           | border + color     | 150ms    |
| Button press         | scale(0.98)        | 100ms    |

---

## 8. Accessibility

### Requirements (WCAG 2.1 AA)

- **Contrast**: minimum 4.5:1 for text, 3:1 for large text
- **Focus-visible**: 2px solid `--accent-blue`, offset 2px, on all interactive elements
- **tabindex**: always `0` (never `1`) for custom interactive elements
- **Keyboard**: Tab to navigate, Enter/Space to activate, Escape to close
- **Color-blind safety**: event colors supplemented with icons (not color-only)
- **Touch targets**: minimum 44x44px on mobile
- **Icon-only buttons**: require `aria-label` or `title`

### Focus Management

- Modal/dropdown: trap focus inside
- Sidebar collapse: maintain focus on toggle button
- Event deletion: move focus to next/previous item

---

## 9. Scrollbar & System UI

### Custom Scrollbar

```css
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--border-default);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--border-strong);
}
```

### Selection

```css
::selection {
  background: rgba(59, 130, 246, 0.3);
}
```

---

## 10. Icons

### Size Scale

```
16px (w-4 h-4)  — inline in text, card action buttons
20px (w-5 h-5)  — sidebar navigation (collapsed)
24px (w-6 h-6)  — sidebar navigation (desktop)
32px (w-8 h-8)  — empty state, large indicators
```

### Rules

- All icons use `currentColor` (fill or stroke)
- `flex-shrink-0` on icons in flex containers
- Uniform size within a group (all sidebar icons = same size)

---

## 11. Implementation Roadmap

### Priority 1 — Foundation

- [ ] CSS custom properties for entire palette (replace hardcoded Tailwind colors)
- [ ] Shared `EventDetailLayout` component
- [ ] Settings page redesign
- [ ] Context-aware empty states

### Priority 2 — Productivity

- [ ] Command Palette (Cmd+K) for global search and navigation
- [ ] Keyboard shortcuts (j/k navigation, / for search)
- [ ] Split-pane detail view (event detail in side panel, not separate page)

### Priority 3 — Polish

- [ ] Skeleton loading states instead of bouncing dots
- [ ] Segmented controls in Settings and Profiler toolbar
- [ ] Event list density modes (comfortable / compact / table)
- [ ] Smart auto-scroll with "Jump to latest" badge

### Priority 4 — Advanced

- [ ] Event grouping by request/session
- [ ] Intra-event navigation (prev/next arrows in detail view)
- [ ] Analytics dashboard with sparklines

---

## 12. Component Audit Summary

### Statistics

- **Shared UI**: 13 components
- **Widgets**: 9 components
- **Entity UI**: 70+ components (8 entities x 8-10 each)
- **Pages**: 6

### Key Inconsistencies to Fix

| Issue                             | Where                                            | Solution                                  |
| --------------------------------- | ------------------------------------------------ | ----------------------------------------- |
| Different padding on entity pages | sentry-page, inspector-page, ray-page, smtp-page | Shared EventDetailLayout                  |
| SCSS color map for event types    | preview-card-header.vue                          | Move to CSS variables                     |
| Inconsistent breakpoint patterns  | Various components                               | Standardize: sm/md/lg/xl                  |
| Hardcoded colors                  | login-page, 404-page                             | Use theme-aware classes                   |
| Inconsistent icon sizing          | sidebar, headers, cards                          | Uniform scale: 16/20/24/32px              |
| Different animation timings       | Various components                               | Unified CSS variables for duration/easing |
| Missing aria-labels               | Icon-only buttons throughout                     | Add to all icon-only interactive elements |

---

_This is a living document. Update as changes are implemented._
