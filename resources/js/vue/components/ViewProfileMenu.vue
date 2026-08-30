<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { FieldCaption, IconButton, Popover } from '@aaix/laravel-islands/vue/helpers';
import { useDatagrid } from '../context.js';
import IconStar from '../icons/IconStar.vue';
import IconViews from '../icons/IconViews.vue';

const props = defineProps({
    /** @type {Array<{ref: string, name: string}>} */
    profiles: { type: Array, required: true },
    /** @type {{ref: string, name: string, owned: boolean}|null} */
    active: { type: Object, default: null },
    changed: { type: Boolean, default: false },
    dirty: { type: Boolean, default: false },
    busy: { type: Boolean, default: false },
    labels: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['apply', 'reset', 'save', 'update', 'rename', 'remove', 'copy', 'set-default', 'unset-default']);

const { t } = useDatagrid();

const open = ref(false);
const naming = ref(false);
const draft = ref('');
const triggerEl = ref(null);
const nameInput = ref(null);

const text = computed(() => ({
    menu: props.labels.menu || t('Views'),
    save: props.labels.save || t('Save view'),
    saveAsNew: props.labels.saveAsNew || t('Save as new'),
    update: props.labels.update || t('Save changes'),
    rename: props.labels.rename || t('Rename'),
    remove: props.labels.remove || t('Delete'),
    reset: props.labels.reset || t('Reset view'),
    shared: props.labels.shared || t('Shared with you'),
    yours: props.labels.yours || t('Your views'),
    changed: props.labels.changed || t('unsaved'),
    placeholder: props.labels.placeholder || t('Name this view'),
    empty: props.labels.empty || t('No saved views yet. Apply filters or change the sort order, then save the current view.'),
    setDefault: props.labels.setDefault || t('Set as default'),
    unsetDefault: props.labels.unsetDefault || t('Unset default'),
    defaultTitle: props.labels.defaultTitle || t('Default view'),
}));

const shared = computed(() => Boolean(props.active && props.active.owned === false));

const saveLabel = computed(() => (props.active ? text.value.saveAsNew : text.value.save));

const canSave = computed(() => (props.active ? shared.value || props.changed : props.dirty));

function toggle() {
    open.value = !open.value;
    naming.value = false;
}

function close() {
    open.value = false;
    naming.value = false;
}

function startNaming(seed = '') {
    draft.value = seed;
    naming.value = true;
    nextTick(() => nameInput.value?.focus());
}

const renaming = ref(false);

function confirmName() {
    const name = draft.value.trim();

    if (name === '') {
        return;
    }

    emit(renaming.value ? 'rename' : 'save', name);
    close();
}

function askRename() {
    renaming.value = true;
    startNaming(props.active?.name || '');
}

function askSave() {
    renaming.value = false;
    startNaming('');
}

function pick(profile) {
    emit('apply', profile);
    close();
}

// The panel is not focused when it opens, so Escape has to be caught on the window rather
// than on the panel itself.
function onKeydown(event) {
    if (event.key === 'Escape' && open.value) {
        close();
    }
}

onMounted(() => window.addEventListener('keydown', onKeydown));

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));

const ITEM_CLASS = 'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-700'
    + ' transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5';
</script>

<template>
    <div ref="triggerEl" class="view-profile-menu relative">
        <IconButton
            v-if="!active"
            :label="text.menu"
            size="lg"
            :tone="open ? 'active' : 'quiet'"
            :tooltip="false"
            :aria-expanded="open ? 'true' : 'false'"
            @click="toggle()"
        >
            <IconViews />
        </IconButton>

        <div
            v-else
            class="flex h-9 max-w-[18rem] items-center rounded-full bg-primary-500/10 pl-2.5 pr-1 text-sm font-medium text-primary-700 transition-colors dark:text-primary-300"
        >
            <button
                type="button"
                @click="toggle()"
                :aria-expanded="open ? 'true' : 'false'"
                :aria-label="active.name"
                class="flex h-9 min-w-0 flex-1 items-center gap-1.5 rounded-full pr-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
                <IconViews class="h-4 w-4 shrink-0 opacity-70" />

                <slot name="label" :name="active.name">
                    <span class="min-w-0 truncate">{{ active.name }}</span>
                </slot>

                <span v-if="changed" class="shrink-0 text-[10px] font-medium uppercase tracking-wide opacity-70">{{ text.changed }}</span>
            </button>

            <IconButton
                :label="text.reset"
                size="xs"
                tone="plain"
                :tooltip="false"
                class="hover:bg-primary-500/20"
                @click.stop="emit('reset'); close();"
            >
                <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
            </IconButton>
        </div>

        <!-- The width comes from the longest view name, so the panel is left to shrink to
             its content instead of being given one. -->
        <Popover :anchor="triggerEl" :open="open" :width="null" @close="close()">
            <div class="w-max min-w-[13rem] max-w-[22rem]">
                <template v-if="naming">
                    <div class="p-2">
                        <input
                            ref="nameInput"
                            v-model="draft"
                            type="text"
                            maxlength="60"
                            :placeholder="text.placeholder"
                            @keydown.enter.prevent="confirmName()"
                            @keydown.esc.prevent="close()"
                            class="h-8 w-full rounded-md border border-gray-200 bg-white px-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-white/10 dark:bg-gray-900 dark:text-gray-100"
                        />
                        <button
                            type="button"
                            @click="confirmName()"
                            :disabled="busy || draft.trim() === ''"
                            class="mt-2 flex w-full items-center justify-center rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-500 disabled:opacity-40"
                        >{{ renaming ? text.rename : saveLabel }}</button>
                    </div>
                </template>

                <template v-else>
                    <div
                        v-if="!profiles.length && !shared && !canSave && !(active && !shared)"
                        class="px-3 py-3 text-xs leading-relaxed text-gray-500 dark:text-gray-400"
                    >{{ text.empty }}</div>

                    <ul v-if="profiles.length || shared" class="max-h-[50vh] overflow-y-auto py-1">
                        <li v-if="profiles.length" class="px-3 pb-1 pt-1.5"><FieldCaption>{{ text.yours }}</FieldCaption></li>

                        <li v-for="profile in profiles" :key="profile.ref">
                            <button type="button" @click="pick(profile)" :class="ITEM_CLASS">
                                <span class="h-1.5 w-1.5 shrink-0 rounded-full" :class="active?.ref === profile.ref ? 'bg-primary-600 dark:bg-primary-400' : 'bg-transparent'"></span>
                                <span class="min-w-0 flex-1 truncate">{{ profile.name }}</span>
                                <IconStar
                                    v-if="profile.is_default"
                                    :aria-label="text.defaultTitle"
                                    class="h-3.5 w-3.5 shrink-0 text-amber-400"
                                />
                            </button>
                        </li>

                        <li v-if="shared" class="px-3 pb-1 pt-2"><FieldCaption>{{ text.shared }}</FieldCaption></li>

                        <li v-if="shared">
                            <div :class="ITEM_CLASS">
                                <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-600 dark:bg-primary-400"></span>
                                <span class="min-w-0 flex-1 truncate">{{ active.name }}</span>
                            </div>
                        </li>
                    </ul>

                    <div v-if="canSave || (active && !shared)" class="border-t border-gray-100 p-1 dark:border-white/10">
                        <button
                            v-if="changed && active && !shared"
                            type="button"
                            @click="emit('update'); close();"
                            :class="ITEM_CLASS"
                        >{{ text.update }}</button>

                        <button v-if="canSave" type="button" @click="askSave()" :class="ITEM_CLASS">{{ saveLabel }}</button>

                        <template v-if="active && !shared">
                            <button
                                type="button"
                                @click="emit(active.is_default ? 'unset-default' : 'set-default'); close();"
                                :class="ITEM_CLASS"
                            >{{ active.is_default ? text.unsetDefault : text.setDefault }}</button>
                            <button type="button" @click="askRename()" :class="ITEM_CLASS">{{ text.rename }}</button>
                            <button
                                type="button"
                                @click="emit('remove'); close();"
                                class="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                            >{{ text.remove }}</button>
                        </template>
                    </div>

                </template>
            </div>
        </Popover>
    </div>
</template>
