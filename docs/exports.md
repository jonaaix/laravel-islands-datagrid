# Exports

Everything `@aaix/laravel-islands-datagrid/vue` exports, and the PHP classes the package
ships, with a link to where each is described.

## Components

| Export | Page |
| --- | --- |
| `DataTable` | [The DataTable](/data-table) |
| `Pagination` | [Pagination](/pagination) |
| `SearchInput` | [Toolbar & Filters](/toolbar#searchinput) |
| `Combobox` | re-exported from the base package — [Toolbar & Filters](/toolbar#combobox) |
| `SortButton` | [Toolbar & Filters](/toolbar#sortbutton) |
| `SortMenu` | [Toolbar & Filters](/toolbar#sortmenu) |
| `ColumnPicker` | [Toolbar & Filters](/toolbar#columnpicker) |
| `FilterPanel` | [Toolbar & Filters](/toolbar#filterpanel) |
| `SelectionBox` | [Selection & Bulk Actions](/selection#selectionbox) |
| `ViewProfileMenu` | [Saved Views](/saved-views#the-menu) |

## Icons

`IconSearch`, `IconFilter`, `IconColumns`, `IconSort`, `IconViews`, `IconStar`,
`IconModeTable`, `IconModeCards`, `IconModeList`, `IconChevronRight` — bare `<svg>`
components sized and coloured by the caller's classes.

## Composables

| Export | Page |
| --- | --- |
| `useDataTable(dataUrl, options)` | [Table State](/table-state) |
| `useSelection(rows, options)` | [Selection & Bulk Actions](/selection) |
| `useViewProfiles(options)` | [Saved Views](/saved-views#the-composable) |
| `useAutoMobileMode(options)` | [Responsive & Mobile](/responsive#automatic-list-mode) |
| `useFilterPanelDock(storageKey, options)` | [Toolbar & Filters](/toolbar#filterpanel) |
| `useViewWidth(options)`, `VIEW_BASE_WIDTH`, `VIEW_TOOLBAR_HEIGHT` | re-exported from the base package — [Responsive & Mobile](/responsive#view-width) |

## Context & HTTP

| Export | Page |
| --- | --- |
| `provideDatagrid({ t, locale })`, `useDatagrid()` | [Installation](/installation#translating-the-built-in-strings) |
| `createHttpClient({ headers, credentials })`, `httpClient` | [The Endpoint Contract](/endpoint#the-http-client) |
| `sendJson(url, method, body)` | [The Endpoint Contract](/endpoint#the-http-client) |

## PHP

| Class | Page |
| --- | --- |
| `Aaix\LaravelIslandsDatagrid\Concerns\HandlesViewProfiles` | [Saved Views](/saved-views#the-endpoints) |
| `Aaix\LaravelIslandsDatagrid\ViewProfiles\ViewProfileStore` | [Saved Views](/saved-views#the-props) |
| `Aaix\LaravelIslandsDatagrid\ViewProfiles\ViewProfileSchema` | [Saved Views](/saved-views#the-schema) |
| `Aaix\LaravelIslandsDatagrid\Enums\PerPageEnum` | [Configuration](/configuration#page-sizes) |

## Translated Strings

These are the English source strings the components pass through the translator from
`provideDatagrid()`. Add the ones you need to `lang/{locale}.json`:

```
Could not load data · Retry · of · page · Per page · Page · First page · Previous · Next · Last page
Columns · Reset columns · Sort by · Asc · Desc · Filters · Minimize · Clear search
Views · Save view · Save as new · Save changes · Rename · Delete · Reset view · Shared with you
Your views · unsaved · Name this view · No saved views yet. Apply filters or change the sort order, then save the current view.
Set as default · Unset default · Default view
```
