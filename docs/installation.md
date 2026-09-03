# Installation

```bash
composer require aaix/laravel-islands-datagrid
```

Pulls in `aaix/laravel-islands`. The service provider registers only its configuration —
no routes, views or migrations.

## Vite

Alias both packages:

```js
resolve: {
    alias: {
        '@aaix/laravel-islands': fileURLToPath(new URL('./vendor/aaix/laravel-islands/resources/js', import.meta.url)),
        '@aaix/laravel-islands-datagrid': fileURLToPath(new URL('./vendor/aaix/laravel-islands-datagrid/resources/js', import.meta.url)),
    },
},
```

```js
import { DataTable, useDataTable, SearchInput } from '@aaix/laravel-islands-datagrid/vue';
```

## Tailwind

```css
@source '../../vendor/aaix/laravel-islands/resources/js/**/*';
@source '../../vendor/aaix/laravel-islands-datagrid/resources/js/**/*';
```

Without it the classes are purged and the table renders with subtly wrong spacing.

## Translations

The components carry a few strings of their own — "Retry", "Per page", "Columns", the
saved-views menu. Hand them your translator once, at the island root:

```js
import { useIsland, useTranslations } from '@aaix/laravel-islands/vue';
import { provideDatagrid } from '@aaix/laravel-islands-datagrid/vue';

const { t } = useTranslations();
const { _island } = useIsland();

provideDatagrid({ t, locale: _island.locale });
```

Without it the English source strings are used.
