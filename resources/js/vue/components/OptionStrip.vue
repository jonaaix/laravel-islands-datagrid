<script setup>
import { computed } from 'vue';

const props = defineProps({
    /** `{ value, label, hint?, count? }` — the application owns every word of it. */
    options: { type: Array, default: () => [] },
    /** One value when picking one of them, an array of values when each is its own switch. */
    modelValue: { type: [String, Number, Boolean, Object, Array], default: null },
    multiple: { type: Boolean, default: false },
    /** Picking the one already taken lets go of it again. Ignored while `multiple`. */
    clearable: { type: Boolean, default: false },
    /**
     * `pills` gives every option its own outline — a row of switches beside other controls.
     * `segmented` puts them in one frame, which reads as one question with n answers.
     */
    variant: { type: String, default: 'pills' },
    /** A dot marks what is taken. Off where the tint alone is enough. */
    marker: { type: Boolean, default: true },
    disabled: { type: Boolean, default: false },
    ariaLabel: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue']);

const taken = computed(() => (props.multiple ? [...(props.modelValue ?? [])] : []));

function isTaken(value) {
    return props.multiple
        ? taken.value.some((entry) => entry === value)
        : props.modelValue === value;
}

function pick(value) {
    if (props.disabled) {
        return;
    }

    if (props.multiple) {
        const next = isTaken(value) ? taken.value.filter((entry) => entry !== value) : [...taken.value, value];

        emit('update:modelValue', next);

        return;
    }

    emit('update:modelValue', props.clearable && isTaken(value) ? null : value);
}

const FRAME = {
    pills: 'inline-flex items-center gap-2',
    segmented: 'inline-flex h-7 items-center gap-0.5 rounded-full p-0.5 ring-1 ring-inset ring-gray-200 dark:ring-white/10',
};

const OPTION = {
    pills: {
        base: 'inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium ring-1 ring-inset transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        on: 'bg-primary-500/10 text-primary-700 ring-primary-500/25 hover:bg-primary-500/15 dark:text-primary-300',
        off: 'bg-transparent text-gray-500 ring-gray-200 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:ring-white/10 dark:hover:bg-white/5 dark:hover:text-gray-200',
    },
    segmented: {
        base: 'inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        on: 'bg-primary-500/10 text-primary-700 dark:text-primary-300',
        off: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
    },
};

const skin = computed(() => OPTION[props.variant] ?? OPTION.pills);
const frame = computed(() => FRAME[props.variant] ?? FRAME.pills);
</script>

<template>
    <div class="option-strip" :class="frame" :role="multiple ? 'group' : 'radiogroup'" :aria-label="ariaLabel || undefined">
        <button
            v-for="option in options"
            :key="String(option.value)"
            type="button"
            :disabled="disabled"
            :aria-pressed="multiple ? (isTaken(option.value) ? 'true' : 'false') : undefined"
            :aria-checked="multiple ? undefined : (isTaken(option.value) ? 'true' : 'false')"
            :role="multiple ? undefined : 'radio'"
            :title="undefined"
            :class="[skin.base, isTaken(option.value) ? skin.on : skin.off, disabled ? 'cursor-not-allowed opacity-50' : '']"
            @click="pick(option.value)"
        >
            <span
                v-if="marker && variant === 'pills' && isTaken(option.value)"
                class="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-600 dark:bg-primary-400"
            ></span>
            {{ option.label }}
            <span v-if="option.count !== undefined" class="tabular-nums opacity-70">{{ option.count }}</span>
        </button>
    </div>
</template>
