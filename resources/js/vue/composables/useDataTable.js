import { computed, getCurrentInstance, onBeforeUnmount, reactive, ref } from 'vue';
import { httpClient } from '../http.js';

/**
 * Server-driven table state: fetching, sorting, filtering, pagination and URL sync.
 *
 * The shape of a table is described entirely by `defaults`. Every key becomes part
 * of the reactive state, is sent to the server, and is mirrored into the query
 * string whenever it differs from its default.
 *
 * @param {string} dataUrl Endpoint returning `{ data: { rows, meta, ... } }`.
 * @param {object} options
 * @param {Record<string, any>} options.defaults Every state key with its default value.
 * @param {Record<string, any>} [options.initial] Server-provided starting state.
 * @param {string[]} [options.clientOnly] Keys kept in state and URL but never sent to the server.
 *   Mutating such a key does not need a refetch; call the returned `syncUrl()` to mirror it
 *   into the query string.
 * @param {string[]} [options.filterKeys] Keys counted by `activeFilterCount` and cleared by `resetFilters`.
 * @param {string[]} [options.filterParams] Keys transported as `filter[key]` instead of a bare
 *   `key`, both in the query string and towards the server. Keys left out stay bare, which
 *   suits view state such as `sort`, `page` or `perPage`.
 * A state change that refetches becomes its own history entry, so the browser's back
 * button walks through filters, sorting and pages; going back re-reads the query string
 * and refetches. Typing in the search box replaces the entry instead of adding one per
 * pause, and so does any bare `syncUrl()` call.
 *
 * @param {string} [options.searchKey] State key driven by `onSearchInput`.
 * @param {number} [options.searchDelay] Debounce for `onSearchInput`, in milliseconds.
 * @param {{ get: Function }} [options.http] HTTP client; defaults to the package's fetch client.
 */
export function useDataTable(dataUrl, options = {}) {
    const {
        defaults = {},
        initial = {},
        clientOnly = [],
        filterKeys = [],
        filterParams = [],
        searchKey = 'q',
        searchDelay = 350,
        http = null,
    } = options;

    const state = reactive({ ...defaults, ...(initial ?? {}) });

    const payload = ref({});
    const rows = ref([]);
    const meta = ref({});
    const loading = ref(false);
    const error = ref(false);

    let requestId = 0;
    let searchTimer = null;

    function isDirty(key) {
        if (typeof defaults[key] === 'boolean') {
            return state[key] !== defaults[key];
        }

        return String(state[key] ?? '') !== String(defaults[key] ?? '');
    }

    function paramName(key) {
        return filterParams.includes(key) ? `filter[${key}]` : key;
    }

    function toQuery() {
        const params = {};

        for (const key of Object.keys(defaults)) {
            if (!isDirty(key)) {
                continue;
            }

            params[paramName(key)] = typeof defaults[key] === 'boolean' ? (state[key] ? '1' : '0') : state[key];
        }

        return params;
    }

    function toParams() {
        const params = {};

        for (const key of Object.keys(defaults)) {
            if (!clientOnly.includes(key)) {
                params[paramName(key)] = state[key];
            }
        }

        return params;
    }

    function syncUrl({ push = false } = {}) {
        const qs = new URLSearchParams(toQuery()).toString().replace(/%5B/g, '[').replace(/%5D/g, ']');
        const path = window.location.pathname;
        const url = qs ? `${path}?${qs}` : path;

        if (push && url !== path + window.location.search) {
            window.history.pushState(null, '', url);

            return;
        }

        window.history.replaceState(null, '', url);
    }

    /**
     * Reads the query string back into state. Absent params fall back to `fallback[key]`
     * — for popstate that's `defaults` (a step in history genuinely resets missing keys),
     * for the first mount that's the current state (server-provided `initial` wins over
     * the raw defaults so we don't clobber it).
     *
     * @param {Record<string, any>} fallback
     */
    function applyQuery(fallback = defaults) {
        const params = new URLSearchParams(window.location.search);

        for (const key of Object.keys(defaults)) {
            const raw = params.get(paramName(key));

            if (raw === null) {
                state[key] = fallback[key];

                continue;
            }

            if (typeof defaults[key] === 'boolean') {
                state[key] = raw === '1';
            } else if (typeof defaults[key] === 'number') {
                state[key] = Number(raw) || 0;
            } else {
                state[key] = raw;
            }
        }
    }

    // The URL is the source of truth for a shareable view. Server-side `initial` seeds
    // state; on mount, any query string parameter takes over so a reload restores exactly
    // what the shared link showed.
    if (typeof window !== 'undefined' && window.location?.search) {
        applyQuery({ ...state });
    }

    function onPopState() {
        applyQuery();
        fetchData();
    }

    window.addEventListener('popstate', onPopState);

    if (getCurrentInstance()) {
        onBeforeUnmount(() => window.removeEventListener('popstate', onPopState));
    }

    async function fetchData() {
        const id = ++requestId;
        loading.value = true;
        error.value = false;

        try {
            const { data } = await (http ?? httpClient).get(dataUrl, { params: toParams() });

            if (id !== requestId) {
                return;
            }

            const body = data?.data ?? {};
            payload.value = body;
            rows.value = body.rows ?? [];
            meta.value = body.meta ?? {};
        } catch (e) {
            if (id === requestId) {
                error.value = true;
                rows.value = [];
            }
        } finally {
            if (id === requestId) {
                loading.value = false;
            }
        }
    }

    function reload({ resetPage = false, push = true } = {}) {
        if (resetPage) {
            state.page = 1;
        }

        syncUrl({ push });
        fetchData();
    }

    function onSearchInput(value) {
        state[searchKey] = value;
        clearTimeout(searchTimer);
        // Every pause while typing would otherwise become its own history entry.
        searchTimer = setTimeout(() => reload({ resetPage: true, push: false }), searchDelay);
    }

    function clearSearch() {
        clearTimeout(searchTimer);
        state[searchKey] = defaults[searchKey] ?? '';
        reload({ resetPage: true });
    }

    function setFilter(key, value) {
        state[key] = value;
        reload({ resetPage: true });
    }

    function resetFilters(keys = filterKeys) {
        let changed = false;

        for (const key of keys) {
            if (isDirty(key)) {
                state[key] = defaults[key];
                changed = true;
            }
        }

        if (changed) {
            reload({ resetPage: true });
        }
    }

    const activeFilterCount = computed(() =>
        filterKeys.reduce((count, key) => count + (isDirty(key) ? 1 : 0), 0),
    );

    function setSort(field) {
        if (state.sort === field) {
            state.dir = state.dir === 'asc' ? 'desc' : 'asc';
        } else {
            state.sort = field;
            state.dir = 'desc';
        }

        reload({ resetPage: true });
    }

    function goToPage(page) {
        state.page = page;
        reload();
    }

    function setPerPage(perPage) {
        state.perPage = Number(perPage);
        reload({ resetPage: true });
    }

    return {
        state,
        payload,
        rows,
        meta,
        loading,
        error,
        activeFilterCount,
        fetchData,
        reload,
        syncUrl,
        onSearchInput,
        clearSearch,
        setFilter,
        resetFilters,
        setSort,
        goToPage,
        setPerPage,
    };
}
