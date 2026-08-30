########## START FILE: guidelines/design-system.md ##########
# Design System

This project's visual decisions. Principles live in `ux-principles.md`, concrete class
recipes in `.ai/reference/ui-patterns.md` — read it before building UI.

**Reference view:** `app/Islands/ProductsList`. When something here is unclear, follow how
that view solves it.

## Visual language

We adapt shadcn/ui by hand in Tailwind — the package is not installed.

- **Radius scale:** cards `rounded-xl`, pills `rounded-md`, icon boxes `rounded-lg`,
  floating bars `rounded-full`.
- **Flat rings, no shadows on cards.** Shadows are reserved for things that genuinely float,
  where the shadow is what lifts them.
- **Padding `p-3`–`p-5`.** Wasteful padding looks dated.
- **Dark mode is native.** Never ship a background, text, border or ring class without its
  `dark:` variant.

## Colour

- **Derive, don't hardcode.** Accents come from the active primary via HSL hue shifts
  (+60°, +120°, +180°, plus a desaturated muted variant). Hex values only as sentinels the
  theme layer replaces.
- **Neutrals for the chrome.** Text, borders and disabled states stay true gray.

## Icons

- **Heroicons only.** Outline 24 is the default. Solid mini 20 is sanctioned for compact
  toolbar strips, where outline strokes go blurry and read as faded. Pick a lane per strip
  and stay in it — never mix within one strip.
- **Every icon is its own component** with a stable name and fixed viewBox. Never inline
  `<svg>` in a consumer; that forks the visual set between callsites.
- The datagrid ships its own toolbar icons from `@aaix/laravel-islands-datagrid/vue` —
  islands import them rather than redrawing.
- **Icon boxes only beside a heading or a stat value.** In tabs, buttons, cells and hover
  affordances icons ship bare.

## Controls

**36px (`h-9`) for every control a pointer aims at** — inputs, select triggers, comboboxes,
dropdown buttons, the pills beside them. One height across toolbar and panel, so a row of
controls reads as one line.

Set the height, never the vertical padding — padding drifts with the line height and stops
matching when the font changes.

Two deliberate exceptions: micro-controls stay smaller, and multi-line fields grow from 36
rather than starting taller.

## Stacking order

One ladder for the whole app, so a new layer never lands under an old one. A panel *beside*
content belongs under the toolbar it scrolls past, not above it.

| Layer | z |
| --- | --- |
| Panels beside content | 10 |
| Table toolbar, floating bars | 20 |
| Filament topbar | 30 |
| Dropdown backdrop / menu | 60 / 61 |
| Modal | 70 |
| Tooltip | 9999 |

## Motion

| What | Duration | Curve |
| --- | --- | --- |
| Panel unfolding | 350ms | `cubic-bezier(0.22, 1, 0.36, 1)` |
| Content fading in behind it | 260ms | ease-out |
| Floating bar in / out | 180 / 160ms | ease-out / ease-in |
| Hover affordances | 500ms | ease-out |
| Tooltip | 120ms | ease |

## Tables

- One `<table>` look per view: frame on the wrapper, internals in a single class wrapped in
  `:where()` so a utility class on a cell still wins.
- **Seven page numbers.**

## Formatting

Numbers, dates, money and weights go through `@shared/format.js` — `formatCurrency`,
`formatDate`, `formatRelative`, `formatWeight`. Figures use `tabular-nums`.
Times display in the user's timezone, 24-hour format — never the server's.

## Photos

**Always 3∶2.** Grid or single scrolling row, remembered per user. Card size is the user's
choice; width is never enforced beyond 100% of the space. Full-resolution downloads are
named after the record, not the position — reordering must not make two downloads collide.

## Charts (ApexCharts)

Fixed pixel height (`height: 300`), never `'100%'` — that feeds back with flex parents.
Primary series uses the derived primary, further series the derived palette. Grid colours
adapt to dark mode, legend on top, labels inherit the font family.

## Alerts

Inside the view, never as a toast: a tinted block with an icon, a bold first line naming the
state, one sentence for the consequence. It sits next to what it talks about. Amber warns,
emerald confirms, a quiet variant carries neutral information.

## Modals

Three parts, both edges drawn: header with title and close button above a
`border-b border-gray-200 dark:border-white/10`, content, footer above a
`border-t border-gray-200 dark:border-white/10 pt-4`. Cancel (`tone="secondary"`) left of
the primary action (`tone="cta"`), both at default size — never `size="sm"` in a modal
footer. Laravel Islands and Filament both ship modal helpers — use them rather than
rebuilding this by hand.

## Destructive actions

File deletion is refused outside production: local and staging read the production storage,
so deleting there would remove the file from the live shop. The action stays available and
reports what it did instead of pretending to have worked: `{ deleted: n, blocked: n }`, and
the view says so plainly.


########## END FILE: guidelines/design-system.md ##########

########## START FILE: guidelines/tall-architect.md ##########
# Role: TALL Stack Engineer & Architect
You work on this codebase — architecture, implementation, and review.

## Modes
### Discussion (default)
Clarify, propose, name trade-offs. No file writes. Snippet requests stay here — isolated code only.
### Implementation (on request)
Atomic, scoped, no adjacent cleanup.
### Switching
Explicit instruction only. Ambiguous → ask. After the change, back to discussion.

## Tech Stack Standards
PHP >= 8.5, Laravel >= 13.x, Filament >= 5.x, Livewire, Alpine.js, Tailwind CSS >= 4.x, Vue.js >= 3.x

## Code Style
- **PSR-12 Compliance:** All PHP code must strictly adhere to PSR-12
- Follow clean code after Robert C. Martin's principles.
- **NEVER ADD ANY CODE COMMENTS OR DOCBLOCK, except:**
    1. Very complex abstract mathematical algorithms that absolutely need explanation. => Block comment
    2. Structural dividers in very long code files (e.g.: // ----- Step: 1: Doing X ... -----, // ----- Step: 2: Doing Y ... -----) => Single line comment
    3. A deliberate restriction that would otherwise look like a bug or oversight — hardcoded value, skipped case, narrowed scope. State why, never what. => Single line comment
    4. Array shapes / generics that PHP types cannot express. => Docblock
- Existing comments stay, unless they are neither necessary under the rules above nor a marker (`TODO`, `NOTE`, …) or tool directive.
- `*_id` is always an internal FK. Any other reference uses `*_ref`.
- Jobs must be suffixed with `Job`.
- Enums must be suffixed with `Enum`.
- Commands must use the suffix `Cmd` instead of `Command` or nothing.
- **Enums vs Constants:** Use PHP backed enums for typed values that need methods (e.g., `label()`, `icon()`). Use `const` classes for simple key-value lookups (IDs, disk names, icons). Follow existing conventions — both patterns coexist in this codebase.

## i18n & UI
- Prepare all strings for translations using Laravel's default translation function `__('...')`. The English text is the translation key. However don't create JSON translation keys if you are not explicitly asked for it. Keep API response messages in English only.
- Never use the native html title attribute as tooltip. Use a proper tooltip component.
- SVG is always wrapped in a component. Never inline SVG markup — reuse the existing icon component or create one.
- Custom UI follows Tailwind UI (or adapted Tailwind UI) style. Don't mix in other UI styles.

## Architectural Standards
- **Modular Monolith:** New feature areas belong in a local package, not the root app. Packages may use shared root capabilities; implementation and boundaries stay outside root. Before writing code that adds a new area to root, name it and propose the module — the user decides.
- **Filament vs. Islands:** Filament for CRUD record management (list, create, edit, delete). Islands (`aaix/laravel-islands`, tables via `aaix/laravel-islands-datagrid`) for full Vue views and stateful widgets — own state, server-driven data, subscriptions. Alpine for local interactivity inside Filament (toggles, modals, small UI state). Outside Filament, Blade + Alpine is the default — propose an island when state, server data or subscriptions are involved.

### Decomposition & Reuse
- **Soft limit ~500 lines per file**, hard limit ~1500. These are warnings to reassess, not mandates to split. A coherent 800-line Filament Resource beats six fragmented 150-line files connected by parameter chains.
- **Split when it actually pays off.** Extract when there is a clear coherent unit with a stable interface (a card, a form section, a service method with few args and a focused return). Don't split just to hit a line count — fragmentation that creates indirection, prop-drilling, or scattered logic is worse than a longer file.
- **Reuse before building.** Search project components first — `resources/views/components/`, `app/Services/`. For islands and data tables, consult the `laravel-islands` and `laravel-islands-datagrid` skills with their component indexes and blueprints. Name what you found and why it does or doesn't fit. Copy-pasting an existing pattern instead of using it is worse than a long file.
- **Name by role, not by location.** `<x-stat-tile>` not `<x-dashboard-top-row-item>`; `InvoiceTotalCalculator` not `OrderPageHelper`. Role names survive moves; location names don't.

## Behavior & Interaction
- Never add or remove features proactively; always confirm it explicitly with the user first.
- Interact in the user's language, produce strictly in English.
- Ask when the answer depends on it — missing context, ambiguous scope, unclear domain logic. Don't ask what the codebase can tell you.
- When multiple topics are open and the user picks one, drop the others until they bring them back.

## Workflow
- **Never destroy or reset the dev database** — no `migrate:fresh`/`refresh`/`reset`, `db:wipe`, rollbacks, dropped tables, however broken the schema looks. It may hold cleaned data pending export. Fix forward with a new migration or ask. A separate test database is yours to manage.
- Prefer official `artisan` / Filament generators over manual file creation. Name the command.
- **Migration timestamps:** never chain migration-creating commands with `&&` or `;` — identical timestamps. One command, wait, next.
- When troubleshooting, read the log and reproduce (Tinker, test, or route) before proposing a cause. Don't guess.
- When files are created or moved, show the target tree — in the plan and before writing.
- Prefer MCP over shell execution when both can do it.
- Create your own test user `Claude` / `claude` if you need app access.

### Git
- **Commits at feature boundaries.** One commit per feature, never per file or per edit. An uncommitted prior feature stays its own unit.
- **Commit messages:** `Area: Subject` in English, imperative, no period. Area is the module, island or resource, spelled as in the codebase; `Build`, `Deps` or `Docs` when there is no domain. Body only when the *why* isn't obvious from the diff.
- **Branches:** work on the active branch, never directly on `main`. `main` ← `dev` ← `feature`, merged with merge commits. No force push, no rebase of shared branches.

## Contract
Discussion by default. Reuse before building. Never reset the dev database.


########## END FILE: guidelines/tall-architect.md ##########

########## START FILE: guidelines/ux-principles.md ##########
# UX Principles

Portable rules for admin panels and ERPs. No framework, no project specifics.
Rules of thumb — deviate knowingly, not by accident.

## State & feedback

- **Three states, always.** Loading shows a skeleton in the target's shape, never a spinner
  on an empty page. Errors say what failed and offer retry. Empty says why, and offers to
  clear the filter that caused it.
- **Reserve the room before the data arrives**, or the container unfolds to a sliver and jumps.
- **What the user just did stays on screen** until the server echoes it back.
- **Confirmation never moves the layout** — the message replaces the value in place.

## Data display

- **Never truncate a value in a table.** Let the region scroll; a clipped part number is
  worse than a scrollbar. Ellipsis is for prose.
- **Fixed-width figures**, so columns don't jitter as numbers change.
- **Format centrally** — never by hand, never with a hardcoded locale.
- **Relative time in lists, absolute where the exact moment matters** — never both in one column.
- **Density beats spacing in data-dense views.** More per screen wins over generous padding.

## Colour & status

- **Status overrides theme.** Red is wrong, amber is worth a look, green is fine, grey means
  nothing is known. A green brand colour must never break "wrong is red".
- **Colour where the status *is* the message** — tint the whole surface, not just a dot.
  **Shape where the surface must stay quiet** (toolbars, tab strips): a neutral outlined
  icon with the wording in the tooltip.
- **One verdict, one source.** The same helper decides colour, sentence and icon.

## Actions

- **Every number is a door.** If a value summarises something, clicking it leads there.
- **Edit in place** — no detail page for a single field, and the affordance stays quiet.
  Same contract everywhere: Enter saves, Esc cancels, modifier+Enter for multi-line, a
  spinner in the value's place, errors replacing the value rather than sitting beside it.
- **Confirm what cannot be undone, and only that.** Cancel, Escape and a click outside all
  mean no.
- **The whole control is the target**, not the words in it.
- **Two tiers of action:** attention-worthy gets a tint, repeat actions stay neutral,
  saturated brand colour is for one-off CTAs. Micro-controls stay small enough not to
  compete with content.
- **Dropdowns over button rows** beyond three options.
- **One thing open per row.** Opening a second closes the first; switching siblings keeps
  the active tab.
- **Icon-only buttons carry an accessible label** and a tooltip with the same words. Never
  a native `title` tooltip.
- **A drop target is the whole region**, with an outline and one line of text saying what
  dropping will do.
- **Modals have three parts:** a header naming what this is, the content, and a footer
  carrying the actions. Actions never hang off the last field.
- **A form modal always has a close affordance in the header**, even when a cancel action
  exists — clicking outside is often blocked to prevent data loss.

## Motion

Movement explains a change; it never announces itself.

- **What appears must also disappear.** An animated entrance with an abrupt exit reads as
  a glitch.
- **Rows have no height to animate.** Grow a shell inside them instead.

## Navigation & persistence

- **Deep-link the view, not the page.** Expanded row, active tab, filters, page and sort
  belong in the URL.
- **View choices are remembered per user, not per browser.** Cache locally, but the server
  owns the value.
- **Give the scroll position back.** Rows arrive after the page, so native restore lands at
  the top — remember it and re-apply once the content has taken its space.
- **Prefetch on intent.** Resting on a control briefly starts loading what a click would
  need; share in-flight requests, abort when the pointer leaves, never on touch.

## Layout

- **Auto-fit over fixed grids.** Don't hardcode column counts unless content demands it.
  Equal heights within a row.
- **Keep the page's natural scroll.** Never turn a table into an inner scroll container to
  pin its header — let toolbars float above the rows once they would leave the screen, with
  the originals staying in place so nothing shifts.
- **Sliding pagination window.** A window that slides rather than grows, so buttons don't
  move under the pointer. Arrows keep their distance from the numbers.
- **Filters beside the table** where the viewport allows, floating over it when not — never
  above the table's own toolbar.

## Components & wording

- **Two call sites is a coincidence, three is a component.** Search before building; a
  near-duplicate is worse than a long file.
- **Wording never goes into a shared component.** It takes labels as props — the
  application owns the strings.
- **Every string goes through the translation layer**, English as the key.


########## END FILE: guidelines/ux-principles.md ##########

########## START FILE: reference/ui-patterns.md ##########
# UI Patterns

Concrete class recipes for this project. Decisions and rationale live in
`.ai/guidelines/design-system.md`.

## Card surface

```html
<div class="rounded-xl bg-white ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-white/10">
```

## Buttons

- **CTA (one-off):** `bg-primary-600 hover:bg-primary-500 text-white font-medium shadow-sm`
- **Primary, persistent:** `bg-primary-100 text-primary-800 hover:bg-primary-200
  dark:bg-primary-500/15 dark:text-primary-200 dark:hover:bg-primary-500/25`
- **Secondary:** `bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800
  dark:text-gray-300 dark:hover:bg-gray-700`
- **Outline / ghost:** transparent with `ring-1 ring-gray-200`
- **Destructive:** `bg-red-600 hover:bg-red-500 text-white`, only behind a confirmation

## Icon boxes

- **Prominent** (beside a stat number), 40×40 box, SVG 20×20:
  `flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10`
- **Inline** (beside an h3), 28×28 box, SVG 16×16:
  `flex h-7 w-7 items-center justify-center rounded-md bg-primary-50 dark:bg-primary-500/10`

## Field groups

Related values read as one object: segments in a shared frame, hairline dividers, a caption
above each value. Tint the whole group when its state is the message.

```html
<div class="flex w-fit divide-x overflow-hidden rounded-lg ring-1 ring-gray-200">
  <div class="min-w-[100px] px-4 py-2.5">
    <p class="text-[10px] font-medium uppercase tracking-wide text-gray-500">Stock</p>
    <p class="mt-0.5 text-sm font-medium text-gray-900">Sold out</p>
  </div>
</div>
```

## Floating bars

```css
border-radius: 9999px;
background-color: rgb(255 255 255 / 0.8);          /* dark: rgb(17 24 39 / 0.8) */
backdrop-filter: blur(28px) saturate(180%);
box-shadow: 0 0 0 1px rgb(0 0 0 / .08),            /* dark: rgb(255 255 255 / .12) */
            0 4px 12px -2px rgb(0 0 0 / .26),
            0 28px 64px -12px rgb(0 0 0 / .62);
```

A hairline holds the edge, the shadows do the lifting — on a dark page the shadow has
nothing left to darken, so the edge keeps the bar from sinking into the rows.

## Tabs (underline)

```html
<button class="flex items-center gap-1.5 border-b-2 border-transparent px-4 py-2.5 text-sm
               font-medium text-gray-500 hover:text-gray-700
               dark:text-gray-400 dark:hover:text-gray-300"
        :class="active && 'border-primary-500 text-primary-600 dark:text-primary-400'">
```

Icon leads, label follows, a count or status icon trails in grey.

## Typography

- h1 `text-2xl font-bold tracking-tight` (lg `text-3xl`), h2 `text-base font-semibold`
- Body `text-sm text-gray-700 dark:text-gray-300`
- Muted `text-xs text-gray-500 dark:text-gray-400`
- Caption above a value `text-[10px] font-medium uppercase tracking-wide text-gray-500`

## Badges & pills

`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium`, status colours from
Tailwind's named palette. Micro pills: `px-1.5 py-0.5 text-[10px] font-medium rounded`.

## Dividers

Between sections `border-b border-gray-200 dark:border-white/10`, inside compact lists
`divide-y divide-gray-100 dark:divide-white/10`.


########## END FILE: reference/ui-patterns.md ##########
