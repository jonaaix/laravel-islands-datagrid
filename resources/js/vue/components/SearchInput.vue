<script setup>
import { ref } from 'vue';
import { useDatagrid } from '../context.js';

defineProps({
    modelValue: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    clearLabel: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue', 'clear']);

const { t } = useDatagrid();

const inputEl = ref(null);

function focus() {
    inputEl.value?.focus();
}

defineExpose({ focus });
</script>

<template>
    <!-- A width of its own rather than "whatever is left": in a bar that is only as wide as
         its content, "whatever is left" is the width of the placeholder text. -->
    <div class="relative h-9 w-80 min-w-[12rem] max-w-full flex-1 sm:max-w-[20rem]">
        <span class="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-gray-400">
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clip-rule="evenodd"/></svg>
        </span>
        <input
            ref="inputEl"
            type="search"
            :value="modelValue"
            @input="emit('update:modelValue', $event.target.value)"
            :placeholder="placeholder"
            class="h-9 w-full rounded-md border border-gray-200 bg-white pl-8 pr-9 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-white/10 dark:bg-gray-900 dark:text-gray-100 [&::-webkit-search-cancel-button]:appearance-none"
        />
        <button
            v-if="modelValue"
            type="button"
            @click="emit('clear')"
            :aria-label="clearLabel || t('Clear search')"
            class="absolute inset-y-0 right-1.5 my-auto flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-200"
        >
            <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"/></svg>
        </button>
    </div>
</template>
