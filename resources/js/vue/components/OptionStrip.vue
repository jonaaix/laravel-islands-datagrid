<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Tooltip } from '@aaix/laravel-islands/vue/helpers';

const props = defineProps({
    /** `{ value, label, hint?, count?, icon?, hideLabel? }` — the application owns every word of it. */
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
    segmented: 'inline-flex h-8 items-center gap-0.5 rounded-full p-0.5 ring-1 ring-inset ring-gray-200 dark:ring-white/10',
};

const OPTION = {
    pills: {
        base: 'inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium ring-1 ring-inset transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        on: 'bg-primary-500/10 text-primary-700 ring-primary-500/25 hover:bg-primary-500/15 dark:text-primary-300',
        off: 'bg-transparent text-gray-500 ring-gray-200 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:ring-white/10 dark:hover:bg-white/5 dark:hover:text-gray-200',
    },
    segmented: {
        base: 'relative z-10 inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        on: 'text-gray-900 dark:text-white',
        off: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
        surface: 'bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-white/10',
    },
};

const skin = computed(() => OPTION[props.variant] ?? OPTION.pills);
const frame = computed(() => FRAME[props.variant] ?? FRAME.pills);

/*
 * One frame, one answer: rather than lighting up a different segment, the surface travels to it.
 * The movement is what says the two belong to the same question — a surface that blinks from
 * here to there reads as two separate things.
 *
 * Only where a single answer is picked; with several switches on at once there is nothing for one
 * surface to point at, so those keep their own.
 */
const slides = computed(() => props.variant === 'segmented' && !props.multiple);

const stripEl = ref(null);
const surface = ref({ x: 0, width: 0, shown: false, still: true });

let watcher = null;

function measure() {
    const strip = stripEl.value;

    if (!slides.value || strip === null) {
        return;
    }

    const index = props.options.findIndex((option) => isTaken(option.value));
    const button = index < 0 ? null : strip.querySelectorAll('button')[index];

    if (!button || button.offsetWidth === 0) {
        surface.value = { ...surface.value, shown: false, still: true };

        return;
    }

    // The first placement must not travel in from the left edge.
    const still = !surface.value.shown;

    surface.value = { x: button.offsetLeft, width: button.offsetWidth, shown: true, still };

    if (still) {
        requestAnimationFrame(() => { surface.value = { ...surface.value, still: false }; });
    }
}

function remeasure() {
    nextTick(measure);
}

onMounted(() => {
    remeasure();

    if (window.ResizeObserver && stripEl.value) {
        watcher = new ResizeObserver(remeasure);
        watcher.observe(stripEl.value);
    }
});

onBeforeUnmount(() => watcher?.disconnect());

watch(() => [props.modelValue, props.options, props.variant], remeasure, { deep: true });
</script>

<template>
    <div
        ref="stripEl"
        class="option-strip"
        :class="[frame, slides ? 'relative' : '']"
        :role="multiple ? 'group' : 'radiogroup'"
        :aria-label="ariaLabel || undefined"
    >
        <span
            v-if="slides && surface.shown"
            aria-hidden="true"
            class="absolute inset-y-0.5 rounded-full motion-reduce:transition-none"
            :class="[skin.surface, surface.still ? '' : 'transition-[transform,width] duration-200 ease-out']"
            :style="{ transform: `translateX(${surface.x}px)`, width: `${surface.width}px`, left: 0 }"
        ></span>

        <template v-for="option in options" :key="String(option.value)">
            <Tooltip v-if="option.hideLabel" :text="option.label">
                <button
                    type="button"
                    :disabled="disabled"
                    :aria-pressed="multiple ? (isTaken(option.value) ? 'true' : 'false') : undefined"
                    :aria-checked="multiple ? undefined : (isTaken(option.value) ? 'true' : 'false')"
                    :aria-label="option.label"
                    :role="multiple ? undefined : 'radio'"
                    :class="[skin.base, isTaken(option.value) ? skin.on : skin.off, !slides && isTaken(option.value) ? skin.surface ?? '' : '', disabled ? 'cursor-not-allowed opacity-50' : '', option.icon ? 'px-2' : '']"
                    @click="pick(option.value)"
                >
                    <component :is="option.icon" v-if="option.icon" class="h-4 w-4 shrink-0" />
                    <span v-else class="sr-only">{{ option.label }}</span>
                </button>
            </Tooltip>

            <button
                v-else
                type="button"
                :disabled="disabled"
                :aria-pressed="multiple ? (isTaken(option.value) ? 'true' : 'false') : undefined"
                :aria-checked="multiple ? undefined : (isTaken(option.value) ? 'true' : 'false')"
                :role="multiple ? undefined : 'radio'"
                :class="[skin.base, isTaken(option.value) ? skin.on : skin.off, !slides && isTaken(option.value) ? skin.surface ?? '' : '', disabled ? 'cursor-not-allowed opacity-50' : '']"
                @click="pick(option.value)"
            >
                <span
                    v-if="marker && variant === 'pills' && isTaken(option.value)"
                    class="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-600 dark:bg-primary-400"
                ></span>
                <component :is="option.icon" v-if="option.icon" class="h-4 w-4 shrink-0" />
                {{ option.label }}
                <span v-if="option.count !== undefined" class="tabular-nums opacity-70">{{ option.count }}</span>
            </button>
        </template>
    </div>
</template>
