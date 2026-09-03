# The DataTable

`DataTable` is the shell: the card, the toolbar area, the table with its header and rows,
the states between them and the pagination below. Page headers, tabs and side panels go
around it; columns, rows and cards go into its slots.

```vue
<DataTable
    :rows="rows"
    :meta="meta"
    :per-page="state.perPage"
    :col-count="colCount"
    :loading="loading"
    :error="error"
    :error-message="t('Could not load invoices')"
    floating-toolbar
    floating-footer
    @retry="reload()"
    @page-change="goToPage"
    @per-page-change="setPerPage"
>
    <template #toolbar>…</template>
    <template #head>…</template>
    <InvoiceRow v-for="row in rows" :key="row.id" :row="row" />
    <template #empty>…</template>
</DataTable>
```

## Props

| Prop | Default | Purpose |
| --- | --- | --- |
| `rows` | required | The rows of the current page. |
| `meta` | `{}` | Pagination metadata from the response. |
| `perPage` | `30` | The current page size — bind `state.perPage`. |
| `perPageOptions` | `[5, 10, 30, 50, 100, 200]` | Choices of the per-page select. |
| `colCount` | required | Number of `<th>` in the head, conditional ones included. Drives the `colspan` of skeleton and empty state. |
| `loading` | `false` | Shows the skeleton when there are no rows, the progress bar when there are. |
| `error` | `false` | Shows the error banner. |
| `errorMessage` | `t('Could not load data')` | The banner text. |
| `skeletonRows` | `10` | Rows the table skeleton draws. |
| `skeletonCellClass`, `skeletonBarClass` | `'px-6 py-3'`, `'h-6'` | Shape of the skeleton cells — match them to your rows so nothing jumps when the data lands. |
| `mode` | `'table'` | `table` · `cards` · `list`. See [View Modes](#view-modes). |
| `cardsMinWidth`, `cardsGap` | `'260px'`, `'0.75rem'` | The auto-fit grid in cards mode. |
| `cardSkeletonHeight`, `cardSkeletonCount` | `'240px'`, `8` | The cards skeleton. |
| `listSkeletonHeight`, `listSkeletonCount` | `'64px'`, `10` | The list skeleton. |
| `bleed` | `false` | Drops the card's rounding and ring for an edge-to-edge table on a phone. |
| `fixedHeight` | `false` | Gives the card a height and scrolls the rows inside it. See [Fixed Height](#fixed-height). |
| `floatingToolbar` | `false` | Lifts the toolbar into a floating pill once it would leave the screen. |
| `floatingFooter` | `false` | Same for the pagination. |
| `floatingBreakpoint` | `'(min-width: 768px)'` | Floating bars only above this media query. |
| `floatTopOffset`, `floatBottomOffset` | `12`, `12` | Distance of the floating bars from the viewport edge, in pixels. |

Extra classes land on the card.

## Events

| Event | Payload | Wire to |
| --- | --- | --- |
| `retry` | — | `reload()` |
| `page-change` | page number | `goToPage` |
| `per-page-change` | the select's value, a string | `setPerPage` |

## Slots

| Slot | Purpose |
| --- | --- |
| `#toolbar` | The controls above the table. Rendered a second time inside the floating pill when `floatingToolbar` is on. |
| `#head` | The `<th>` elements. The `<tr>` is supplied. |
| default | The `<tr>` rows, in table mode. |
| `#cards` | The cards, in cards mode. |
| `#list` | The rows, in list mode. |
| `#empty` | Shown when a response carried no rows and there is no error. |

## The Three States

Every list has them from day one; they are not polish.

**Loading.** With no rows yet, a skeleton in the shape of the table — as many rows as
`skeletonRows`, cells shaped by the skeleton classes. With rows on screen, a thin
progress bar at the bottom of the card, and the rows stay put.

![The skeleton while the first request runs](/screenshots/skeleton.webp)

**Empty.** The `#empty` slot, in a full-width cell. Say why, and offer the way out — a
filter matched nothing, so offer to clear it:

![The empty state offering to clear the search that caused it](/screenshots/empty.webp)

```vue
<template #empty>
    <div class="py-12 text-center">
        <p class="text-gray-500">{{ t('No products match your search.') }}</p>
        <Button v-if="activeFilterCount || state.q" tone="secondary" size="sm" class="mt-3" @click="resetFilters(); clearSearch()">
            {{ t('Clear search') }}
        </Button>
    </div>
</template>
```

**Error.** A banner with the message and a retry button that emits `retry`. The toolbar
stays usable, so a user can change the filter that produced the failure.

![The error banner with its retry button](/screenshots/error.webp)

## View Modes

`mode` switches what the shell renders below the toolbar:

| Mode | Renders | Sorting |
| --- | --- | --- |
| `table` | `<table>` with `#head` and the default slot | `SortButton` in the header |
| `cards` | An auto-fit grid of the `#cards` slot, `cardsMinWidth` per column | `SortMenu` in the toolbar |
| `list` | A divided stack of the `#list` slot | `SortMenu` in the toolbar |

![The same list in cards mode](/screenshots/cards.webp)

Toolbar, error banner and pagination are the same in every mode. Keep `mode` as a
[client-only](/table-state#client-only-state) state key and switch it from an
`OptionStrip` in the toolbar; on a phone, [`useAutoMobileMode`](/responsive#automatic-list-mode)
switches to `list` by itself.

```vue
<template #cards>
    <Card v-for="row in rows" :key="row.id" :href="row.url">…</Card>
</template>

<template #list>
    <InvoiceListRow v-for="row in rows" :key="row.id" :row="row" />
</template>
```

## Floating Bars

A long list scrolls its toolbar and its pagination off the screen. `floatingToolbar` and
`floatingFooter` lift them into glass pills that follow the viewport once the originals
would leave it — while the page keeps its own scroll, and the originals stay in place so
nothing shifts.

![The pagination bar floating over the rows](/screenshots/pagination.webp)

A bar floats only above `floatingBreakpoint`, only while at least a little of the table is
still on screen, and only when it has content. `floatingFooter` in a view that does not
paginate produces nothing.

An application shell with a sticky header of its own sets the offsets once, as CSS
custom properties on an ancestor, so no view has to know what floats above it:

```css
.fi-main {
    --table-float-top: 76px;
    --table-float-bottom: 12px;
}
```

## Fixed Height

The other answer to a long list: a table that lives in a region of a set size rather
than on a page that scrolls. `fixedHeight` gives the card a height of its own and lets the
rows scroll inside it — toolbar above, column header stuck to the top of the scroll
region, pagination below, all three always on screen.

| Value | Effect |
| --- | --- |
| `true` | Takes the room left below the card's top edge, so the table ends at the bottom of the window. Re-measured on resize; never below 240px. |
| a number | That many pixels. |
| a string | Used as is — `'45vh'` for two tables sharing a screen. |

The floating bars switch themselves off; a table that never leaves the screen has nothing
to lift. Off by default: a list normally scrolls with its page.

## Toolbar Height

The toolbar is sticky at the top of the card and reads its minimum height from
`--table-toolbar-h`, which `useViewWidth()` publishes on the island root. That is what
keeps the toolbar the same height across every list, whether it holds two controls or
eight — see [Responsive & Mobile](/responsive#view-width).
