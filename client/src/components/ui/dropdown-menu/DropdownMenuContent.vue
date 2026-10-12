<script setup>
import {
  DropdownMenuContent,
  DropdownMenuPortal,
  useForwardPropsEmits,
} from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: { type: null, default: '' },
  align: { type: String, default: 'end' },
  sideOffset: { type: Number, default: 6 },
})
const emits = defineEmits([
  'closeAutoFocus',
  'escapeKeyDown',
  'pointerDownOutside',
  'interactOutside',
])
const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <DropdownMenuPortal>
    <DropdownMenuContent
      v-bind="forwarded"
      :class="
        cn(
          'z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          props.class,
        )
      "
    >
      <slot />
    </DropdownMenuContent>
  </DropdownMenuPortal>
</template>
