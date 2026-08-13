import { computed, ref, unref } from 'vue';

/**
 * Row selection with two scopes.
 *
 * `page` collects the ids a user ticked. `matching` means "everything the current filter
 * answers with", which is a promise about rows that were never loaded — it therefore holds
 * the ones that were ticked *off* again instead of the ones that were ticked.
 *
 * The scope travels to the server as an intent, never as thousands of ids: read `scope`,
 * `ids` and `excludedIds` and send whatever the endpoint expects.
 *
 * @param {import('vue').Ref<Array<object>>} rows The rows currently on screen.
 * @param {{
 *   key?: string,
 *   matchedTotal?: import('vue').Ref<number>|number,
 * }} [options] `key` names the identifying field, `id` by default. `matchedTotal` is how many
 *   rows the current filter matches — usually `meta.total`; without it the `matching` scope
 *   cannot count and stays unavailable.
 */
export function useSelection(rows, options = {}) {
    const { key = 'id', matchedTotal = null } = options;

    const scope = ref('page');

    const chosen = ref(new Set());

    const excluded = ref(new Set());

    const matched = computed(() => Number(unref(matchedTotal) ?? 0));

    const pageIds = computed(() => (rows.value ?? []).map((row) => row[key]));

    const isMatchingScope = computed(() => scope.value === 'matching');

    /** Offering the wider scope is pointless while a page already holds every match. */
    const canSelectMatching = computed(() => matched.value > pageIds.value.length);

    const ids = computed(() => (isMatchingScope.value ? [] : [...chosen.value]));

    const excludedIds = computed(() => (isMatchingScope.value ? [...excluded.value] : []));

    const count = computed(() =>
        isMatchingScope.value ? Math.max(0, matched.value - excluded.value.size) : chosen.value.size,
    );

    const any = computed(() => count.value > 0);

    const allOnPage = computed(() => {
        if (pageIds.value.length === 0) {
            return false;
        }

        return isMatchingScope.value
            ? pageIds.value.every((id) => !excluded.value.has(id))
            : pageIds.value.every((id) => chosen.value.has(id));
    });

    const someOnPage = computed(() => {
        if (allOnPage.value) {
            return false;
        }

        return isMatchingScope.value
            ? pageIds.value.some((id) => !excluded.value.has(id))
            : pageIds.value.some((id) => chosen.value.has(id));
    });

    function has(id) {
        return isMatchingScope.value ? !excluded.value.has(id) : chosen.value.has(id);
    }

    function write(target, mutate) {
        const next = new Set(target.value);
        mutate(next);
        target.value = next;
    }

    function set(id, on) {
        if (isMatchingScope.value) {
            write(excluded, (next) => (on ? next.delete(id) : next.add(id)));

            return;
        }

        write(chosen, (next) => (on ? next.add(id) : next.delete(id)));
    }

    function toggle(id) {
        set(id, !has(id));
    }

    /**
     * The header box always speaks about the page it sits above: in the wider scope, emptying
     * it means letting go of everything rather than excluding one page of an unseen set.
     */
    function togglePage() {
        if (isMatchingScope.value) {
            allOnPage.value ? clear() : write(excluded, (next) => pageIds.value.forEach((id) => next.delete(id)));

            return;
        }

        const clearing = allOnPage.value;

        write(chosen, (next) => pageIds.value.forEach((id) => (clearing ? next.delete(id) : next.add(id))));
    }

    function selectMatching() {
        scope.value = 'matching';
        excluded.value = new Set();
        chosen.value = new Set();
    }

    function selectPage() {
        scope.value = 'page';
        excluded.value = new Set();
        chosen.value = new Set(pageIds.value);
    }

    function remove(id) {
        set(id, false);
    }

    function clear() {
        scope.value = 'page';
        chosen.value = new Set();
        excluded.value = new Set();
    }

    return {
        scope,
        isMatchingScope,
        canSelectMatching,
        matched,
        ids,
        excludedIds,
        count,
        any,
        allOnPage,
        someOnPage,
        has,
        set,
        toggle,
        togglePage,
        selectMatching,
        selectPage,
        remove,
        clear,
    };
}
