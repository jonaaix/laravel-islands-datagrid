<script setup>
import { Checkbox } from '@aaix/laravel-islands/vue/helpers';

defineProps({
    checked: { type: Boolean, default: false },
    indeterminate: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    label: { type: String, required: true },
});

const emit = defineEmits(['change']);
</script>

<template>
    <span class="datagrid-selection-box mr-6 flex shrink-0 items-center" @click.stop>
        <Checkbox
            :model-value="checked"
            :indeterminate="indeterminate"
            :disabled="disabled"
            :aria-label="label"
            @update:model-value="emit('change', $event)"
        />
    </span>
</template>
