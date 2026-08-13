---
layout: home

hero:
  name: Islands Datagrid
  text: One table, every table.
  tagline: A server-driven data table for Laravel Islands. Fetching, sorting, filtering and pagination live in one place, so the next table inherits every improvement instead of copying the last one.
  image:
    src: /logo.svg
    alt: Islands Datagrid
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/jonaaix/laravel-islands-datagrid
---

```bash
composer require aaix/laravel-islands-datagrid
```

## Why

A second table in an application is rarely a second problem. It is the first
one again: fetch with a race guard, debounce the search, mirror the state into
the query string, reset to page one when a filter changes, render a skeleton,
render an empty state, render pagination.

Copied, those details drift. Extracted, a fix to the race guard fixes every
table at once, and a new feature — column visibility, saved views, live updates
— arrives everywhere the moment it is written.

## What it owns

**`useDataTable`** owns the state. A table is described by a single `defaults`
object: every key becomes reactive state, is sent to the server, and appears in
the query string only when it differs from its default.

**`<DataTable>`** owns the chrome: the card, the sticky toolbar, the error
banner, the `<table>` scaffold, skeleton rows, the empty state, pagination and
the refresh bar.

## What it never owns

Page headers, tabs, side panels, columns, row components and domain rules stay
in your island. The package supplies the parts every table shares — it does not
decide what your page looks like.
