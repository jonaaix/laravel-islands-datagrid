# Responsive & Mobile

A list designed for a 1536px desk does not shrink into a phone; it changes shape. The
package supplies the pieces — a shared view width, an automatic list mode, a toolbar
that collapses — and this page shows how they fit together.

## View Width

Every list root binds `useViewWidth()` from the base package, never a `max-w-*` class:

```vue
<script setup>
import { useViewWidth } from '@aaix/laravel-islands-datagrid/vue';

const { root, rootStyle, availableWidth } = useViewWidth();
const isNarrow = computed(() => availableWidth.value < 640);
</script>

<template>
    <div ref="root" :style="rootStyle" class="island-view mx-auto w-full">…</div>
</template>
```

It holds the one maximum every list shares, publishes `--table-toolbar-h` for the sticky
toolbar and the floating bars, and reports `availableWidth` — the room the view actually
has. That is the honest measure of "narrow": a folded-out sidebar and a zoomed page take
room away exactly as a smaller screen does. Prefer it over media queries for decisions in
the template, and where a `max-sm:` utility is used anyway, hold both to the same number.

A view with a `FilterPanel` uses [`useFilterPanelDock`](/toolbar#filterpanel) instead,
which wraps the same helper.

## Automatic List Mode

Rows of a table do not fit a phone; the same rows as a list do. `useAutoMobileMode()`
switches `state.mode` when the screen crosses a breakpoint and back when it returns:

```js
import { useAutoMobileMode } from '@aaix/laravel-islands-datagrid/vue';

const { isNarrow, markChosen } = useAutoMobileMode({
    state,
    key: 'invoices',
    breakpoint: '(max-width: 767px)',
    narrow: 'list',
    remember: true,
});

function setMode(mode) {
    state.mode = mode;
    markChosen();
    syncUrl();
}
```

| Option | Default | Purpose |
| --- | --- | --- |
| `state`, `key` | required | The table state and a name for this list's session storage. |
| `breakpoint` | `'(max-width: 767px)'` | The media query that means narrow. |
| `narrow` | `'list'` | The mode to switch to. |
| `wide` | `null` | The mode to restore; `null` restores whatever was active. |
| `remember` | `false` | Remember the last wide mode across the switch. |

A mode the user picked themselves — through `markChosen()`, or a `?mode=` in the URL —
is respected: the initial auto-switch is suppressed for that session. The `list` mode
renders the `#list` slot of `DataTable`, see [View Modes](/data-table#view-modes).

## The Toolbar With No Room

A toolbar of seven or eight controls reads as one line at 1536px; at 390px it would wrap
into three rows. Narrow, it collapses to **one row of four icons** instead:

- **Search** collapses to an icon and comes back as a row of its own below the icons
  (`max-sm:order-1 max-sm:basis-full` on the `SearchInput`, focused on open).
- **Standard filters** move into the `FilterPanel` (`max-sm:hidden` on the comboboxes),
  which gains a `#tabs` slot to tell the standard set from the advanced one.
- **The view-mode strip goes** — `useAutoMobileMode` has already decided the mode.
- **Sort, views, columns and the filter toggle stay** — they are icons at `size="lg"` already.
- **The rows bleed:** `-mx-4` on the `DataTable` plus `:bleed="true"`.
- **The tab strip keeps its tabs and loses its words:** give the label to the chosen tab
  only, `sr-only` on the rest, so all stay on screen and switching is one tap.

Floating bars are off below `floatingBreakpoint` (768px by default); the pagination stays
at the end of the list, where a phone reader expects it.
