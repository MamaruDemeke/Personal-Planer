<script setup>
import { ref, watch, onMounted } from 'vue'
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Indent,
  Outdent,
  Type,
  Palette,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  rows: { type: Number, default: 12 },
})
const emit = defineEmits(['update:modelValue'])

const editor = ref(null)
const fontColor = ref('#111827')
const fontSize = ref('3')

function ensureSelection() {
  if (!editor.value) return
  editor.value.focus()
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || !editor.value.contains(sel.anchorNode)) {
    const range = document.createRange()
    range.selectNodeContents(editor.value)
    range.collapse(false)
    sel?.removeAllRanges()
    sel?.addRange(range)
  }
}

function exec(cmd, value = null) {
  if (!editor.value) return
  ensureSelection()
  let ok = false
  try {
    ok = document.execCommand(cmd, false, value)
  } catch {
    ok = false
  }
  if (!ok && (cmd === 'insertUnorderedList' || cmd === 'insertOrderedList')) {
    // Fallback: insert a list manually at the cursor.
    const sel = window.getSelection()
    if (sel && sel.rangeCount) {
      const range = sel.getRangeAt(0)
      const list = document.createElement(cmd === 'insertUnorderedList' ? 'ul' : 'ol')
      const li = document.createElement('li')
      li.innerHTML = '\u200B'
      list.appendChild(li)
      range.deleteContents()
      range.insertNode(list)
      const r = document.createRange()
      r.setStart(li, 0)
      r.collapse(true)
      sel.removeAllRanges()
      sel.addRange(r)
    }
  }
  sync()
}

function sync() {
  if (editor.value) emit('update:modelValue', editor.value.innerHTML)
}

function onInput() {
  sync()
}

function onPaste(e) {
  // Keep pasted content as plain-ish HTML by letting the browser handle it.
  // Nothing special; execCommand handles formatting.
}

watch(
  () => props.modelValue,
  (v) => {
    if (editor.value && editor.value.innerHTML !== (v ?? '')) {
      editor.value.innerHTML = v ?? ''
    }
  },
  { immediate: true },
)

onMounted(() => {
  if (editor.value && props.modelValue) editor.value.innerHTML = props.modelValue
})

const fontSizes = [
  { label: 'Small', value: '2' },
  { label: 'Normal', value: '3' },
  { label: 'Large', value: '4' },
  { label: 'Huge', value: '5' },
]
</script>

<template>
  <div class="rounded-md border bg-background">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-1 border-b bg-muted/40 px-2 py-1.5">
      <Button type="button" variant="ghost" size="icon" class="h-8 w-8" title="Bold" @mousedown.prevent @click="exec('bold')">
        <Bold class="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" class="h-8 w-8" title="Italic" @mousedown.prevent @click="exec('italic')">
        <Italic class="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" class="h-8 w-8" title="Underline" @mousedown.prevent @click="exec('underline')">
        <Underline class="h-4 w-4" />
      </Button>

      <span class="mx-1 h-5 w-px bg-border" />

      <Button type="button" variant="ghost" size="icon" class="h-8 w-8" title="Bullet list" @mousedown.prevent @click="exec('insertUnorderedList')">
        <List class="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" class="h-8 w-8" title="Numbered list" @mousedown.prevent @click="exec('insertOrderedList')">
        <ListOrdered class="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" class="h-8 w-8" title="Indent" @mousedown.prevent @click="exec('indent')">
        <Indent class="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" class="h-8 w-8" title="Outdent" @mousedown.prevent @click="exec('outdent')">
        <Outdent class="h-4 w-4" />
      </Button>

      <span class="mx-1 h-5 w-px bg-border" />

      <select
        v-model="fontSize"
        class="h-8 rounded-md border bg-background px-2 text-xs"
        title="Font size"
        @change="exec('fontSize', fontSize)"
      >
        <option v-for="f in fontSizes" :key="f.value" :value="f.value">{{ f.label }}</option>
      </select>

      <label class="flex h-8 cursor-pointer items-center gap-1 rounded-md border bg-background px-2 text-xs" title="Text color">
        <Palette class="h-3.5 w-3.5" />
        <input type="color" v-model="fontColor" class="h-5 w-5 cursor-pointer border-0 bg-transparent p-0" @change="exec('foreColor', fontColor)" />
      </label>
    </div>

    <!-- Editable area -->
    <div
      ref="editor"
      contenteditable="true"
      class="min-h-[12rem] w-full px-3 py-2 text-sm focus:outline-none"
      :style="{ minHeight: `${rows * 1.5}rem` }"
      :data-placeholder="placeholder"
      @input="onInput"
      @paste="onPaste"
    />
  </div>
</template>

<style scoped>
[contenteditable='true']:empty:before {
  content: attr(data-placeholder);
  color: var(--muted-foreground);
  pointer-events: none;
}
</style>
