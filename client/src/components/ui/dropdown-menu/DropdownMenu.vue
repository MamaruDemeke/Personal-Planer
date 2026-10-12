<script setup>
import { DropdownMenuRoot } from 'reka-ui'
const props = defineProps({ open: { type: Boolean, default: undefined } })
const emits = defineEmits(['update:open'])
</script>

<template>
  <DropdownMenuRoot :open="open" @update:open="emits('update:open', $event)">
    <slot />
  </DropdownMenuRoot>
</template>
