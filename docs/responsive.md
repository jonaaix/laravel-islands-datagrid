# Responsive & Mobile

A list designed for a 1536px desk does not shrink into a phone; it changes shape. The
package supplies the pieces — a shared view width, an automatic list mode, a toolbar
that collapses — and this page shows how they fit together.

<div style="max-width: 390px; margin: 1.5rem 0;">

![The same product list on a phone: a row of icons for a toolbar, rows in list mode, edge to edge](/screenshots/mobile.webp)

</div>

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

A toolbar of seven or eight controls reads as one line at 1536px. At 390px it would wrap
into three rows and push the first record below the fold. Narrow, it collapses instead
to **one row of four icons**: a search toggle on the left, and the cluster that was already
icons on the right. Everything that is not an icon leaves.

**Search collapses to its icon and comes back as a row of its own.**

```vue
<IconButton class="sm:hidden" :label="t('Search')" size="lg" :tone="searchOpen ? 'active' : 'quiet'" :tooltip="false" @click="toggleSearch">
    <IconSearch />
</IconButton>

<SearchInput
    ref="searchInput"
    class="max-sm:order-1 max-sm:basis-full"
    :class="!searchOpen && 'max-sm:hidden'"
    :model-value="state.q"
    @update:model-value="onSearchInput"
    @clear="clearSearch()"
/>
```

```js
function toggleSearch() {
    searchOpen.value = !searchOpen.value;
    if (searchOpen.value) nextTick(() => searchInput.value?.focus());
}
```

`basis-full` gives the field the whole row and `order-1` puts that row *under* the icons,
so the controls keep their place. Focusing on open saves the second tap.

**The standard filters go to the panel; they do not wrap.** Every filter `Combobox` and
the quick-filter strip carry `max-sm:hidden`, and the `FilterPanel` becomes the only
filter surface — with tabs to tell the standard set from the advanced one:

```vue
<FilterPanel …>
    <template v-if="isNarrow" #tabs>
        <Tabs :items="[{ key: 'standard', label: t('Filters') }, { key: 'advanced', label: t('More') }]" v-model="filterTab" />
    </template>
    …
</FilterPanel>
```

**The view-mode strip goes** (`max-sm:hidden`). `useAutoMobileMode` has already decided
the mode; a switch beside it offers a choice the view overrules on the next resize.

**Sort, views, columns and the filter toggle stay** — they are icons at `size="lg"`
already, and four of them fit a 390px row beside the search toggle.

**The rows bleed.** `-mx-4` on the `DataTable` plus `:bleed="true"` drop the card's
rounding, ring and side padding, so a 390px screen spends all 390 on content.

**The tab strip keeps its tabs and loses its words.** Give the label to the chosen tab
only and let the rest keep their icon and count — all stay on screen, switching is still
one tap:

```vue
<span :class="isNarrow && state.tab !== tab.key ? 'sr-only' : ''">{{ tab.label }}</span>
```

`sr-only` rather than `v-if`, so the word is still there for a screen reader and leaves
no gap behind. This holds to about five tabs; beyond that the strip belongs in a menu.

## Floating Bars on a Phone

Floating bars are off below `floatingBreakpoint` (768px by default) — a glass pill over
a 390px screen covers too much of it. The pagination stays at the end of the list, where
a phone reader expects it.
