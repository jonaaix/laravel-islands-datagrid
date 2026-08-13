<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { IconButton } from '@aaix/laravel-islands/vue/helpers';
import { useDatagrid } from '../context.js';

const props = defineProps({
    modelValue: { type: [String, Number], default: 0 },
    options: { type: [Object, Array], default: () => ({}) },
    placeholder: { type: String, default: 'Select…' },
    searchPlaceholder: { type: String, default: 'Search…' },
    allLabel: { type: String, default: 'All' },
    emptyLabel: { type: String, default: 'No match' },
    emptyValue: { type: [String, Number], default: 0 },
    searchValues: { type: Boolean, default: false },
    fetchOptions: { type: Function, default: null },
    fetchDelay: { type: Number, default: 150 },
    loadingLabel: { type: String, default: '' },
    selectedLabel: { type: String, default: '' },
    /** `field` is a plain form control; `filter` and `filter-card` colour a set value. */
    variant: { type: String, default: 'field' },
    /** A long or deeply named list earns more room than the trigger it hangs under. */
    menuWidth: { type: Number, default: 288 },
    menuHeight: { type: Number, default: 240 },
    /** How many entries a list may show at once; zero or less shows all of them. */
    maxOptions: { type: Number, default: 60 },
    /** The row that resets the choice — redundant where the trigger already carries a clear. */
    clearOption: { type: Boolean, default: true },
    /**
     * In a list whose entries carry a `depth`, a match keeps the entries it sits under, so
     * searching narrows the tree instead of flattening it.
     */
    keepAncestors: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue']);

const { t } = useDatagrid();

const open = ref(false);
const query = ref('');
const searchInput = ref(null);
const highlighted = ref(0);
const triggerEl = ref(null);
const menuStyle = ref({});
const remoteOptions = ref(null);
const loadingOptions = ref(false);
const picked = ref(null);

let fetchId = 0;
let fetchTimer = null;

function updatePosition() {
    const el = triggerEl.value;
    if (!el) {
        return;
    }
    const r = el.getBoundingClientRect();

    // Pulled back only far enough to stay on screen, so a wide menu under a trigger near the
    // right edge does not run off it.
    const left = Math.max(8, Math.min(r.left, window.innerWidth - props.menuWidth - 8));

    menuStyle.value = { top: `${r.bottom + 4}px`, left: `${left}px`, width: `${props.menuWidth}px` };
}

/** A list may carry more than a value and a label — whatever it adds reaches the slot. */
function normalize(raw) {
    if (Array.isArray(raw)) {
        return raw.map((option) => ({ ...option }));
    }

    return Object.entries(raw ?? {}).map(([value, label]) => ({ value, label }));
}

const normalizedOptions = computed(() => normalize(props.options));

const FOCUS = 'focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500';

const VARIANTS = {
    field: {
        base: `flex h-9 items-center rounded-md border pl-2.5 pr-1 text-sm transition-colors ${FOCUS}`,
        on: 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50 dark:border-white/10 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-white/5',
        off: 'border-gray-200 bg-white text-gray-400 hover:bg-gray-50 dark:border-white/10 dark:bg-gray-900 dark:text-gray-500 dark:hover:bg-white/5',
        clear: 'hover:bg-gray-100 dark:hover:bg-white/10',
    },
    filter: {
        base: `flex h-9 items-center rounded-md border pl-2.5 pr-1 text-sm transition-colors ${FOCUS}`,
        on: 'border-primary-200 bg-primary-50 text-primary-800 dark:border-primary-500/30 dark:bg-primary-500/15 dark:text-primary-200',
        off: 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-white/5',
        clear: 'hover:bg-primary-200/60 dark:hover:bg-primary-500/25',
    },
    'filter-card': {
        base: `flex h-9 items-center rounded-lg pl-3 pr-1.5 text-sm font-medium transition-colors ${FOCUS}`,
        on: 'bg-primary-500/15 text-primary-800 dark:text-primary-200',
        off: 'bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10',
        clear: 'hover:bg-primary-200/60 dark:hover:bg-primary-500/25',
    },
};

const skin = computed(() => VARIANTS[props.variant] ?? VARIANTS.field);

const hasValue = computed(() => props.modelValue !== 0 && props.modelValue !== '' && props.modelValue != null);
const selectedName = computed(() => {
    const target = String(props.modelValue);

    // A lazy list forgets its options on close, so remember what was picked here.
    if (picked.value && String(picked.value.value) === target) {
        return picked.value.label;
    }

    const match = [...normalizedOptions.value, ...(remoteOptions.value ?? [])]
        .find((option) => String(option.value) === target)?.label;

    return match ?? props.selectedLabel ?? '';
});

const filtered = computed(() => {
    const q = query.value.trim().toLowerCase();
    const cap = props.maxOptions > 0 ? props.maxOptions : Infinity;

    // A remote source has already filtered server-side.
    if (props.fetchOptions && q !== '') {
        return (remoteOptions.value ?? []).slice(0, cap);
    }

    const hit = (option) => String(option.label).toLowerCase().includes(q)
        || (props.searchValues && String(option.value).toLowerCase().includes(q));

    if (!q) {
        return normalizedOptions.value.slice(0, cap);
    }

    if (!props.keepAncestors) {
        return normalizedOptions.value.filter(hit).slice(0, cap);
    }

    return withAncestors(normalizedOptions.value, hit).slice(0, cap);
});

/**
 * Every match, plus the entry each one sits under — found by walking back to the nearest
 * shallower entry, since a flat list in tree order is all the depth tells us.
 */
function withAncestors(options, hit) {
    const keep = new Set();

    options.forEach((option, index) => {
        if (!hit(option)) {
            return;
        }

        keep.add(index);

        let depth = Number(option.depth ?? 0);

        for (let above = index - 1; above >= 0 && depth > 0; above--) {
            const found = Number(options[above].depth ?? 0);

            if (found < depth) {
                keep.add(above);
                depth = found;
            }
        }
    });

    return [...keep].sort((a, b) => a - b).map((index) => options[index]);
}

watch(query, (value) => {
    highlighted.value = 0;

    if (!props.fetchOptions) {
        return;
    }

    clearTimeout(fetchTimer);
    const q = value.trim();

    if (q === '') {
        remoteOptions.value = null;
        loadingOptions.value = false;

        return;
    }

    loadingOptions.value = true;
    fetchTimer = setTimeout(async () => {
        const id = ++fetchId;

        try {
            const result = await props.fetchOptions(q);

            if (id === fetchId) {
                remoteOptions.value = normalize(result);
            }
        } catch (e) {
            if (id === fetchId) {
                remoteOptions.value = [];
            }
        } finally {
            if (id === fetchId) {
                loadingOptions.value = false;
            }
        }
    }, props.fetchDelay);
});

function toggle() {
    open.value = !open.value;
    if (open.value) {
        query.value = '';
        remoteOptions.value = null;
        loadingOptions.value = false;
        highlighted.value = 0;
        updatePosition();
        nextTick(() => searchInput.value?.focus());
    }
}
function close() { open.value = false; }
function select(key) {
    const option = filtered.value.find((o) => String(o.value) === String(key));
    picked.value = option ? { value: option.value, label: option.label } : null;
    emit('update:modelValue', key);
    close();
}
function clear() { picked.value = null; emit('update:modelValue', props.emptyValue); close(); }
function onKeydown(e) {
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        highlighted.value = Math.min(highlighted.value + 1, filtered.value.length - 1);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        highlighted.value = Math.max(highlighted.value - 1, 0);
    } else if (e.key === 'Enter') {
        e.preventDefault();
        const hit = filtered.value[highlighted.value];
        if (hit) {
            select(hit.value);
        }
    } else if (e.key === 'Escape') {
        close();
    }
}
</script>

<template>
    <div class="relative">
        <!--
            The whole surface opens the list, not just the words on it: the padding of a wide
            trigger is a large part of what a pointer aims at. The button inside stays the
            control a keyboard reaches, and its click arrives here just the same.
        -->
        <div
            ref="triggerEl"
            @click="toggle"
            :class="[skin.base, 'cursor-pointer', hasValue ? skin.on : skin.off]"
        >
            <button
                type="button"
                role="combobox"
                :aria-expanded="open"
                class="flex min-w-0 flex-1 items-center text-left focus:outline-none"
            >
                <template v-if="hasValue">
                    <slot v-if="$slots.selected" name="selected" :key-value="modelValue" :label="selectedName" />
                    <slot v-else name="option" :key-value="modelValue" :label="selectedName">
                        <span class="max-w-[12rem] truncate">{{ selectedName }}</span>
                    </slot>
                </template>
                <span v-else class="max-w-[12rem] truncate">{{ placeholder }}</span>
            </button>
            <IconButton
                v-if="hasValue"
                :label="allLabel"
                size="xs"
                tone="plain"
                :tooltip="false"
                class="ml-1"
                :class="skin.clear"
                @click.stop="clear"
            >
                <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
            </IconButton>
            <span v-else class="ml-1 flex h-6 w-6 shrink-0 items-center justify-center" aria-hidden="true">
                <svg class="h-4 w-4 opacity-50 transition-transform" :class="open ? 'rotate-180' : ''" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
                </svg>
            </span>
        </div>

        <Teleport to="body">
        <div v-if="open" class="fixed inset-0 z-[60]" @click="close"></div>
        <div v-if="open" class="fixed z-[61] overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-white/10" :style="menuStyle">
            <div class="relative border-b border-gray-100 p-2 dark:border-white/10">
                <span class="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray-400">
                    <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clip-rule="evenodd"/></svg>
                </span>
                <input
                    ref="searchInput"
                    v-model="query"
                    type="search"
                    :placeholder="searchPlaceholder"
                    @keydown="onKeydown"
                    class="h-8 w-full rounded-md border border-gray-200 bg-white pl-8 pr-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-white/10 dark:bg-gray-900 dark:text-gray-100"
                />
            </div>
            <ul role="listbox" class="overflow-y-auto py-1" :style="{ maxHeight: `${menuHeight}px` }">
                <li v-if="loadingOptions" class="flex items-center justify-center gap-2 py-6 text-sm text-gray-400">
                    <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v3a5 5 0 0 0-5 5H4Z" />
                    </svg>
                    {{ loadingLabel || t('Loading…') }}
                </li>
                <template v-else>
                <li v-if="hasValue && clearOption">
                    <button type="button" @click="clear" class="flex w-full items-center px-3 py-1.5 text-left text-sm text-primary-700 hover:bg-gray-50 dark:text-primary-300 dark:hover:bg-white/5">
                        {{ allLabel }}
                    </button>
                </li>
                <li v-for="(option, i) in filtered" :key="option.value" role="option" :aria-selected="String(option.value) === String(modelValue)">
                    <button
                        type="button"
                        @click="select(option.value)"
                        @mouseenter="highlighted = i"
                        class="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm"
                        :class="[
                            i === highlighted ? 'bg-gray-50 dark:bg-white/5' : '',
                            String(option.value) === String(modelValue) ? 'font-semibold text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-200',
                        ]"
                    >
                        <slot name="option" :key-value="option.value" :label="option.label" :option="option">
                            <span class="truncate">{{ option.label }}</span>
                        </slot>
                        <svg v-if="String(option.value) === String(modelValue)" class="h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </li>
                <li v-if="!filtered.length" class="py-6 text-center text-sm text-gray-400">{{ emptyLabel }}</li>
                </template>
            </ul>
        </div>
        </Teleport>
    </div>
</template>
