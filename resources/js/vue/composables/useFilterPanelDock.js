import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const DEFAULT_BASE_WIDTH = 1536;
const DEFAULT_PANEL_WIDTH = 320;
const TOOLBAR_HEIGHT = '61px';

/**
 * Dock-vs-float logic for a filter panel beside a data table.
 *
 * The panel sits next to the table when the viewport is wide enough, and floats
 * over a backdrop when it is not. The page widens to make room when docked, so
 * the table never shrinks. Whether the panel is open is remembered per browser.
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
    const { baseWidth = DEFAULT_BASE_WIDTH, panelWidth = DEFAULT_PANEL_WIDTH, enabled = null } = options;

    const panelReserve = panelWidth + 16;

    const filtersOpen = ref(window.localStorage?.getItem(storageKey) === '1');
    const root = ref(null);
    const availableWidth = ref(0);
    let resizeObserver = null;

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

    const rootStyle = computed(() => ({
        maxWidth: `${docked.value ? baseWidth + panelReserve : baseWidth}px`,
        '--table-toolbar-h': TOOLBAR_HEIGHT,
    }));

    const headerStyle = computed(() => (docked.value ? { maxWidth: `calc(100% - ${panelReserve}px)` } : {}));

    onMounted(() => {
        const container = root.value?.parentElement;
        if (container && window.ResizeObserver) {
            resizeObserver = new ResizeObserver(([entry]) => {
                availableWidth.value = entry.contentRect.width;
            });
            resizeObserver.observe(container);
        }
        availableWidth.value = container?.clientWidth ?? 0;
    });

    onBeforeUnmount(() => resizeObserver?.disconnect());

    return { root, filtersOpen, panelRendered, docked, rootStyle, headerStyle, toggleFilters };
}
