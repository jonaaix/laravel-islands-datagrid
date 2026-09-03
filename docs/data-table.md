# The DataTable

The shell: the card, the toolbar, the table with head and rows, the states between them
and the pagination below. Page headers, tabs and side panels go around it.

```vue
<DataTable
    :rows="rows" :meta="meta" :per-page="state.perPage" :col-count="colCount"
    :loading="loading" :error="error" :error-message="t('Could not load invoices')"
    floating-toolbar floating-footer
    @retry="reload()" @page-change="goToPage" @per-page-change="setPerPage"
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
| `rows`, `meta` | required, `{}` | The current page and its metadata. |
| `perPage`, `perPageOptions` | `30`, `[5, 10, 30, 50, 100, 200]` | Page size and the select's choices. |
| `colCount` | required | Number of `<th>`, conditional ones included — drives the `colspan` of skeleton and empty state. |
| `loading`, `error`, `errorMessage` | `false`, `false`, translated | The states. |
| `skeletonRows`, `skeletonCellClass`, `skeletonBarClass` | `10`, `'px-6 py-3'`, `'h-6'` | Shape of the skeleton — match your rows so nothing jumps. |
| `mode` | `'table'` | `table` · `cards` · `list`. |
| `cardsMinWidth`, `cardsGap` | `'260px'`, `'0.75rem'` | The auto-fit grid in cards mode. |
| `bleed` | `false` | Drops rounding and ring for an edge-to-edge table on a phone. |
| `fixedHeight` | `false` | `true`, a number or a CSS length: the card takes that height and the rows scroll inside it. |
| `floatingToolbar`, `floatingFooter` | `false` | Lift toolbar and pagination into floating pills once they would leave the screen. |
| `floatingBreakpoint` | `'(min-width: 768px)'` | Floating bars only above this query. |

Events: `retry`, `page-change(page)`, `per-page-change(value)`. Slots: `toolbar`, `head`
(the `<th>`s; the `<tr>` is supplied), default (the rows), `cards`, `list`, `empty`.

## The Three States

- **Loading** — a skeleton while there are no rows yet; a thin progress bar while rows are
  on screen, which stay put.
- **Empty** — the `#empty` slot. Say why, and offer to clear the filter that caused it.
- **Error** — a banner with the message and a retry button. The toolbar stays usable.

## View Modes

| Mode | Renders | Sorting |
| --- | --- | --- |
| `table` | `#head` and the default slot | `SortButton` in the header |
| `cards` | an auto-fit grid of `#cards` | `SortMenu` in the toolbar |
| `list` | a divided stack of `#list` | `SortMenu` in the toolbar |

Keep `mode` as [client-only](/table-state) state. `useAutoMobileMode({ state, key })`
switches to `list` below 768px and back, unless the user picked a mode themselves.

## Floating Bars and Fixed Height

`floatingToolbar` and `floatingFooter` keep the bars on screen while the page keeps its
own scroll; the originals stay in place so nothing shifts. An app shell with a sticky
header sets `--table-float-top` once on an ancestor. A footer in a view that does not
paginate produces nothing.

`fixedHeight` is the other answer: the table lives in a region of a set size and scrolls
inside it, with the column header stuck to the top. Floating bars switch off.

## Pagination

Rendered whenever `meta.paginated` is truthy: the range and page size on the left, a
sliding window of seven page numbers in the middle (five on a phone) that never changes
width, and a jump-to-page select on the right. `Pagination` is exported for use elsewhere.

## Width and Mobile

Every list root binds `useViewWidth()` — never a `max-w-*` class — so all lists share one
width and the toolbar has a height to be sticky at. `availableWidth` tells you when the
view is narrow.

On a phone the toolbar collapses to one row of icons: search behind a toggle that opens
it as its own row, standard filters moved into the `FilterPanel`, the view-mode strip
hidden, rows bleeding to the edges (`-mx-4` and `:bleed="true"`).
