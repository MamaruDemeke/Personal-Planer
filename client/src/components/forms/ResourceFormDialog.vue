<script setup>
import { computed, reactive, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-vue-next'

import { cn } from '@/lib/utils'
import { COLOR_SWATCHES } from '@/lib/constants'
import Dialog from '@/components/ui/Dialog.vue'
import DialogFooter from '@/components/ui/DialogFooter.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Select from '@/components/ui/Select.vue'
import Textarea from '@/components/ui/Textarea.vue'

/**
 * Config-driven create/edit dialog.
 *
 * @prop fields  [{ name, label, type, placeholder, options, required, span, help, default }]
 * @prop schema  zod schema (camelCase) used for validation
 * @prop initial record to edit (camelCase) or null to create
 * @prop onSubmit async (values) => void — throw to keep the dialog open
 */
const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  fields: { type: Array, required: true },
  schema: { type: Object, required: true },
  initial: { type: Object, default: null },
  submitLabel: { type: String, default: 'Save' },
  onSubmit: { type: Function, default: null },
})

const emit = defineEmits(['update:open'])

const { handleSubmit, errors, defineField, resetForm, isSubmitting } = useForm({
  validationSchema: toTypedSchema(props.schema),
})

const models = reactive({})
const metas = {}
for (const field of props.fields) {
  const [model, attrs] = defineField(field.name)
  models[field.name] = model
  metas[field.name] = attrs
}

function toInput(value, type) {
  if (value === null || value === undefined || value === '') return ''
  if (type === 'date') return format(new Date(value), 'yyyy-MM-dd')
  if (type === 'datetime') return format(new Date(value), "yyyy-MM-dd'T'HH:mm")
  return value
}

function buildInitial() {
  const values = {}
  for (const field of props.fields) {
    const raw = props.initial?.[field.name]
    if (raw !== undefined && raw !== null && raw !== '') {
      if (field.type === 'tags') values[field.name] = Array.isArray(raw) ? raw.join(', ') : raw
      else values[field.name] = toInput(raw, field.type)
    } else if (field.type === 'tags') {
      values[field.name] = ''
    } else {
      values[field.name] = field.default ?? (field.type === 'checkbox' ? false : '')
    }
  }
  return values
}

function fromInput(value, type) {
  if (value === '' || value === null || value === undefined) return null
  if (type === 'date') return new Date(`${value}T12:00:00`).toISOString()
  if (type === 'datetime') return new Date(value).toISOString()
  return value
}

function normalize(values) {
  const out = { ...values }
  for (const field of props.fields) {
    if (field.type === 'date' || field.type === 'datetime') {
      out[field.name] = fromInput(out[field.name], field.type)
    } else if (field.type === 'tags') {
      out[field.name] = String(out[field.name] ?? '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    } else if (field.type === 'select' && out[field.name] === '') {
      out[field.name] = null
    }
  }
  return out
}

watch(
  () => props.open,
  (open) => {
    if (open) resetForm({ values: buildInitial() })
  },
  { immediate: true },
)

const onSubmit = handleSubmit(async (values) => {
  try {
    await props.onSubmit?.(normalize(values))
    emit('update:open', false)
  } catch {
    /* Parent surfaces the error via toast; keep the dialog open. */
  }
})

const dialogTitle = computed(() => props.title)
</script>

<template>
  <Dialog
    :open="props.open"
    :title="dialogTitle"
    :description="props.description"
    @update:open="emit('update:open', $event)"
  >
    <form class="space-y-4" novalidate @submit="onSubmit">
      <div class="grid gap-4 sm:grid-cols-2">
        <div
          v-for="field in props.fields"
          :key="field.name"
          :class="field.span === 2 ? 'sm:col-span-2' : ''"
        >
          <div v-if="field.type === 'checkbox'" class="flex items-center gap-2 pt-1">
            <input
              :id="`field-${field.name}`"
              v-model="models[field.name]"
              v-bind="metas[field.name]"
              type="checkbox"
              class="h-4 w-4 rounded border-input text-primary focus:ring-ring"
            />
            <Label :for="`field-${field.name}`">{{ field.label }}</Label>
          </div>

          <template v-else>
            <Label :for="`field-${field.name}`" class="mb-1.5 block">
              {{ field.label }}
              <span v-if="field.required" class="text-destructive">*</span>
            </Label>

            <Textarea
              v-if="field.type === 'textarea'"
              :id="`field-${field.name}`"
              v-model="models[field.name]"
              v-bind="metas[field.name]"
              :placeholder="field.placeholder"
              :rows="field.rows || 3"
            />

            <Select
              v-else-if="field.type === 'select'"
              :id="`field-${field.name}`"
              v-model="models[field.name]"
              v-bind="metas[field.name]"
            >
              <option v-if="!field.required" value="">— None —</option>
              <option v-for="opt in field.options" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </Select>

            <div v-else-if="field.type === 'color'" class="flex items-center gap-2">
              <input
                :id="`field-${field.name}`"
                v-model="models[field.name]"
                v-bind="metas[field.name]"
                type="color"
                class="h-9 w-12 cursor-pointer rounded-md border border-input bg-transparent p-1"
              />
              <Input v-model="models[field.name]" v-bind="metas[field.name]" class="font-mono" />
              <div class="flex gap-1">
                <button
                  v-for="swatch in COLOR_SWATCHES"
                  :key="swatch"
                  type="button"
                  class="h-6 w-6 rounded-full border border-border"
                  :style="{ backgroundColor: swatch }"
                  :aria-label="`Use ${swatch}`"
                  @click="models[field.name] = swatch"
                />
              </div>
            </div>

            <Input
              v-else
              :id="`field-${field.name}`"
              v-model="models[field.name]"
              v-bind="metas[field.name]"
              :type="
                field.type === 'datetime'
                  ? 'datetime-local'
                  : field.type === 'number'
                    ? 'number'
                    : field.type || 'text'
              "
              :placeholder="field.placeholder"
              :min="field.min"
              :max="field.max"
              :step="field.step"
            />
          </template>

          <p v-if="field.help && !errors[field.name]" class="mt-1 text-xs text-muted-foreground">
            {{ field.help }}
          </p>
          <p v-if="errors[field.name]" class="mt-1 text-xs text-destructive">
            {{ errors[field.name] }}
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" :disabled="isSubmitting" @click="emit('update:open', false)">
          Cancel
        </Button>
        <Button type="submit" :disabled="isSubmitting">
          <Loader2 v-if="isSubmitting" class="h-4 w-4 animate-spin" />
          {{ props.submitLabel }}
        </Button>
      </DialogFooter>
    </form>
  </Dialog>
</template>
