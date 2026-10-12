<script setup>
import { computed, ref, watch } from 'vue'
import { Loader2, CircleCheckBig, Target } from 'lucide-vue-next'
import Dialog from '@/components/ui/Dialog.vue'
import DialogFooter from '@/components/ui/DialogFooter.vue'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import Textarea from '@/components/ui/Textarea.vue'

/**
 * Completion flow. Captures the *actual results* and shows the final
 * completion percentage that will be recorded. Comparison against the
 * expected results is rendered side by side.
 */
const props = defineProps({
  open: { type: Boolean, default: false },
  plan: { type: Object, default: null },
  progress: { type: Object, default: null },
  submitting: { type: Boolean, default: false },
})

const emit = defineEmits(['update:open', 'confirm'])

const actualResults = ref('')

watch(
  () => props.open,
  (open) => {
    if (open) actualResults.value = props.plan?.actualResults ?? ''
  },
  { immediate: true },
)

const percent = computed(() => props.progress?.percent ?? 0)

function submit() {
  emit('confirm', { actualResults: actualResults.value.trim() })
}
</script>

<template>
  <Dialog
    :open="props.open"
    title="Complete plan"
    :description="plan ? `Record the outcome of “${plan.title}”.` : ''"
    @update:open="emit('update:open', $event)"
  >
    <div class="space-y-4">
      <div class="grid grid-cols-3 gap-2 text-center">
        <div class="rounded-lg border bg-muted/30 p-2">
          <p class="text-lg font-semibold tabular-nums">{{ progress?.total ?? 0 }}</p>
          <p class="text-xs text-muted-foreground">Tasks</p>
        </div>
        <div class="rounded-lg border bg-muted/30 p-2">
          <p class="text-lg font-semibold tabular-nums text-success">{{ progress?.completed ?? 0 }}</p>
          <p class="text-xs text-muted-foreground">Completed</p>
        </div>
        <div class="rounded-lg border bg-muted/30 p-2">
          <p class="text-lg font-semibold tabular-nums">{{ percent }}%</p>
          <p class="text-xs text-muted-foreground">Final progress</p>
        </div>
      </div>

      <div v-if="plan?.expectedResults" class="rounded-lg border bg-primary/5 p-3">
        <p class="flex items-center gap-1.5 text-xs font-medium text-primary">
          <Target class="h-3.5 w-3.5" />
          Expected results
        </p>
        <p class="mt-1 whitespace-pre-line text-sm text-muted-foreground">{{ plan.expectedResults }}</p>
      </div>

      <div class="space-y-1.5">
        <Label for="plan-actual-results">Actual results</Label>
        <Textarea
          id="plan-actual-results"
          v-model="actualResults"
          :rows="4"
          placeholder="What actually happened? Outcomes, numbers, notes…"
        />
        <p class="text-xs text-muted-foreground">
          The completion date, time and {{ percent }}% final progress will be saved.
        </p>
      </div>
    </div>

    <DialogFooter class="mt-5">
      <Button type="button" variant="outline" :disabled="submitting" @click="emit('update:open', false)">
        Cancel
      </Button>
      <Button type="button" :disabled="submitting" @click="submit">
        <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
        <CircleCheckBig v-else class="h-4 w-4" />
        Mark complete
      </Button>
    </DialogFooter>
  </Dialog>
</template>
