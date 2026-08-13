<script setup>
defineProps({
    ratio: { type: String, default: '3 / 2' },
});
</script>

<template>
    <div
        class="grid-card-media relative w-full overflow-hidden bg-gray-100 dark:bg-white/5"
        :style="{ aspectRatio: ratio }"
    >
        <slot />
    </div>
</template>
