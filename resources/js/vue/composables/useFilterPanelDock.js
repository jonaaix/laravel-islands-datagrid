import { computed, ref, watch } from 'vue';
import { useViewWidth, VIEW_BASE_WIDTH } from '@aaix/laravel-islands/vue';

const DEFAULT_PANEL_WIDTH = 320;

/**
 * Dock-vs-float logic for a filter panel beside a data table.
 *
 * The panel sits next to the table when the viewport is wide enough, and floats
 * over a backdrop when it is not. The page widens to make room when docked, so
 * the table never shrinks. Whether the panel is open is remembered per browser.
 *
 * The view's own width comes from `useViewWidth` — a list without a filter panel calls that
 * one directly and gets the same maximum.
 *
 * @param {string} storageKey  localStorage key for the open/closed state.
 * @param {object} [options]
 * @param {number} [options.baseWidth]  Table width without the panel.
 * @param {number} [options.panelWidth] Panel width to reserve beside the table.
 * @param {import('vue').Ref<boolean> | import('vue').ComputedRef<boolean>} [options.enabled]
 *   When false the panel is neither docked nor visible (e.g. a tab that has no filters).
 * @returns {{ root, filtersOpen, panelRendered, docked, rootStyle, headerStyle, toggleFilters }}
 */
export function useFilterPanelDock(storageKey, options = {}) {
    const { baseWidth = VIEW_BASE_WIDTH, panelWidth = DEFAULT_PANEL_WIDTH, enabled = null } = options;

    const panelReserve = panelWidth + 16;

    const filtersOpen = ref(window.localStorage?.getItem(storageKey) === '1');
    const extraWidth = ref(0);

    const { root, rootStyle, availableWidth } = useViewWidth({ baseWidth, extraWidth });

    function toggleFilters() {
        filtersOpen.value = !filtersOpen.value;
        window.localStorage?.setItem(storageKey, filtersOpen.value ? '1' : '0');
    }

    const panelRendered = ref(filtersOpen.value);

    watch(filtersOpen, (open) => {
        if (open) {
            panelRendered.value = true;
        }
    });

    if (enabled) {
        watch(enabled, (val) => {
            if (val !== false && filtersOpen.value) {
                panelRendered.value = true;
            }
        });
    }

    const isEnabled = () => (enabled ? enabled.value !== false : true);

    const docked = computed(() => panelRendered.value && isEnabled() && availableWidth.value >= baseWidth + panelReserve);

    watch(docked, (isDocked) => {
        extraWidth.value = isDocked ? panelReserve : 0;
    }, { immediate: true });

    const headerStyle = computed(() => (docked.value ? { maxWidth: `calc(100% - ${panelReserve}px)` } : {}));

    return { root, filtersOpen, panelRendered, docked, rootStyle, headerStyle, toggleFilters };
}
