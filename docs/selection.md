# Selection

A selection is a promise about a set of rows. On one page it is a list of ids; across a
filtered result of ten thousand rows it cannot be, so `useSelection()` knows two scopes.

```js
const selection = useSelection(rows, { key: 'id', matchedTotal: computed(() => meta.value.total) });
```

| Scope | Collects | `count` |
| --- | --- | --- |
| `page` | ticked ids in `ids` | their number |
| `matching` | *unticked* ids in `excludedIds` — "everything the filter answers with" | `matchedTotal` minus the exclusions |

| Returns | Meaning |
| --- | --- |
| `scope`, `isMatchingScope`, `canSelectMatching` | The scope; whether the result is larger than the page. |
| `ids`, `excludedIds`, `count`, `any`, `allOnPage`, `someOnPage` | The selection and what the header checkbox needs. |
| `has(id)`, `toggle(id)`, `togglePage()`, `selectMatching()`, `selectPage()`, `clear()` | The operations. |

## `SelectionBox`

The checkbox for a row or the header. It stops the click from reaching the row, so a
selectable row can still open on click.

```vue
<th><SelectionBox :checked="selection.allOnPage" :indeterminate="selection.someOnPage" :label="t('Select page')" @change="selection.togglePage()" /></th>
<td><SelectionBox :checked="selection.has(row.id)" :label="t('Select :name', { name: row.name })" @change="selection.toggle(row.id)" /></td>
```

## Bulk Actions

When the page is fully ticked and the result is larger, offer `selectMatching()`. A bulk
endpoint receives the selection the way it was made — in the matching scope, the same
filter parameters the data request sent plus the exclusions, never ten thousand ids:

```js
await sendJson(props.bulkDeleteUrl, 'POST', {
    scope: selection.scope.value,
    ids: selection.ids.value,
    excludedIds: selection.excludedIds.value,
    filter: Object.fromEntries(FILTER_KEYS.map((key) => [key, state[key]])),
    q: state.q,
});
```

On the server, validate the filter as the data endpoint does, apply it, exclude the ids,
and act.
