# Installation

## Composer

```bash
composer require aaix/laravel-islands-datagrid
```

This pulls in `aaix/laravel-islands` as well. The service provider is discovered
automatically; it registers nothing but its [configuration](/configuration) — no routes,
no views, no migrations.

## Vite

Like the base package, the frontend ships as plain sources inside the Composer package.
Alias both:

```js
// vite.config.js
resolve: {
    alias: {
        '@aaix/laravel-islands': fileURLToPath(
            new URL('./vendor/aaix/laravel-islands/resources/js', import.meta.url),
        ),
        '@aaix/laravel-islands-datagrid': fileURLToPath(
            new URL('./vendor/aaix/laravel-islands-datagrid/resources/js', import.meta.url),
        ),
    },
},
```

There is one entry point:

```js
import { DataTable, useDataTable, SearchInput } from '@aaix/laravel-islands-datagrid/vue';
```

## Tailwind

The components carry Tailwind classes. Register both packages as sources, or the
classes are purged and the table renders with subtly wrong spacing — which looks like a
layout bug and is a configuration bug:

```css
/* resources/css/app.css */
@import 'tailwindcss';

@source '../../vendor/aaix/laravel-islands/resources/js/**/*';
@source '../../vendor/aaix/laravel-islands-datagrid/resources/js/**/*';
```

A `primary-*` colour scale and the `dark:` variant are expected, as for the base
package's helpers.

## The Island

A list view is an ordinary island. Scaffold it with the base package's command and
follow its [directory structure](https://jonaaix.github.io/laravel-islands/directory-structure):

```bash
php artisan make:island Invoices
```

## Translating the Built-In Strings

The components carry a handful of strings of their own — "Could not load data", "Retry",
"Per page", "Columns", "Sort by", "Filters", the saved-views menu. Hand them your
translator once, at the island root:

```vue
<script setup>
import { useIsland, useTranslations } from '@aaix/laravel-islands/vue';
import { provideDatagrid } from '@aaix/laravel-islands-datagrid/vue';

const { t } = useTranslations();
const { _island } = useIsland();

provideDatagrid({ t, locale: _island.locale });
</script>
```

Without it, the English source strings are used and numbers format for `en`. The full
list of strings is under [Exports](/exports#translated-strings); add them to your
`lang/{locale}.json` like any other line.

## Saved Views

Saved views need a table and a model. That step is optional and described under
[Saved Views](/saved-views#the-model).
