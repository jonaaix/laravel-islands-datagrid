# Pagination

`DataTable` renders the pagination bar below the rows whenever `meta.paginated` is
truthy, and again in the floating footer when `floatingFooter` is on. The component
behind it is exported for a view that needs it elsewhere.

![The pagination bar: range and page size on the left, a sliding window of pages in the middle, jump-to-page on the right](/screenshots/pagination.webp)

## Layout

Three groups, always in the same place:

- **Left:** "31 – 60 of 240" from `meta`, and the per-page select.
- **Centre:** first, previous, the page numbers, next, last.
- **Right:** a "Page 3 / 8" select that lists every page — the way to jump far.

## The Sliding Window

The page numbers are a window of fixed size — seven on a desk, five on a phone — that
slides over the range rather than growing. The row never changes width, so the button
under the pointer stays where it was after a click, and the arrows keep their distance
from the numbers.

## `Pagination`

```vue
<Pagination :meta="meta" :per-page="state.perPage" :loading="loading" @page-change="goToPage" @per-page-change="setPerPage" />
```

| Prop | Default | Purpose |
| --- | --- | --- |
| `meta` | required | `page`, `lastPage`, `total`, `from`, `to`, `paginated`. |
| `perPage` | required | The current page size. |
| `perPageOptions` | `[5, 10, 30, 50, 100, 200]` | Choices of the per-page select. Match `PerPageEnum` on the server. |
| `pageCount` | `7` | Window size. |
| `narrowPageCount` | `5` | Window size below `narrowBreakpoint`. |
| `narrowBreakpoint` | `'(max-width: 639px)'` | |
| `compact` | `false` | The variant used inside the floating footer. |
| `loading` | `false` | The page that was clicked shows a spinner until the response lands. |

Events: `page-change(page)`, `per-page-change(value)` — the select's string.

Changing the page scrolls the window to the top, since the new rows start there.

## Page Sizes

The options the select offers should be the sizes the server accepts. `PerPageEnum`
ships the same list on the PHP side, with a `sanitize()` that falls back to its default:

```php
use Aaix\LaravelIslandsDatagrid\Enums\PerPageEnum;

$perPage = PerPageEnum::sanitize((int) $request->query('perPage', PerPageEnum::DEFAULT));
```

See [Configuration](/configuration#page-sizes).

## Lists That Do Not Paginate

A list that answers in one go returns `meta.paginated: false`, and the bar is not
rendered — nor is a floating footer. Leave `floatingFooter` off in such a view; a bar
that would come up empty stays down.
