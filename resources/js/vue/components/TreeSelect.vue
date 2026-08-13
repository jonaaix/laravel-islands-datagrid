<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { IconButton, Popover } from '@aaix/laravel-islands/vue/helpers';
import { httpClient } from '../http.js';

const props = defineProps({
    modelValue: { type: [String, Number], default: null },
    options: { type: Array, default: null },
    optionsUrl: { type: String, default: '' },
    selectedPath: { type: String, default: '' },
    separator: { type: String, default: '»' },
    width: { type: Number, default: 480 },
    listHeight: { type: String, default: '20rem' },
    resultLimit: { type: Number, default: 200 },
    disabled: { type: Boolean, default: false },
    clearable: { type: Boolean, default: false },
    placeholder: { type: String, default: '' },
    clearLabel: { type: String, default: '' },
    searchPlaceholder: { type: String, default: '' },
    loadingLabel: { type: String, default: '' },
    errorLabel: { type: String, default: '' },
    retryLabel: { type: String, default: '' },
    emptyLabel: { type: String, default: '' },
    countLabelFor: { type: Function, default: null },
    hintLabel: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue', 'open', 'close']);

// The tree is identical for every row, so the first picker to open pays for all of them.
const cache = new Map();

const refetched = new Set();

const open = ref(false);
const query = ref('');
const options = ref(props.options ?? cache.get(props.optionsUrl)?.data ?? []);
const loading = ref(false);
const failed = ref(false);
const highlighted = ref(0);
const trigger = ref(null);
const searchInput = ref(null);
const listEl = ref(null);

watch(() => props.options, (list) => {
    if (list) {
        options.value = list;
    }
});

const picked = computed(
    () => options.value.find((option) => String(option.id) === String(props.modelValue)) ?? null,
);

const path = computed(() => picked.value?.path ?? props.selectedPath ?? '');

const segments = computed(() =>
    path.value.split(props.separator).map((part) => part.trim()).filter(Boolean),
);

/**
 * Filtering keeps the tree intact: matching categories stay in place and the
 * branches above them stay visible as headings, so a hit never loses the
 * context that tells you which of two same-named categories it is.
 */
const filtered = computed(() => {
    const needle = query.value.trim().toLowerCase();

    if (!needle) {
        return options.value.slice(0, props.resultLimit);
    }

    const words = needle.split(/\s+/);

    const matches = options.value
        .filter((option) => option.selectable && words.every((word) => option.path.toLowerCase().includes(word)))
        .slice(0, props.resultLimit);

    const matched = new Set(matches.map((option) => option.id));
    const branches = new Set();

    for (const match of matches) {
        const parts = match.path.split(props.separator).map((part) => part.trim());

        for (let i = 1; i < parts.length; i += 1) {
            branches.add(parts.slice(0, i).join(` ${props.separator} `));
        }
    }

    return options.value.filter((option) => matched.has(option.id) || branches.has(option.path));
});

const selectableIndexes = computed(() =>
    filtered.value.reduce((list, option, index) => {
        if (option.selectable) {
            list.push(index);
        }

        return list;
    }, []),
);

const footer = computed(() => [
    props.countLabelFor ? props.countLabelFor(selectableIndexes.value.length) : '',
    props.hintLabel,
].filter(Boolean).join(' · '));

async function loadOptions() {
    if (props.options || !props.optionsUrl) {
        return;
    }

    const entry = cache.get(props.optionsUrl);

    if (entry?.data) {
        options.value = entry.data;

        return;
    }

    loading.value = true;
    failed.value = false;

    try {
        const request = entry?.request ?? httpClient.get(props.optionsUrl);
        cache.set(props.optionsUrl, { request });
        const { data } = await request;
        const list = data?.data ?? [];
        cache.set(props.optionsUrl, { data: list });
        options.value = list;
    } catch (e) {
        cache.delete(props.optionsUrl);
        failed.value = true;
    } finally {
        loading.value = false;
    }
}

async function refresh() {
    cache.delete(props.optionsUrl);

    return loadOptions();
}

watch(() => props.modelValue, async (value) => {
    const url = props.optionsUrl;

    if (value == null || props.options || !url || refetched.has(url) || !cache.get(url)?.data) {
        return;
    }

    if (!options.value.some((option) => String(option.id) === String(value))) {
        refetched.add(url);
        await refresh();
    }
});

async function show() {
    if (props.disabled) {
        return;
    }

    query.value = '';
    highlighted.value = 0;
    open.value = true;
    emit('open');
    loadOptions();
    await nextTick();
    searchInput.value?.focus();
}

function close() {
    open.value = false;
    emit('close');
}

function pick(option) {
    if (!option?.selectable) {
        return;
    }

    emit('update:modelValue', option.id);
    close();
}

function clear() {
    emit('update:modelValue', null);
    close();
}

function step(direction) {
    const reachable = selectableIndexes.value;

    if (!reachable.length) {
        return;
    }

    const position = reachable.indexOf(highlighted.value);

    if (position === -1) {
        highlighted.value = direction > 0
            ? (reachable.find((index) => index > highlighted.value) ?? reachable[0])
            : ([...reachable].reverse().find((index) => index < highlighted.value) ?? reachable[reachable.length - 1]);

        return;
    }

    highlighted.value = reachable[Math.min(Math.max(position + direction, 0), reachable.length - 1)];
}

function scrollToHighlighted() {
    nextTick(() => {
        listEl.value?.querySelector('[data-highlighted="true"]')?.scrollIntoView({ block: 'nearest' });
    });
}

function onKeydown(event) {
    if (event.key === 'ArrowDown') {
        event.preventDefault();
        step(1);
        scrollToHighlighted();
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        step(-1);
        scrollToHighlighted();
    } else if (event.key === 'Enter') {
        event.preventDefault();
        const hit = filtered.value[highlighted.value];

        if (hit) {
            pick(hit);
        }
    } else if (event.key === 'Escape') {
        event.preventDefault();
        close();
    }
}

watch(query, () => {
    highlighted.value = selectableIndexes.value[0] ?? 0;
});

watch(filtered, (list) => {
    if (!list[highlighted.value]?.selectable) {
        highlighted.value = selectableIndexes.value[0] ?? 0;
    }
});

defineExpose({ show, close, loadOptions, refresh });
</script>

<template>
    <div class="tree-select">
        <div ref="trigger" class="relative">
            <slot name="trigger" :open="show" :path="path" :segments="segments" :picked="picked">
                <button
                    type="button"
                    @click.stop="show()"
                    :disabled="disabled"
                    :aria-expanded="open"
                    class="flex h-9 w-full items-center gap-1 rounded-md border border-gray-200 bg-white pl-2.5 pr-2 text-left text-sm transition-colors hover:bg-gray-50 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-gray-900 dark:hover:bg-white/5"
                >
                    <span v-if="segments.length" class="flex min-w-0 flex-1 flex-wrap items-center gap-x-1">
                        <template v-for="(segment, i) in segments" :key="i">
                            <span
                                class="truncate"
                                :class="i === segments.length - 1
                                    ? 'text-gray-900 dark:text-gray-100'
                                    : 'text-gray-500 dark:text-gray-400'"
                            >{{ segment }}</span>
                            <svg v-if="i < segments.length - 1" class="h-3 w-3 shrink-0 text-gray-300 dark:text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m9 5 7 7-7 7"/></svg>
                        </template>
                    </span>
                    <span v-else class="min-w-0 flex-1 truncate text-gray-400 dark:text-gray-500">{{ placeholder }}</span>

                    <svg v-if="!clearable || !picked" class="h-4 w-4 shrink-0 opacity-50 transition-transform" :class="open ? 'rotate-180' : ''" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
                    </svg>
                </button>

                <IconButton
                    v-if="clearable && picked"
                    :label="clearLabel"
                    size="xs"
                    tone="quiet"
                    :tooltip="false"
                    class="absolute inset-y-0 right-1.5 my-auto"
                    @click.stop="clear()"
                >
                    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                    </svg>
                </IconButton>
            </slot>
        </div>

        <Popover :anchor="trigger" :open="open" :width="width" @close="close()">
            <div>
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

                <ul ref="listEl" class="slim-scrollbar overflow-y-auto py-1" :style="{ maxHeight: `var(--picker-list-h, ${listHeight})` }" role="listbox">
                    <li v-if="loading" class="flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
                        <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" d="M12 3a9 9 0 1 0 9 9"/></svg>
                        {{ loadingLabel }}
                    </li>

                    <li v-else-if="failed" class="flex items-center justify-center gap-3 py-8 text-sm">
                        <span class="text-red-600 dark:text-red-400">{{ errorLabel }}</span>
                        <button type="button" @click="loadOptions()" class="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200">{{ retryLabel }}</button>
                    </li>

                    <template v-else>
                        <li
                            v-for="(option, i) in filtered"
                            :key="option.id"
                            role="option"
                            :aria-selected="String(option.id) === String(modelValue)"
                            :data-highlighted="i === highlighted"
                        >
                            <div
                                v-if="!option.selectable"
                                class="truncate py-1 pr-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500"
                                :style="{ paddingLeft: `${0.75 + option.depth * 0.85}rem` }"
                            >{{ option.name }}</div>

                            <button
                                v-else
                                type="button"
                                @click="pick(option)"
                                @mouseenter="highlighted = i"
                                class="flex w-full items-center justify-between gap-2 py-1 pr-3 text-left"
                                :class="i === highlighted ? 'bg-gray-50 dark:bg-white/5' : ''"
                                :style="{ paddingLeft: `${0.75 + option.depth * 0.85}rem` }"
                            >
                                <span class="min-w-0">
                                    <span
                                        class="block truncate text-sm leading-tight"
                                        :class="String(option.id) === String(modelValue)
                                            ? 'font-semibold text-primary-700 dark:text-primary-300'
                                            : 'text-gray-700 dark:text-gray-200'"
                                    >{{ option.name }}</span>
                                </span>

                                <svg v-if="String(option.id) === String(modelValue)" class="h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd"/></svg>
                            </button>
                        </li>

                        <li v-if="!filtered.length" class="py-8 text-center text-sm text-gray-400">{{ emptyLabel }}</li>
                    </template>
                </ul>

                <div v-if="footer" class="border-t border-gray-100 px-3 py-1.5 text-[11px] text-gray-400 dark:border-white/10 dark:text-gray-500">
                    {{ footer }}
                </div>
            </div>
        </Popover>
    </div>
</template>
