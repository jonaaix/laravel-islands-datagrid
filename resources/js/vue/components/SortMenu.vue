<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useDatagrid } from '../context.js';

const props = defineProps({
    options: { type: Array, required: true },
    sort: { type: String, default: '' },
    dir: { type: String, default: 'desc' },
    label: { type: String, default: '' },
});

const emit = defineEmits(['sort']);

const { t } = useDatagrid();

const open = ref(false);
const triggerEl = ref(null);
const menuStyle = ref({});

const active = computed(() => props.options.find((option) => option.field === props.sort) ?? null);

function updatePosition() {
    const el = triggerEl.value;

    if (!el) {
        return;
    }

    const box = el.getBoundingClientRect();

    menuStyle.value = { top: `${box.bottom + 4}px`, left: `${box.left}px` };
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

function pick(field) {
    emit('sort', field);
    close();
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
    <div ref="triggerEl" class="datagrid-sort-menu relative">
        <button
            type="button"
            @click="toggleMenu()"
            :aria-expanded="open ? 'true' : 'false'"
            :aria-label="label || t('Sort by')"
            class="focus-visible:ring-primary-500 inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium ring-1 ring-inset transition-colors focus-visible:ring-2 focus-visible:outline-none"
            :class="active
                ? 'bg-primary-500/10 text-primary-700 ring-primary-500/25 hover:bg-primary-500/15 dark:text-primary-300'
                : 'bg-transparent text-gray-500 ring-gray-200 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:ring-white/10 dark:hover:bg-white/5 dark:hover:text-gray-200'"
        >
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 6.75h18M6 12h12M10 17.25h4" />
            </svg>

            <span class="truncate">{{ active ? active.label : (label || t('Sort by')) }}</span>

            <svg
                v-if="active"
                class="h-3 w-3"
                :class="dir === 'asc' ? 'rotate-180' : ''"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
            >
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
        </button>

        <Teleport to="body">
            <div v-if="open" class="fixed inset-0 z-[60]" @click="close()"></div>

            <div
                v-if="open"
                class="fixed z-[61] w-56 overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-white/10"
                :style="menuStyle"
            >
                <p class="border-b border-gray-100 px-3 py-2 text-[10px] font-medium tracking-wide text-gray-500 uppercase dark:border-white/10 dark:text-gray-400">
                    {{ label || t('Sort by') }}
                </p>

                <ul class="max-h-[60vh] overflow-y-auto py-1">
                    <li v-for="option in options" :key="option.field">
                        <button
                            type="button"
                            @click="pick(option.field)"
                            :aria-pressed="sort === option.field ? 'true' : 'false'"
                            class="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5"
                            :class="sort === option.field ? 'text-primary-700 dark:text-primary-300 font-medium' : ''"
                        >
                            <span class="min-w-0 flex-1 truncate">{{ option.label }}</span>

                            <span
                                v-if="sort === option.field"
                                class="text-primary-600 dark:text-primary-400 inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase"
                            >
                                {{ dir === 'asc' ? t('Asc') : t('Desc') }}
                                <svg
                                    class="h-3 w-3"
                                    :class="dir === 'asc' ? 'rotate-180' : ''"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    aria-hidden="true"
                                >
                                    <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                </svg>
                            </span>
                        </button>
                    </li>
                </ul>
            </div>
        </Teleport>
    </div>
</template>
