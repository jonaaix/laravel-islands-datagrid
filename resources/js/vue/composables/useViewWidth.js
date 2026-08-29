import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

export const VIEW_BASE_WIDTH = 1536;

export const VIEW_TOOLBAR_HEIGHT = '61px';

/**
 * How wide a list view is allowed to grow, and how tall its toolbar is.
 *
 * Both belong to the view as a whole rather than to the table inside it, and both are read
 * back by anything that has to line up with the toolbar — the sticky header, a docked filter
 * panel, a floating bar. One owner keeps every list the same width, so switching between two
 * views does not move the columns under the reader.
 *
 * Bind `root` and `rootStyle` on the island's outermost element:
 *
 *     const { root, rootStyle } = useViewWidth();
 *     <div ref="root" class="mx-auto w-full" :style="rootStyle">
 *
 * `useFilterPanelDock` wraps this and widens the view while a panel is docked; a view with a
 * panel calls that one instead.
 *
 * @param {object} [options]
 * @param {number} [options.baseWidth] Widest the view may become without a docked panel.
 * @param {import('vue').Ref<number>} [options.extraWidth] Room a docked panel adds on top.
 * @returns {{ root, rootStyle, availableWidth }}
 */
export function useViewWidth(options = {}) {
    const { baseWidth = VIEW_BASE_WIDTH, extraWidth = null } = options;

    const root = ref(null);
    const availableWidth = ref(0);

    let resizeObserver = null;

    const rootStyle = computed(() => ({
        maxWidth: `${baseWidth + (extraWidth?.value ?? 0)}px`,
        '--table-toolbar-h': VIEW_TOOLBAR_HEIGHT,
    }));

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

    return { root, rootStyle, availableWidth };
}
