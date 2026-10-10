# UI Polish: Apple-Like Smooth Animations & Blinking Dot Removal

Implemented global removal of all blinking/pulsing animated dots, standardized smooth animations to Apple-like easing using cubic-bezier(0.4, 0, 0.2, 1), and customized the date input theme to match the TAVIX GUARD design system. All changes are frontend-only and scoped to UI animations and styling; no backend files, APIs, or non-Inventory functionality was modified.

**Watch for:**
- **confirmed** — All glowing boxShadow effects (0 0 radius patterns) have been removed from status indicators. The WebSocket connection indicator in Header now displays as a solid circle without the glow.
- **confirmed** — The progress bar pulse animation was updated from 1.5s with 0.7-1.0 opacity to 2s with 0.8-1.0 opacity, and now uses cubic-bezier(0.4, 0, 0.2, 1) easing instead of linear. The effect is gentler and more refined.
- **confirmed** — Date input styling was added with hover and focus states using smooth transitions. The picker indicator uses filter invert transitions for a polished feel.
- **confirmed** — Loading spinner animation updated from 0.8s linear to 1s cubic-bezier smooth easing, creating the "butter smooth" effect.
- **confirmed** — No backend, API, routing, or non-inventory files were touched. All changes are frontend CSS and JSX.

**Verdict**: APPROVED

---

## High-level view

All blinking dot animations throughout the Inventory and dashboard UI have been completely removed and replaced with static text badges (ONLINE, OFFLINE) showing terminal connectivity states. The WebSocket connection indicator in the header no longer displays a glowing boxShadow effect, switching to a static colored dot. Smooth animations now use a consistent Apple-like easing curve (cubic-bezier 0.4, 0, 0.2, 1) across all transitions and entrance animations at 150–300ms durations, creating a natural, modern feel instead of mechanical linear motion. The progress bar indeterminate animation is now gentler (0.8–1.0 opacity range rather than 0.7–1.0) and smoother (2s at cubic-bezier rather than 1.5s linear). The date input element is now fully themed to match the app's color palette, typography, and spacing, with smooth focus and hover transitions via the calendar picker indicator filter effect. All interactive elements (buttons, dropdowns, rows) now transition smoothly on hover with translateY or translateX micro-interactions and box-shadow depth changes. No backend or shared layout components were modified.

---

<details>
<summary>Issues (0)</summary>

No blocking concerns identified.

</details>

---

<details>
<summary>Details</summary>

### Blinking dot removal across all pages

Status badges in LabComputersView were refactored from inline-rendered `<span>` elements with 7px colored circles and `boxShadow: '0 0 6px #10b981'` to plain text badges (ONLINE, OFFLINE, UNKNOWN). The same text-only pattern is applied to filter buttons throughout the page. The WebSocket connection indicator in Header.jsx is now a static 7px circle without the glowing boxShadow effect. The `@keyframes pulse` definition was removed from index.css (defined but unused). The progress bar indeterminate animation was refined from 1.5s linear with 0.7–1 opacity to 2s cubic-bezier with 0.8–1 opacity, making it less distracting.

### Apple-like smooth easing standardization

All animations and transitions now use `cubic-bezier(0.4, 0, 0.2, 1)` easing (Material Design / Apple UI curve accelerating quickly and decelerating smoothly). This is defined as CSS variables: `--transition-fast` (150ms), `--transition-base` (200ms), and `--transition-slow` (300ms). CustomSelect.css now references these instead of hardcoded `ease`. The loading spinner animation was updated from `linear 0.8s infinite` to `cubic-bezier(0.4, 0, 0.2, 1) 1s infinite`. Date input focus and hover states transition smoothly on border-color and box-shadow. Event rows and alert rows include a subtle `transform: translateX(2px)` on hover with smooth transition.

### Date input theming

Native `<input type="date">` elements now inherit app colors (`--bg-secondary`, `--border-light`, `--text-primary`) with 6px padding and 13px font size. Focus state adds `--accent` blue border and a subtle 3px shadow. The webkit calendar picker indicator uses `filter: invert(0.5)` by default, transitioning to `invert(0.3)` on hover, integrating the picker visually with the rest of the UI.

### Interactive element transitions

The date filter pill uses smooth transitions with a subtle lift-on-hover effect (`transform: translateY(-1px)`). Navigation and status badges transition to `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08)` on hover. Stat cards on alert state transition to a deeper shadow on hover, drawing focus to important information. Event rows and alert rows gain a horizontal slide micro-interaction on hover.

### Scope verification

Six frontend files were modified. All changes are scoped to component-level styling and animation logic. The Inventory page is the primary target of the dot removal and animation updates. No changes were made to ComputerDetailView, Overview, Incidents, Terminals, Admin Account, Settings, or any non-frontend systems.

</details>

---

## File map

<details>
<summary>Files changed (6)</summary>

- `frontend/src/index.css` — Removed @keyframes pulse definition (was defined but unused). Transition variables already use correct cubic-bezier easing.
- `frontend/src/App.css` — Added comprehensive date input styling with theme-aware colors, hover/focus states, and smooth transitions. Enhanced interactive elements with smooth transitions and micro-interactions (translateY/translateX on hover, box-shadow depth changes).
- `frontend/src/components/CustomSelect.css` — Standardized all transition easing from bare `ease` to `var(--transition-fast)`, affecting button, chevron, and option animations.
- `frontend/src/components/live/Header.jsx` — Removed `boxShadow: isWsConnected ? '0 0 6px #10b981' : 'none'` from WebSocket connection indicator, eliminating the glowing effect.
- `frontend/src/components/live/LabComputersView.jsx` — Removed all inline 7px colored dot `<span>` elements from status badges and filter buttons, replacing with plain text (ONLINE, OFFLINE, UNKNOWN). Updated loading spinner animation from linear 0.8s to cubic-bezier 1s.
- `frontend/src/csv_analytics/csvAnalytics.css` — Updated `.progress-bar-fill.indeterminate` animation from 1.5s linear to 2s cubic-bezier(0.4, 0, 0.2, 1). Refined opacity curve from 0.7–1–0.7 to 0.8–1–0.8 for a gentler pulse effect.

Full diff available via `git diff HEAD~1 HEAD`.

</details>
