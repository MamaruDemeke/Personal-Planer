<script setup>
import { AvatarRoot } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({ class: { type: null, default: '' } })
</script>

<template>
  <AvatarRoot
    :class="cn('relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full', props.class)"
  >
    <slot />
  </AvatarRoot>
</template>
