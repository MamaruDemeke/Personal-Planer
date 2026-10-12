<script setup>
import { AvatarImage } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({
  src: { type: String, default: undefined },
  alt: { type: String, default: '' },
  class: { type: null, default: '' },
})
</script>

<template>
  <AvatarImage :src="src" :alt="alt" :class="cn('aspect-square h-full w-full', props.class)" />
</template>
