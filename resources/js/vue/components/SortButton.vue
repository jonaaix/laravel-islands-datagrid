<script setup>
import { computed } from 'vue';
import { Icon, Tooltip } from '@aaix/laravel-islands/vue/helpers';

const props = defineProps({
    field: { type: String, required: true },
    label: { type: String, required: true },
    icon: { type: String, default: '' },
    short: { type: String, default: '' },
    sort: { type: String, default: '' },
    dir: { type: String, default: 'desc' },
});

const emit = defineEmits(['sort']);

const active = computed(() => props.sort === props.field);
</script>

<template>
    <Tooltip :text="icon || short ? label : ''">
        <button
            type="button"
            @click="emit('sort', field)"
            :aria-label="icon || short ? label : undefined"
            class="datagrid-sort-button inline-flex items-center gap-1 uppercase tracking-wide transition-colors hover:text-gray-700 dark:hover:text-gray-200"
            :class="active ? 'text-primary-600 dark:text-primary-400' : ''"
        >
            <Icon v-if="icon" :name="icon" class="h-4 w-4" />
            <template v-else-if="short">{{ short }}</template>
            <template v-else>{{ label }}</template>
            <svg
                class="h-3 w-3 transition-transform"
                :class="[active ? 'opacity-100' : 'opacity-30', active && dir === 'asc' ? 'rotate-180' : '']"
                viewBox="0 0 20 20"
                fill="currentColor"
            ><path fill-rule="evenodd" d="M10 5a.75.75 0 0 1 .75.75v6.638l2.72-2.72a.75.75 0 1 1 1.06 1.061l-4 4a.75.75 0 0 1-1.06 0l-4-4a.75.75 0 1 1 1.06-1.06l2.72 2.72V5.75A.75.75 0 0 1 10 5Z" clip-rule="evenodd"/></svg>
        </button>
    </Tooltip>
</template>
