<script setup>
import { Tooltip } from '@aaix/laravel-islands/vue/helpers';
import { useDatagrid } from '../context.js';
import IconModeTable from '../icons/IconModeTable.vue';
import IconModeCards from '../icons/IconModeCards.vue';

const props = defineProps({
    modelValue: { type: String, default: 'table' },
    labels: {
        type: Object,
        default: () => ({}),
    },
});

const emit = defineEmits(['update:modelValue']);

const { t } = useDatagrid();

const MODES = ['table', 'cards'];

function fallback(mode) {
    return mode === 'cards' ? t('Cards') : t('Table');
}

function labelFor(mode) {
    return props.labels?.[mode] || fallback(mode);
}

function pick(mode) {
    if (props.modelValue !== mode) {
        emit('update:modelValue', mode);
    }
}
</script>

<template>
    <div
        class="datagrid-view-mode inline-flex items-center rounded-full bg-gray-100 p-0.5 ring-1 ring-inset ring-gray-200 dark:bg-white/5 dark:ring-white/10"
        role="group"
        :aria-label="t('View mode')"
    >
        <template v-for="mode in MODES" :key="mode">
            <Tooltip :text="labelFor(mode)">
                <button
                    type="button"
                    @click="pick(mode)"
                    :aria-pressed="modelValue === mode ? 'true' : 'false'"
                    :aria-label="labelFor(mode)"
                    class="focus-visible:ring-primary-500 relative inline-flex h-7 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:text-gray-700 focus-visible:ring-2 focus-visible:outline-none dark:text-gray-400 dark:hover:text-gray-200"
                    :class="modelValue === mode
                        ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:text-white dark:ring-white/10'
                        : ''"
                >
                    <IconModeTable v-if="mode === 'table'" class="h-4 w-4" />
                    <IconModeCards v-else class="h-4 w-4" />
                </button>
            </Tooltip>
        </template>
    </div>
</template>
