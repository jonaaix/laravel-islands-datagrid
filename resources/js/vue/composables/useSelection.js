import { computed, ref } from 'vue';

/**
 * @param {import('vue').Ref<Array<object>>} rows The rows currently on screen.
 * @param {{ key?: string }} [options] `key` names the identifying field, `id` by default.
 */
export function useSelection(rows, options = {}) {
    const { key = 'id' } = options;

    const chosen = ref(new Set());

    const ids = computed(() => [...chosen.value]);

    const count = computed(() => chosen.value.size);

    const pageIds = computed(() => (rows.value ?? []).map((row) => row[key]));

    const allOnPage = computed(() => pageIds.value.length > 0 && pageIds.value.every((id) => chosen.value.has(id)));

    const someOnPage = computed(() => !allOnPage.value && pageIds.value.some((id) => chosen.value.has(id)));

    const any = computed(() => chosen.value.size > 0);

    function has(id) {
        return chosen.value.has(id);
    }

    function write(mutate) {
        const next = new Set(chosen.value);
        mutate(next);
        chosen.value = next;
    }

    function set(id, on) {
        write((next) => (on ? next.add(id) : next.delete(id)));
    }

    function toggle(id) {
        set(id, !has(id));
    }

    function togglePage() {
        const clearing = allOnPage.value;

        write((next) => pageIds.value.forEach((id) => (clearing ? next.delete(id) : next.add(id))));
    }

    function remove(id) {
        write((next) => next.delete(id));
    }

    function clear() {
        chosen.value = new Set();
    }

    return { ids, count, any, allOnPage, someOnPage, has, set, toggle, togglePage, remove, clear };
}
