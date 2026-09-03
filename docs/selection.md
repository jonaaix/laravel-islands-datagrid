# Selection & Bulk Actions

A selection is a promise about a set of rows. On one page it is a list of ids; across a
filtered result of ten thousand rows it cannot be, so `useSelection()` knows two scopes
and lets a bulk action describe the set the same way the filter does.

![Three rows ticked, with the selection bar naming the count and offering the whole result](/screenshots/selection.webp)

## `useSelection(rows, options)`

```js
import { useSelection } from '@aaix/laravel-islands-datagrid/vue';

const selection = useSelection(rows, { key: 'id', matchedTotal: computed(() => meta.value.total) });
```

| Option | Default | Purpose |
| --- | --- | --- |
| `key` | `'id'` | The row property that identifies a row. |
| `matchedTotal` | `null` | The number of rows the current filter matches — usually `meta.total`. Enables the matching scope. |

### Two Scopes

**`page`** — the default. Ticked rows are collected by id in `ids`.

**`matching`** — "everything the filter answers with". Instead of ids, the composable
collects the rows the user ticked *off* in `excludedIds`. `count` is `matchedTotal`
minus those exclusions.

| Returns | Meaning |
| --- | --- |
| `scope` | `'page'` or `'matching'`. |
| `isMatchingScope` | |
| `canSelectMatching` | `true` when the result has more rows than the page shows. |
| `matched` | The matched total, as a number. |
| `ids` | The ticked ids — empty in matching scope. |
| `excludedIds` | The unticked ids — empty in page scope. |
| `count` | How many rows the selection describes. |
| `any`, `allOnPage`, `someOnPage` | For the header checkbox and the bulk bar. |
| `has(id)`, `set(id, on)`, `toggle(id)` | Per row. |
| `togglePage()` | Tick or untick the whole page. In matching scope, unticking a fully included page clears the selection. |
| `selectMatching()` | Switch to the matching scope. |
| `selectPage()` | Back to the page scope with the page ticked. |
| `remove(id)`, `clear()` | |

## `SelectionBox`

The checkbox for a row or the header. It stops the click from reaching the row, so a
selectable row can still open on click.

```vue
<th class="w-10"><SelectionBox :checked="selection.allOnPage" :indeterminate="selection.someOnPage" :label="t('Select page')" @change="selection.togglePage()" /></th>

<td class="w-10"><SelectionBox :checked="selection.has(row.id)" :label="t('Select :name', { name: row.name })" @change="selection.toggle(row.id)" /></td>
```

| Prop | Default | Purpose |
| --- | --- | --- |
| `checked`, `indeterminate`, `disabled` | `false` | |
| `label` | required | Accessible name. |

Event: `change(boolean)`.

## The Bulk Bar

Once anything is selected, the toolbar makes room for the count and the actions. When the
page is fully ticked and the result is larger than the page, offer the rest:

```vue
<div v-if="selection.any" class="flex items-center gap-3">
    <span class="tabular-nums">{{ t(':count selected', { count: selection.count }) }}</span>
    <Button v-if="selection.allOnPage && selection.canSelectMatching && !selection.isMatchingScope" tone="ghost" size="sm" @click="selection.selectMatching()">
        {{ t('Select all :count', { count: selection.matched }) }}
    </Button>
    <Button tone="danger" size="sm" @click="removeSelected">{{ t('Delete selected') }}</Button>
    <Button tone="ghost" size="sm" @click="selection.clear()">{{ t('Clear selection') }}</Button>
</div>
```

## Sending the Selection

A bulk endpoint receives the selection the way it was made. In the matching scope, that
means the **same filter parameters** the data request sent plus the exclusions — the
server re-runs the query and skips the excluded ids. It never receives ten thousand ids:

```js
async function removeSelected() {
    const yes = await confirm({ title: t('Delete :count records?', { count: selection.count }), tone: 'danger', confirmLabel: t('Delete') });
    if (!yes) return;

    await sendJson(props.bulkDeleteUrl, 'POST', {
        scope: selection.scope.value,
        ids: selection.ids.value,
        excludedIds: selection.excludedIds.value,
        filter: Object.fromEntries(FILTER_KEYS.map((key) => [key, state[key]])),
        q: state.q,
    });

    selection.clear();
    reload();
}
```

On the server, validate the filter the same way the data endpoint does — it is the same
query class — then apply it, exclude the ids, and act. The selection describes a result;
if the result changed between selecting and acting, the action follows the data, not the
screenshot in the user's head. Say so in the confirm when that matters.
