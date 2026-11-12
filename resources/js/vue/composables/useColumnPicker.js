import { computed, shallowRef } from 'vue';

const SWITCHED_OFF = '-';

function keyList(value) {
    return String(value || '')
        .split(',')
        .map((key) => key.trim())
        .filter(Boolean);
}

/** The keys a column registry shows by default, in registry order. */
export function defaultColumnKeys(columns) {
    return columns.filter((column) => column.default).map((column) => column.key);
}

/** The keys asked for, in registry order, locked columns always included. Empty asks for the defaults. */
export function resolveColumnKeys(columns, wanted) {
    const asked = new Set(keyList(wanted));

    if (asked.size === 0) {
        return defaultColumnKeys(columns);
    }

    return columns.filter((column) => column.locked || asked.has(column.key)).map((column) => column.key);
}

/** A choice written as its deviations from the defaults: `key` switched on, `-key` switched off. */
export function columnDeviationsFromDefaults(columns, visible) {
    const shown = new Set(visible);

    return columns
        .filter((column) => !column.locked && Boolean(column.default) !== shown.has(column.key))
        .map((column) => (shown.has(column.key) ? column.key : SWITCHED_OFF + column.key))
        .join(',');
}

/**
 * The keys a stored choice shows; a column added since follows its default. A choice that names a
 * default column without the off mark was stored as the full list, and is read as exactly that.
 */
export function visibleColumnKeys(columns, deviations) {
    const entries = keyList(deviations);
    const defaults = new Set(defaultColumnKeys(columns));

    if (entries.some((key) => !key.startsWith(SWITCHED_OFF) && defaults.has(key))) {
        return resolveColumnKeys(columns, entries.join(','));
    }

    const switchedOff = new Set(entries.filter((key) => key.startsWith(SWITCHED_OFF)).map((key) => key.slice(1)));
    const switchedOn = new Set(entries.filter((key) => !key.startsWith(SWITCHED_OFF)));

    return columns
        .filter((column) => column.locked || switchedOn.has(column.key) || (column.default && !switchedOff.has(column.key)))
        .map((column) => column.key);
}

export function sameColumns(a, b) {
    return a.length === b.length && a.every((key, index) => key === b[index]);
}

/**
 * The column choice of one table: what a fresh table shows, what this person opens with, and
 * what the `ColumnPicker` reads and writes.
 *
 * It is created before `useDataTable`, because the table's defaults and first state come from
 * it, and connected to the table afterwards.
 *
 * @param {Array<{ key: string, default?: boolean, locked?: boolean, span?: number }>} columns The registry.
 * @param {object} [options]
 * @param {string} [options.remembered] The person's stored choice, as deviations from the defaults.
 * @param {(deviations: string) => void} [options.remember] Stores a new choice.
 * @param {string} [options.stateKey] The state key holding the visible keys, `cols` by default.
 * @param {string|null} [options.shared] A choice that arrived by link; the current URL's `cols` when omitted.
 */
export function useColumnPicker(columns, options = {}) {
    const { remembered = '', remember = null, stateKey = 'cols' } = options;
    const shared = options.shared !== undefined ? options.shared : new URLSearchParams(window.location.search).get(stateKey);

    const defaults = defaultColumnKeys(columns);
    const start = shared === null ? visibleColumnKeys(columns, remembered) : resolveColumnKeys(columns, shared);

    const table = shallowRef(null);

    const keys = computed(() => resolveColumnKeys(columns, table.value ? table.value.state[stateKey] : start.join(',')));
    const visible = computed(() => {
        const shown = new Set(keys.value);

        return columns.filter((column) => shown.has(column.key));
    });
    const span = computed(() => visible.value.reduce((sum, column) => sum + (column.span ?? 1), 0));
    const changed = computed(() => !sameColumns(keys.value, defaults));

    function connect(dataTable) {
        table.value = dataTable;
    }

    function set(next) {
        const chosen = resolveColumnKeys(columns, next.join(','));

        table.value.state[stateKey] = chosen.join(',');
        table.value.syncUrl?.();
        remember?.(columnDeviationsFromDefaults(columns, chosen));
    }

    function reset() {
        set(defaults);
    }

    return {
        columns,
        defaultValue: defaults.join(','),
        startValue: start.join(','),
        keys,
        visible,
        span,
        changed,
        connect,
        set,
        reset,
    };
}
