<script setup>
import { DropdownMenuTrigger } from 'reka-ui'
const props = defineProps({ asChild: { type: Boolean, default: false } })
</script>

<template>
  <DropdownMenuTrigger :as-child="asChild">
    <slot />
  </DropdownMenuTrigger>
</template>
