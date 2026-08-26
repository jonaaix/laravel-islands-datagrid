<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Ripples, useRipple } from '@aaix/laravel-islands/vue/helpers';
import { useDatagrid } from '../context.js';

const props = defineProps({
    meta: { type: Object, required: true },
    perPage: { type: [Number, String], required: true },
    perPageOptions: { type: Array, default: () => [5, 10, 30, 50, 100, 200] },
    /** How many page numbers are on show. The row keeps its width as you page through. */
    pageCount: { type: Number, default: 7 },
    /** Fewer numbers on narrow viewports so the stepper never overflows the row. */
    narrowPageCount: { type: Number, default: 5 },
    /** Media query the narrow count applies to. */
    narrowBreakpoint: { type: String, default: '(max-width: 639px)' },
    /** Tighter, for the floating bar — there it is a passenger, not the furniture. */
    compact: { type: Boolean, default: false },
    /** While a page is on its way, the button that asked for it says so. */
    loading: { type: Boolean, default: false },
});

const emit = defineEmits(['page-change', 'per-page-change']);

const pendingPage = ref(null);
const ripple = useRipple();

const { t, locale } = useDatagrid();

const currentPage = computed(() => props.meta.page ?? 1);
const lastPage = computed(() => props.meta.lastPage ?? 1);
const totalLabel = computed(() => Number(props.meta.total ?? 0).toLocaleString(locale));

const isNarrow = ref(false);
let narrowMedia = null;

function onNarrowChange(event) {
    isNarrow.value = event.matches;
}

onMounted(() => {
    if (window.matchMedia && props.narrowBreakpoint) {
        narrowMedia = window.matchMedia(props.narrowBreakpoint);
        isNarrow.value = narrowMedia.matches;
        narrowMedia.addEventListener?.('change', onNarrowChange);
    }
});

onBeforeUnmount(() => {
    narrowMedia?.removeEventListener?.('change', onNarrowChange);
});

const effectivePageCount = computed(() => (isNarrow.value ? props.narrowPageCount : props.pageCount));

/**
 * A window of fixed size that slides rather than grows: at the ends it shifts inward
 * instead of shrinking, so the row of numbers never changes width mid-browse.
 */
const pages = computed(() => {
    const size = Math.min(effectivePageCount.value, lastPage.value);
    const half = Math.floor(size / 2);
    const from = Math.min(Math.max(1, currentPage.value - half), lastPage.value - size + 1);

    return Array.from({ length: size }, (_, i) => from + i);
});

const pageOptions = computed(() => Array.from({ length: lastPage.value }, (_, i) => i + 1));

function goToPage(page) {
    pendingPage.value = page;
    emit('page-change', page);

    if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0 });
    }
}

// The pending page is what the reader asked for; once the answer is in, the row itself says
// which page it is on.
watch(() => props.loading, (busy) => {
    if (!busy) {
        pendingPage.value = null;
    }
});
</script>

<template>
    <!--
        Across the card the three parts are a grid, so the stepper sits in the middle of the
        row no matter how wide the text beside it is. In a bar that is only as wide as its
        content those equal outer columns would stretch the narrower side into a gap, so
        there the parts simply line up.
    -->
    <div
        v-if="meta.paginated"
        class="items-center border-t border-gray-200 px-4 dark:border-white/10"
        :class="compact
            ? 'flex flex-wrap justify-center gap-x-5 gap-y-2 py-2'
            : 'grid grid-cols-2 gap-x-3 gap-y-8 py-3 sm:grid-cols-[1fr_auto_1fr] sm:gap-3'"
    >
        <!-- Left: range + items per page -->
        <div class="flex min-w-0 items-center gap-3 text-xs text-gray-500 dark:text-gray-400 max-sm:col-start-1 max-sm:row-start-1">
            <span v-if="meta.total" class="tabular-nums">{{ meta.from }} – {{ meta.to }} {{ t('of') }} {{ totalLabel }}</span>
            <span class="relative inline-flex items-center">
                <select
                    :value="perPage"
                    @change="emit('per-page-change', $event.target.value)"
                    :aria-label="t('Per page')"
                    class="h-8 appearance-none rounded-md border border-gray-200 bg-white pl-2.5 pr-7 text-xs text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-white/10 dark:bg-gray-900 dark:text-gray-200"
                >
                    <option v-for="n in perPageOptions" :key="n" :value="n">{{ n }} / {{ t('page') }}</option>
                </select>
                <svg class="pointer-events-none absolute right-2 h-3.5 w-3.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
                </svg>
            </span>
        </div>

        <!-- Center: stepper. The arrows keep their distance from the numbers — same shape and
             size, so without the gap they get hit by mistake when paging without looking. -->
        <div
            class="flex items-center justify-center max-sm:col-span-2 max-sm:col-start-1 max-sm:row-start-2"
            :class="isNarrow ? 'gap-2' : compact ? 'gap-4' : 'gap-6'"
        >
            <div class="flex items-center">
                <button
                    type="button"
                    :disabled="currentPage <= 1"
                    @pointerdown="ripple.press($event, 'first')"
                    @click="goToPage(1)"
                    :aria-label="t('First page')"
                    :class="isNarrow ? 'h-7 w-7' : compact ? 'h-8 w-8' : 'h-9 w-9'"
                    class="relative flex items-center justify-center overflow-hidden rounded-full text-gray-600 transition-colors hover:bg-gray-100 active:bg-gray-200 disabled:opacity-40 disabled:hover:bg-transparent disabled:active:bg-transparent dark:text-gray-300 dark:hover:bg-white/10 dark:active:bg-white/20"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" :class="isNarrow ? 'h-3.5 w-3.5' : 'h-4 w-4'">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M18.75 19.5 11.25 12l7.5-7.5M6 4.5v15" />
                    </svg>
                    <Ripples :items="ripple.on('first')" />
                </button>

                <button
                    type="button"
                    :disabled="currentPage <= 1"
                    @pointerdown="ripple.press($event, 'prev')"
                    @click="goToPage(currentPage - 1)"
                    :aria-label="t('Previous')"
                    :class="isNarrow ? 'h-7 w-7' : compact ? 'h-8 w-8' : 'h-9 w-9'"
                    class="relative flex items-center justify-center overflow-hidden rounded-full text-gray-600 transition-colors hover:bg-gray-100 active:bg-gray-200 disabled:opacity-40 disabled:hover:bg-transparent disabled:active:bg-transparent dark:text-gray-300 dark:hover:bg-white/10 dark:active:bg-white/20"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" :class="isNarrow ? 'h-3.5 w-3.5' : 'h-4 w-4'">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                    <Ripples :items="ripple.on('prev')" />
                </button>
            </div>

            <div class="flex items-center" :class="isNarrow ? 'gap-1' : 'gap-1.5'">
                <button
                    v-for="p in pages"
                    :key="p"
                    type="button"
                    @pointerdown="ripple.press($event, `page-${p}`)"
                    @click="goToPage(p)"
                    class="relative flex items-center justify-center overflow-hidden rounded-full font-medium tabular-nums ring-1 ring-inset transition-colors"
                    :class="[
                        isNarrow ? 'h-7 min-w-7 px-1.5 text-xs' : compact ? 'h-8 min-w-8 px-2 text-xs' : 'h-9 min-w-9 px-2.5 text-sm',
                        p === currentPage
                            ? 'bg-primary-600 text-white ring-primary-600 hover:bg-primary-500 active:bg-primary-700'
                            : 'text-gray-600 ring-gray-200 hover:bg-gray-50 active:bg-gray-200 dark:text-gray-300 dark:ring-white/10 dark:hover:bg-white/5 dark:active:bg-white/15',
                    ]"
                >
                    <svg
                        v-if="loading && pendingPage === p"
                        class="animate-spin"
                        :class="isNarrow || compact ? 'h-3 w-3' : 'h-3.5 w-3.5'"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                    >
                        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" class="opacity-25" />
                        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
                    </svg>
                    <template v-else>{{ p }}</template>

                    <Ripples :items="ripple.on(`page-${p}`)" />
                </button>
            </div>

            <div class="flex items-center">
                <button
                    type="button"
                    :disabled="currentPage >= lastPage"
                    @pointerdown="ripple.press($event, 'next')"
                    @click="goToPage(currentPage + 1)"
                    :aria-label="t('Next')"
                    :class="isNarrow ? 'h-7 w-7' : compact ? 'h-8 w-8' : 'h-9 w-9'"
                    class="relative flex items-center justify-center overflow-hidden rounded-full text-gray-600 transition-colors hover:bg-gray-100 active:bg-gray-200 disabled:opacity-40 disabled:hover:bg-transparent disabled:active:bg-transparent dark:text-gray-300 dark:hover:bg-white/10 dark:active:bg-white/20"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" :class="isNarrow ? 'h-3.5 w-3.5' : 'h-4 w-4'">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                    <Ripples :items="ripple.on('next')" />
                </button>

                <button
                    type="button"
                    :disabled="currentPage >= lastPage"
                    @pointerdown="ripple.press($event, 'last')"
                    @click="goToPage(lastPage)"
                    :aria-label="t('Last page')"
                    :class="isNarrow ? 'h-7 w-7' : compact ? 'h-8 w-8' : 'h-9 w-9'"
                    class="relative flex items-center justify-center overflow-hidden rounded-full text-gray-600 transition-colors hover:bg-gray-100 active:bg-gray-200 disabled:opacity-40 disabled:hover:bg-transparent disabled:active:bg-transparent dark:text-gray-300 dark:hover:bg-white/10 dark:active:bg-white/20"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" :class="isNarrow ? 'h-3.5 w-3.5' : 'h-4 w-4'">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m5.25 4.5 7.5 7.5-7.5 7.5M18 4.5v15" />
                    </svg>
                    <Ripples :items="ripple.on('last')" />
                </button>
            </div>
        </div>

        <!-- Right: jump to page -->
        <div
            class="flex min-w-0 items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 max-sm:col-start-2 max-sm:row-start-1"
            :class="compact ? '' : 'justify-end'"
        >
            <span>{{ t('Page') }}</span>
            <span class="relative inline-flex items-center">
                <select
                    :value="currentPage"
                    @change="goToPage(Number($event.target.value))"
                    :aria-label="t('Page')"
                    class="h-8 appearance-none rounded-md border border-gray-200 bg-white pl-2.5 pr-7 text-xs tabular-nums text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-white/10 dark:bg-gray-900 dark:text-gray-200"
                >
                    <option v-for="p in pageOptions" :key="p" :value="p">{{ p }}</option>
                </select>
                <svg class="pointer-events-none absolute right-2 h-3.5 w-3.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
                </svg>
            </span>
            <span class="tabular-nums">/ {{ lastPage }}</span>
        </div>
    </div>
</template>
