<script setup>
defineProps({
    href: { type: String, default: '' },
    active: { type: Boolean, default: false },
    interactive: { type: Boolean, default: true },
});
</script>

<template>
    <component
        :is="href ? 'a' : 'div'"
        :href="href || undefined"
        class="grid-card group flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-gray-200 transition-all dark:bg-gray-900 dark:ring-white/10"
        :class="[
            interactive ? 'hover:ring-gray-300 dark:hover:ring-white/20' : '',
            active ? 'ring-primary-500/40 dark:ring-primary-400/40 ring-2' : '',
        ]"
    >
        <slot name="media" />

        <div v-if="$slots.header" class="px-4 pt-3">
            <slot name="header" />
        </div>

        <div v-if="$slots.default" class="min-w-0 flex-1 px-4 py-3">
            <slot />
        </div>

        <div
            v-if="$slots.footer"
            class="mt-auto border-t border-gray-100 px-4 py-2.5 dark:border-white/10"
        >
            <slot name="footer" />
        </div>
    </component>
</template>
