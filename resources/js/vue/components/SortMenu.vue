<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { FieldCaption, IconButton } from '@aaix/laravel-islands/vue/helpers';
import { useDatagrid } from '../context.js';
import IconSort from '../icons/IconSort.vue';

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
        <IconButton
            :label="label || t('Sort by')"
            size="lg"
            :tone="open ? 'active' : 'quiet'"
            :tooltip="false"
            :aria-expanded="open ? 'true' : 'false'"
            @click="toggleMenu()"
        >
            <IconSort />
        </IconButton>

        <Teleport to="body">
            <div v-if="open" class="fixed inset-0 z-[60]" @click="close()"></div>

            <div
                v-if="open"
                class="fixed z-[61] w-56 overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-white/10"
                :style="menuStyle"
            >
                <p class="border-b border-gray-100 px-3 py-2 dark:border-white/10">
                    <FieldCaption>{{ label || t('Sort by') }}</FieldCaption>
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
