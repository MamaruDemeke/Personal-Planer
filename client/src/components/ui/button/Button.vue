<script setup>
import { computed } from 'vue'
import { Primitive } from 'reka-ui'
import { cn } from '@/lib/utils'
import { buttonVariants } from './index.js'

const props = defineProps({
  variant: { type: String, default: 'default' },
  size: { type: String, default: 'default' },
  as: { type: [String, Object], default: 'button' },
  asChild: { type: Boolean, default: false },
  class: { type: null, default: '' },
})

const delegated = computed(() => {
  const { variant, size, as, asChild, class: _c, ...rest } = props
  return rest
})
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :class="cn(buttonVariants({ variant, size }), props.class)"
    v-bind="delegated"
  >
    <slot />
  </Primitive>
</template>
