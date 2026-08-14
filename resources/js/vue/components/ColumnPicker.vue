<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { FieldCaption, IconButton } from '@aaix/laravel-islands/vue/helpers';
import { useDatagrid } from '../context.js';
import IconColumns from '../icons/IconColumns.vue';

const props = defineProps({
    /** @type {Array<{key: string, label: string, locked?: boolean}>} */
    columns: { type: Array, required: true },
    /** @type {Array<string>} */
    visible: { type: Array, required: true },
    label: { type: String, default: '' },
    resetLabel: { type: String, default: '' },
    changed: { type: Boolean, default: false },
});

const emit = defineEmits(['update', 'reset']);

const { t } = useDatagrid();

const open = ref(false);
const triggerEl = ref(null);
const menuStyle = ref({});

const chosen = computed(() => new Set(props.visible));

const count = computed(() => props.columns.filter((column) => chosen.value.has(column.key)).length);

function updatePosition() {
    const el = triggerEl.value;

    if (!el) {
        return;
    }

    const box = el.getBoundingClientRect();

    menuStyle.value = { top: `${box.bottom + 4}px`, right: `${window.innerWidth - box.right}px` };
}

function toggleMenu() {
    open.value = !open.value;

    if (open.value) {
        updatePosition();
        nextTick(updatePosition);
    }
}

function close() {
    open.value = false;
}

function toggle(column) {
    if (column.locked) {
        return;
    }

    const next = props.columns
        .filter((candidate) => (candidate.key === column.key ? !chosen.value.has(column.key) : chosen.value.has(candidate.key)))
        .map((candidate) => candidate.key);

    emit('update', next);
}

function onViewportChange() {
    if (open.value) {
        updatePosition();
    }
}

function onKeydown(event) {
    if (event.key === 'Escape' && open.value) {
        close();
    }
}

onMounted(() => {
    window.addEventListener('scroll', onViewportChange, { passive: true });
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
    window.removeEventListener('scroll', onViewportChange);
    window.removeEventListener('resize', onViewportChange);
    window.removeEventListener('keydown', onKeydown);
});
</script>

<template>
    <div ref="triggerEl" class="column-picker relative">
        <IconButton
            :label="label || t('Columns')"
            size="lg"
            :tone="open ? 'active' : 'quiet'"
            :tooltip="false"
            class="relative"
            :aria-expanded="open ? 'true' : 'false'"
            @click="toggleMenu()"
        >
            <IconColumns />

            <span
                v-if="changed"
                class="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white dark:bg-primary-500 dark:ring-gray-900"
            >{{ count }}</span>
        </IconButton>

        <Teleport to="body">
            <div v-if="open" class="fixed inset-0 z-[60]" @click="close()"></div>

            <div
                v-if="open"
                class="fixed z-[61] w-64 overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-white/10"
                :style="menuStyle"
            >
                <p class="border-b border-gray-100 px-3 py-2 dark:border-white/10">
                    <FieldCaption>{{ label || t('Columns') }}</FieldCaption>
                </p>

                <ul class="max-h-[60vh] overflow-y-auto py-1">
                    <li v-for="column in columns" :key="column.key">
                        <button
                            type="button"
                            @click="toggle(column)"
                            :disabled="column.locked"
                            :aria-pressed="chosen.has(column.key) ? 'true' : 'false'"
                            class="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm transition-colors"
                            :class="column.locked
                                ? 'cursor-default text-gray-400 dark:text-gray-500'
                                : 'text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5'"
                        >
                            <span
                                class="flex h-4 w-4 shrink-0 items-center justify-center rounded ring-1 ring-inset transition-colors"
                                :class="chosen.has(column.key)
                                    ? (column.locked
                                        ? 'bg-gray-300 ring-gray-300 dark:bg-gray-600 dark:ring-gray-600'
                                        : 'bg-primary-600 ring-primary-600 dark:bg-primary-500 dark:ring-primary-500')
                                    : 'bg-white ring-gray-300 dark:bg-gray-900 dark:ring-white/20'"
                            >
                                <svg v-if="chosen.has(column.key)" class="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd"/></svg>
                            </span>

                            <span class="min-w-0 flex-1">{{ column.label }}</span>
                        </button>
                    </li>
                </ul>

                <div v-if="changed" class="border-t border-gray-100 p-2 dark:border-white/10">
                    <button
                        type="button"
                        @click="emit('reset'); close();"
                        class="flex w-full items-center justify-center rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >{{ resetLabel || t('Reset columns') }}</button>
                </div>
            </div>
        </Teleport>
    </div>
</template>
