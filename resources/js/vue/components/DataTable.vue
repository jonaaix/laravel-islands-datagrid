<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useDatagrid } from '../context.js';
import Pagination from './Pagination.vue';

const props = defineProps({
    rows: { type: Array, required: true },
    meta: { type: Object, default: () => ({}) },
    perPage: { type: [Number, String], default: 30 },
    perPageOptions: { type: Array, default: undefined },
    colCount: { type: Number, required: true },
    loading: { type: Boolean, default: false },
    error: { type: Boolean, default: false },
    errorMessage: { type: String, default: '' },
    skeletonRows: { type: Number, default: 10 },
    skeletonCellClass: { type: String, default: 'px-6 py-3' },
    skeletonBarClass: { type: String, default: 'h-6' },
    mode: { type: String, default: 'table' },
    cardsMinWidth: { type: String, default: '260px' },
    cardsGap: { type: String, default: '0.75rem' },
    cardSkeletonHeight: { type: String, default: '240px' },
    cardSkeletonCount: { type: Number, default: 8 },
    listSkeletonHeight: { type: String, default: '64px' },
    listSkeletonCount: { type: Number, default: 10 },
    bleed: { type: Boolean, default: false },
    /**
     * Give the table a height of its own and let the rows scroll inside it, with the toolbar
     * above and the pagination below both staying put. `true` takes the room left on the
     * screen below the table's own top edge; a CSS length or a number of pixels sets it
     * outright, which is how two tables share one screen. Off by default: a list normally
     * scrolls with the page it sits on.
     */
    fixedHeight: { type: [Boolean, String, Number], default: false },
    /**
     * Toolbar and pagination lift off and hover over the rows once they would leave the
     * screen — the page itself keeps scrolling as it always did.
     */
    floatingToolbar: { type: Boolean, default: false },
    floatingFooter: { type: Boolean, default: false },
    floatingBreakpoint: { type: String, default: '(min-width: 768px)' },
    /**
     * Room a floating bar keeps from the edge of the viewport. An application shell with a
     * sticky header of its own sets `--table-float-top` (and `--table-float-bottom`) once,
     * and every table below it reads that instead — a table cannot see what floats above it,
     * and a bar that guesses ends up behind the header.
     */
    floatTopOffset: { type: Number, default: 12 },
    floatBottomOffset: { type: Number, default: 12 },
});

const emit = defineEmits(['retry', 'page-change', 'per-page-change']);

const { t } = useDatagrid();

const card = ref(null);
const toolbarBox = ref(null);
const footerBox = ref(null);

const toolbarUp = ref(false);
const footerUp = ref(false);
const rail = ref({ left: 0, width: 0 });
const toolbarHeight = ref(0);
const footerHeight = ref(0);
const topOffset = ref(props.floatTopOffset);
const bottomOffset = ref(props.floatBottomOffset);

function declaredOffset(styles, name, fallback) {
    const declared = Number.parseFloat(styles.getPropertyValue(name));

    return Number.isFinite(declared) ? declared : fallback;
}

const isTable = computed(() => props.mode !== 'cards' && props.mode !== 'list');
const isCards = computed(() => props.mode === 'cards');
const isList = computed(() => props.mode === 'list');

/** A bar is worth floating only while enough of the table is still on screen to serve. */
const MIN_VISIBLE = 120;

const floatingAllowed = ref(true);
let floatingMedia = null;

function onFloatingMediaChange(event) {
    floatingAllowed.value = event.matches;

    if (!event.matches) {
        toolbarUp.value = false;
        footerUp.value = false;
    } else {
        onViewportChange();
    }
}

const fits = computed(() => props.fixedHeight !== false && props.fixedHeight !== '');

const measuredHeight = ref(null);

/** Never worth scrolling in: below this a fixed height shows less than it hides. */
const MIN_FIT_HEIGHT = 240;

const fitStyle = computed(() => {
    if (!fits.value) {
        return {};
    }

    if (props.fixedHeight === true) {
        return measuredHeight.value === null ? {} : { height: `${measuredHeight.value}px` };
    }

    return { height: typeof props.fixedHeight === 'number' ? `${props.fixedHeight}px` : props.fixedHeight };
});

// A table that never leaves the screen has nothing to lift.
const floats = computed(() => !fits.value && (props.floatingToolbar || props.floatingFooter) && floatingAllowed.value);

let frame = null;

function measure() {
    frame = null;

    if (!floats.value || !card.value) {
        return;
    }

    const box = card.value.getBoundingClientRect();
    const viewport = window.innerHeight;

    rail.value = { left: box.left, width: box.width };
    toolbarHeight.value = toolbarBox.value?.offsetHeight || toolbarHeight.value;
    footerHeight.value = footerBox.value?.offsetHeight || footerHeight.value;

    const styles = getComputedStyle(card.value);

    topOffset.value = declaredOffset(styles, '--table-float-top', props.floatTopOffset);
    bottomOffset.value = declaredOffset(styles, '--table-float-bottom', props.floatBottomOffset);

    const top = topOffset.value;
    const bottom = viewport - bottomOffset.value;

    // A bar with nothing in it has nothing to keep on screen — a table without pagination
    // renders no footer, and lifting the empty strip would put a blank pill over the rows.
    toolbarUp.value = props.floatingToolbar && toolbarHeight.value > 0
        && box.top < top && box.bottom > top + toolbarHeight.value + MIN_VISIBLE;
    footerUp.value = props.floatingFooter && footerHeight.value > 0
        && box.bottom > bottom && box.top < bottom - footerHeight.value - MIN_VISIBLE;
}

function measureFit() {
    if (props.fixedHeight !== true || !card.value) {
        return;
    }

    const gap = declaredOffset(getComputedStyle(card.value), '--table-float-bottom', props.floatBottomOffset);
    const top = card.value.getBoundingClientRect().top + window.scrollY;

    measuredHeight.value = Math.max(MIN_FIT_HEIGHT, window.innerHeight - top - gap);
}

function onViewportChange() {
    frame ??= requestAnimationFrame(measure);
}

const LEAVE_MS = 160;

/**
 * Setting down takes as long as lifting off: the bar keeps its floating shape for the
 * length of the animation and only then returns to its place in the card.
 */
function lift(source) {
    const up = ref(false);
    const leaving = ref(false);
    let timer = null;

    watch(source, (raised) => {
        clearTimeout(timer);

        if (raised) {
            leaving.value = false;
            up.value = true;
            return;
        }

        if (!up.value) {
            return;
        }

        leaving.value = true;
        timer = setTimeout(() => {
            up.value = false;
            leaving.value = false;
        }, LEAVE_MS);
    });

    onBeforeUnmount(() => clearTimeout(timer));

    return { up, leaving };
}

const toolbar = lift(toolbarUp);
const footer = lift(footerUp);

const toolbarStyle = computed(() => ({
    left: `${rail.value.left}px`,
    width: `${rail.value.width}px`,
    top: `${topOffset.value}px`,
}));

const footerStyle = computed(() => ({
    left: `${rail.value.left}px`,
    width: `${rail.value.width}px`,
    bottom: `${bottomOffset.value}px`,
}));

let cardObserver = null;

onMounted(() => {
    if (fits.value) {
        measureFit();
        window.addEventListener('resize', measureFit);
    }

    if (!(props.floatingToolbar || props.floatingFooter)) {
        return;
    }

    if (window.matchMedia && props.floatingBreakpoint) {
        floatingMedia = window.matchMedia(props.floatingBreakpoint);
        floatingAllowed.value = floatingMedia.matches;
        floatingMedia.addEventListener?.('change', onFloatingMediaChange);
    }

    measure();
    window.addEventListener('scroll', onViewportChange, { passive: true });
    window.addEventListener('resize', onViewportChange);

    // Rows arrive after the table does. Without watching the card grow, a bar that ought to
    // float from the start would wait for the first scroll to notice.
    if (window.ResizeObserver && card.value) {
        cardObserver = new ResizeObserver(onViewportChange);
        cardObserver.observe(card.value);
    }
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', measureFit);
    window.removeEventListener('scroll', onViewportChange);
    window.removeEventListener('resize', onViewportChange);
    floatingMedia?.removeEventListener?.('change', onFloatingMediaChange);
    cardObserver?.disconnect();
    cancelAnimationFrame(frame);
});
</script>

<template>
    <div
        ref="card"
        class="overflow-hidden bg-white dark:bg-gray-900"
        :class="[
            bleed ? '' : 'rounded-xl ring-1 ring-gray-200 dark:ring-white/10',
            fits ? 'flex flex-col' : '',
        ]"
        :style="fitStyle"
    >
        <!--
            Toolbar and pagination stay exactly where they are and keep their space. The
            floating copy hovers above them; nothing is taken away, so nothing shifts.
        -->
        <div
            ref="toolbarBox"
            class="sticky top-0 z-20 flex min-h-[var(--table-toolbar-h,auto)] w-full flex-wrap items-center gap-2 border-b border-gray-200 bg-white/80 p-3 backdrop-blur-sm dark:border-white/10 dark:bg-gray-900/80"
        >
            <slot name="toolbar" />
        </div>

        <div
            v-if="toolbar.up.value"
            class="pointer-events-none fixed z-20 flex justify-center"
            :style="toolbarStyle"
        >
            <div
                class="floating-bar is-top pointer-events-auto flex w-max max-w-full flex-nowrap items-center gap-2 p-3"
                :class="toolbar.leaving.value ? 'is-leaving' : ''"
            >
                <slot name="toolbar" />
            </div>
        </div>

        <!-- Error banner -->
        <div v-if="error" class="flex items-center justify-between gap-3 border-b border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            <span>{{ errorMessage || t('Could not load data') }}</span>
            <button type="button" @click="emit('retry')" class="rounded-md bg-red-100 px-2 py-1 text-xs font-semibold text-red-800 hover:bg-red-200 dark:bg-red-500/20 dark:text-red-200">{{ t('Retry') }}</button>
        </div>

        <!-- Table body -->
        <div v-if="isTable" class="overflow-x-auto" :class="fits ? 'min-h-0 flex-1 overflow-y-auto' : ''">
            <table class="min-w-full text-sm" :aria-busy="loading">
                <!-- The header keeps the rows out from under it: the tint alone is see-through. -->
                <thead :class="fits ? 'sticky top-0 z-10 bg-white dark:bg-gray-900' : ''">
                    <tr class="border-b border-gray-200 bg-gray-50 text-left whitespace-nowrap dark:border-white/10 dark:bg-white/5">
                        <slot name="head" />
                    </tr>
                </thead>
                <tbody>
                    <template v-if="loading && rows.length === 0">
                        <tr v-for="n in skeletonRows" :key="'sk' + n" class="border-b border-gray-100 dark:border-white/5">
                            <td :colspan="colCount" :class="skeletonCellClass">
                                <div class="w-full animate-pulse rounded bg-gray-100 dark:bg-white/5" :class="skeletonBarClass"></div>
                            </td>
                        </tr>
                    </template>

                    <slot />

                    <tr v-if="!loading && rows.length === 0 && !error">
                        <td :colspan="colCount" class="px-6 py-16 text-center">
                            <slot name="empty" />
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Cards body -->
        <div v-else-if="isCards" class="p-3" :class="fits ? 'min-h-0 flex-1 overflow-y-auto' : ''" :aria-busy="loading">
            <template v-if="loading && rows.length === 0">
                <div
                    class="grid"
                    :style="{
                        gridTemplateColumns: `repeat(auto-fill, minmax(${cardsMinWidth}, 1fr))`,
                        gap: cardsGap,
                    }"
                >
                    <div
                        v-for="n in cardSkeletonCount"
                        :key="'ck' + n"
                        class="animate-pulse rounded-xl bg-gray-100 dark:bg-white/5"
                        :style="{ height: cardSkeletonHeight }"
                    ></div>
                </div>
            </template>

            <div
                v-else-if="rows.length > 0"
                class="grid"
                :style="{
                    gridTemplateColumns: `repeat(auto-fill, minmax(${cardsMinWidth}, 1fr))`,
                    gap: cardsGap,
                }"
            >
                <slot name="cards" />
            </div>

            <div v-else-if="!error" class="px-6 py-16 text-center">
                <slot name="empty" />
            </div>
        </div>

        <!-- List body -->
        <div v-else-if="isList" :class="fits ? 'min-h-0 flex-1 overflow-y-auto' : ''" :aria-busy="loading">
            <template v-if="loading && rows.length === 0">
                <div class="divide-y divide-gray-100 dark:divide-white/5">
                    <div
                        v-for="n in listSkeletonCount"
                        :key="'lk' + n"
                        class="animate-pulse bg-gray-50 dark:bg-white/5"
                        :style="{ height: listSkeletonHeight }"
                    ></div>
                </div>
            </template>

            <div
                v-else-if="rows.length > 0"
                class="divide-y divide-gray-100 dark:divide-white/5"
            >
                <slot name="list" />
            </div>

            <div v-else-if="!error" class="px-6 py-16 text-center">
                <slot name="empty" />
            </div>
        </div>

        <!-- Pagination, same lift as the toolbar -->
        <div ref="footerBox">
            <Pagination
                :meta="meta"
                :per-page="perPage"
                :per-page-options="perPageOptions"
                :loading="loading"
                @page-change="emit('page-change', $event)"
                @per-page-change="emit('per-page-change', $event)"
            />
        </div>

        <div
            v-if="footer.up.value"
            class="pointer-events-none fixed z-20 flex justify-center"
            :style="footerStyle"
        >
            <div
                class="floating-bar is-bottom pointer-events-auto w-fit max-w-full overflow-hidden [&>*]:border-t-0 [&>*]:px-5"
                :class="footer.leaving.value ? 'is-leaving' : ''"
            >
                <Pagination
                    :meta="meta"
                    :per-page="perPage"
                    :per-page-options="perPageOptions"
                    :loading="loading"
                    compact
                    @page-change="emit('page-change', $event)"
                    @per-page-change="emit('per-page-change', $event)"
                />
            </div>
        </div>

        <div v-if="loading && rows.length > 0" class="h-0.5 w-full overflow-hidden bg-primary-100 dark:bg-primary-500/20">
            <div class="h-full w-1/3 animate-pulse bg-primary-500"></div>
        </div>
    </div>
</template>

<style scoped>
/*
    Glass: what is behind shows through, blurred and a shade more colourful. A hairline
    holds its edge, then two shadows lift it — a tight one that seats it and a wide one
    for the distance.
*/
.floating-bar {
    border-radius: 9999px;
    background-color: rgb(255 255 255 / 0.8);
    backdrop-filter: blur(28px) saturate(180%);
    -webkit-backdrop-filter: blur(28px) saturate(180%);
    box-shadow:
        0 0 0 1px rgb(0 0 0 / 0.08),
        0 4px 12px -2px rgb(0 0 0 / 0.26),
        0 28px 64px -12px rgb(0 0 0 / 0.62);
    animation: floating-bar-in-top 180ms cubic-bezier(0.2, 0, 0, 1);
}

/*
    The whole selector goes inside :global() — outside it, the descendant part is dropped.
    On a dark page a shadow has nothing left to darken, so the bar needs an edge of its own
    to stand apart from the rows behind it.
*/
:global(.dark .floating-bar) {
    background-color: rgb(17 24 39 / 0.8);
    box-shadow:
        0 0 0 1px rgb(255 255 255 / 0.12),
        0 4px 12px -2px rgb(0 0 0 / 0.7),
        0 28px 64px -12px rgb(0 0 0 / 0.95);
}

/* Each bar arrives from, and leaves towards, the edge it belongs to. */
.floating-bar.is-bottom {
    animation-name: floating-bar-in-bottom;
}

.floating-bar.is-leaving.is-top {
    animation: floating-bar-out-top 160ms ease-in forwards;
}

.floating-bar.is-leaving.is-bottom {
    animation: floating-bar-out-bottom 160ms ease-in forwards;
}

@keyframes floating-bar-in-top {
    from {
        opacity: 0;
        transform: translateY(-6px) scale(0.99);
    }
}

@keyframes floating-bar-in-bottom {
    from {
        opacity: 0;
        transform: translateY(6px) scale(0.99);
    }
}

@keyframes floating-bar-out-top {
    to {
        opacity: 0;
        transform: translateY(-6px) scale(0.99);
    }
}

@keyframes floating-bar-out-bottom {
    to {
        opacity: 0;
        transform: translateY(6px) scale(0.99);
    }
}
</style>
