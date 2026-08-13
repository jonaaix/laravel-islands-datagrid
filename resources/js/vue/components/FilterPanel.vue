<script setup>
import { Comment, computed, useSlots } from 'vue';
import { IconButton } from '@aaix/laravel-islands/vue/helpers';
import { useDatagrid } from '../context.js';

defineProps({
    title: { type: String, default: '' },
});

const emit = defineEmits(['close']);
const { t } = useDatagrid();
const slots = useSlots();

const hasFooter = computed(() => (slots.footer?.() ?? []).some((node) => node.type !== Comment));
</script>

<template>
    <aside class="flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-white/10">
        <div class="flex h-[var(--filter-panel-header-h,3.25rem)] shrink-0 items-center justify-between gap-2 border-b border-gray-200 px-4 dark:border-white/10">
            <h2 class="truncate text-sm font-semibold text-gray-900 dark:text-white">{{ title || t('Filters') }}</h2>
            <IconButton :label="t('Minimize')" :tooltip="false" @click="emit('close')">
                <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"/></svg>
            </IconButton>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto p-4">
            <slot />
        </div>

        <div v-if="hasFooter" class="border-t border-gray-200 px-4 py-3 dark:border-white/10">
            <slot name="footer" />
        </div>
    </aside>
</template>
