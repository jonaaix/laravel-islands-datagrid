<script setup>
import { computed } from 'vue';
import { useDatagrid } from '../context.js';

const props = defineProps({
    meta: { type: Object, required: true },
    perPage: { type: [Number, String], required: true },
    perPageOptions: { type: Array, default: () => [5, 10, 30, 50, 100, 200] },
    /** How many page numbers are on show. The row keeps its width as you page through. */
    pageCount: { type: Number, default: 7 },
    /** Tighter, for the floating bar — there it is a passenger, not the furniture. */
    compact: { type: Boolean, default: false },
});

const emit = defineEmits(['page-change', 'per-page-change']);

const { t, locale } = useDatagrid();

const currentPage = computed(() => props.meta.page ?? 1);
const lastPage = computed(() => props.meta.lastPage ?? 1);
const totalLabel = computed(() => Number(props.meta.total ?? 0).toLocaleString(locale));

/**
 * A window of fixed size that slides rather than grows: at the ends it shifts inward
 * instead of shrinking, so the row of numbers never changes width mid-browse.
 */
const pages = computed(() => {
    const size = Math.min(props.pageCount, lastPage.value);
    const half = Math.floor(size / 2);
    const from = Math.min(Math.max(1, currentPage.value - half), lastPage.value - size + 1);

    return Array.from({ length: size }, (_, i) => from + i);
});

const pageOptions = computed(() => Array.from({ length: lastPage.value }, (_, i) => i + 1));

function goToPage(page) {
    emit('page-change', page);

    if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0 });
    }
}
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
            : 'grid grid-cols-1 gap-3 py-3 sm:grid-cols-[1fr_auto_1fr]'"
    >
        <!-- Left: range + items per page -->
        <div class="flex min-w-0 items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
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
        <div class="flex items-center justify-center" :class="compact ? 'gap-4' : 'gap-6'">
            <div class="flex items-center">
                <button
                    type="button"
                    :disabled="currentPage <= 1"
                    @click="goToPage(1)"
                    :aria-label="t('First page')"
                    :class="compact ? 'h-8 w-8' : 'h-9 w-9'"
                    class="flex items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent dark:text-gray-300 dark:hover:bg-white/10"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" class="h-4 w-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M18.75 19.5 11.25 12l7.5-7.5M6 4.5v15" />
                    </svg>
                </button>

                <button
                    type="button"
                    :disabled="currentPage <= 1"
                    @click="goToPage(currentPage - 1)"
                    :aria-label="t('Previous')"
                    :class="compact ? 'h-8 w-8' : 'h-9 w-9'"
                    class="flex items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent dark:text-gray-300 dark:hover:bg-white/10"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" class="h-4 w-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                </button>
            </div>

            <div class="flex items-center gap-1.5">
                <button
                    v-for="p in pages"
                    :key="p"
                    type="button"
                    @click="goToPage(p)"
                    class="flex items-center justify-center rounded-full font-medium tabular-nums ring-1 ring-inset transition-colors"
                    :class="[
                        compact ? 'h-8 min-w-8 px-2 text-xs' : 'h-9 min-w-9 px-2.5 text-sm',
                        p === currentPage
                            ? 'bg-primary-600 text-white ring-primary-600'
                            : 'text-gray-600 ring-gray-200 hover:bg-gray-50 dark:text-gray-300 dark:ring-white/10 dark:hover:bg-white/5',
                    ]"
                >{{ p }}</button>
            </div>

            <div class="flex items-center">
                <button
                    type="button"
                    :disabled="currentPage >= lastPage"
                    @click="goToPage(currentPage + 1)"
                    :aria-label="t('Next')"
                    :class="compact ? 'h-8 w-8' : 'h-9 w-9'"
                    class="flex items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent dark:text-gray-300 dark:hover:bg-white/10"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" class="h-4 w-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                </button>

                <button
                    type="button"
                    :disabled="currentPage >= lastPage"
                    @click="goToPage(lastPage)"
                    :aria-label="t('Last page')"
                    :class="compact ? 'h-8 w-8' : 'h-9 w-9'"
                    class="flex items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent dark:text-gray-300 dark:hover:bg-white/10"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" class="h-4 w-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m5.25 4.5 7.5 7.5-7.5 7.5M18 4.5v15" />
                    </svg>
                </button>
            </div>
        </div>

        <!-- Right: jump to page -->
        <div
            class="flex min-w-0 items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"
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
