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
  Palette,
  MoveVertical,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  rows: { type: Number, default: 12 },
})
const emit = defineEmits(['update:modelValue'])

const editor = ref(null)
const fontColor = ref('#111827')
const fontSize = ref('3')

/* ------------------------------------------------------------------ */
/* Selection helpers                                                   */
/* ------------------------------------------------------------------ */

function getSelection() {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  return sel
}

function isListEl(el) {
  return !!el && (el.tagName === 'UL' || el.tagName === 'OL')
}

/** Nearest line element for a node: a list item, or a direct child of the editor. */
function lineForNode(node) {
  const root = editor.value
  if (!root || !node) return null
  let el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node
  while (el && el !== root) {
    if (el.tagName === 'LI') return el
    const parent = el.parentElement
    if (!parent) return null
    if (parent === root) return el
    el = parent
  }
  return null
}

/** Every line of the editor (each list item counts as its own line). */
function allLines() {
  const root = editor.value
  if (!root) return []
  const lines = []
  for (const child of Array.from(root.children)) {
    if (isListEl(child)) {
      for (const li of Array.from(child.children)) {
        if (li.tagName === 'LI') lines.push(li)
      }
    } else {
      lines.push(child)
    }
  }
  return lines
}

/** Wrap loose text in paragraphs so every line is a real block element. */
function normalizeBlocks() {
  const root = editor.value
  if (!root) return
  for (const node of Array.from(root.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') {
      const p = document.createElement('p')
      node.parentNode.insertBefore(p, node)
      p.appendChild(node)
    } else if (node.nodeType === Node.TEXT_NODE) {
      node.remove()
    }
  }
}

/** Lines touched by the current selection. */
function selectedLines() {
  const root = editor.value
  const sel = getSelection()
  if (!root || !sel) return []
  normalizeBlocks()
  const range = sel.getRangeAt(0)
  const lines = allLines()
  if (!lines.length) return []
  const start = lineForNode(range.startContainer)
  const end = lineForNode(range.endContainer)
  const i = lines.indexOf(start)
  const j = lines.indexOf(end)
  if (i !== -1 && j !== -1) return lines.slice(Math.min(i, j), Math.max(i, j) + 1)
  return lines.filter((l) => range.intersectsNode(l))
}

function placeCaret(el, atEnd = false) {
  const sel = getSelection()
  if (!sel || !el) return
  const range = document.createRange()
  range.selectNodeContents(el)
  range.collapse(!atEnd)
  sel.removeAllRanges()
  sel.addRange(range)
  editor.value?.focus()
}

function ensureSelection() {
  if (!editor.value) return
  const sel = getSelection()
  const inside =
    sel &&
    sel.rangeCount &&
    editor.value.contains(sel.rangeCount ? sel.getRangeAt(0).commonAncestorContainer : null)
  if (inside) return
  editor.value.focus()
  const range = document.createRange()
  range.selectNodeContents(editor.value)
  range.collapse(false)
  const s = window.getSelection()
  s?.removeAllRanges()
  s?.addRange(range)
}

/* ------------------------------------------------------------------ */
/* Lists                                                               */
/* ------------------------------------------------------------------ */

/** Move the content of a block into a fresh list item. */
function toListItem(line) {
  const li = document.createElement('li')
  while (line.firstChild) li.appendChild(line.firstChild)
  if (!li.textContent.trim() && !li.querySelector('img, video, iframe')) {
    li.appendChild(document.createElement('br'))
  }
  return li
}

/**
 * Convert the given lines into a list of the given type.
 * Lists that are only partially selected are converted as a whole so the
 * document order is never broken.
 */
function buildList(lines, type) {
  const root = editor.value
  if (!root || !lines.length) return

  // Expand the selection: touching a list converts that whole list.
  const expanded = []
  const seenLists = new Set()
  for (const line of lines) {
    const parent = line.parentElement
    if (isListEl(parent)) {
      if (seenLists.has(parent)) continue
      seenLists.add(parent)
      for (const li of Array.from(parent.children)) {
        if (li.tagName === 'LI') expanded.push(li)
      }
    } else {
      expanded.push(line)
    }
  }
  expanded.sort((a, b) => {
    const pos = a.compareDocumentPosition(b)
    if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1
    if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1
    return 0
  })
  if (!expanded.length) return

  // Group consecutive lines that share the same parent.
  const runs = []
  let current = null
  for (const line of expanded) {
    const parent = line.parentElement
    const key = isListEl(parent) ? parent : null
    if (!current || current.parent !== key) {
      current = { parent: key, items: [] }
      runs.push(current)
    }
    current.items.push(line)
  }

  const created = []
  for (const run of runs) {
    const list = document.createElement(type)
    for (const line of run.items) list.appendChild(toListItem(line))
    const anchor = run.parent ?? run.items[0]
    anchor.parentNode.insertBefore(list, anchor)
    created.push(list)
    if (run.parent) {
      run.parent.remove()
    } else {
      for (const line of run.items) line.remove()
    }
  }

  // Continue on a new line: add an empty item and put the caret in it.
  const lastList = created[created.length - 1]
  const newItem = document.createElement('li')
  newItem.appendChild(document.createElement('br'))
  lastList.appendChild(newItem)
  placeCaret(newItem)
}

/** Turn lists back into normal paragraphs (used to toggle a list off). */
function unwrapLists(lists) {
  const paragraphs = []
  for (const list of lists) {
    const parent = list.parentNode
    if (!parent) continue
    for (const li of Array.from(list.children)) {
      if (li.tagName !== 'LI') continue
      const p = document.createElement('p')
      while (li.firstChild) p.appendChild(li.firstChild)
      if (!p.textContent.trim() && !p.querySelector('img, video, iframe')) {
        p.appendChild(document.createElement('br'))
      }
      parent.insertBefore(p, list)
      paragraphs.push(p)
    }
    list.remove()
  }
  return paragraphs
}

/** Bullet list / numbered list button. */
function toggleList(type) {
  if (!editor.value) return
  ensureSelection()
  const lines = selectedLines()

  if (!lines.length) {
    const list = document.createElement(type)
    const item = document.createElement('li')
    item.appendChild(document.createElement('br'))
    list.appendChild(item)
    editor.value.appendChild(list)
    placeCaret(item)
    sync()
    return
  }

  const tag = type === 'ol' ? 'OL' : 'UL'
  const lists = new Set()
  for (const line of lines) {
    const parent = line.parentElement
    if (isListEl(parent)) lists.add(parent)
  }
  const sameType = lists.size > 0 && lines.every((l) => l.parentElement?.tagName === tag)

  if (sameType) {
    const paragraphs = unwrapLists([...lists])
    const last = paragraphs[paragraphs.length - 1]
    if (last) placeCaret(last, true)
  } else {
    buildList(lines, type)
  }
  sync()
}

/* ------------------------------------------------------------------ */
/* Gap                                                                 */
/* ------------------------------------------------------------------ */

/**
 * Insert a gap (empty spacer). When used inside a list the list is split in
 * two and the numbering of the second half continues where it left off.
 */
function insertGap() {
  if (!editor.value) return
  ensureSelection()
  const lines = selectedLines()
  if (!lines.length) return
  const line = lines[lines.length - 1]

  const gap = document.createElement('p')
  gap.setAttribute('style', 'margin:14px 0;min-height:14px;')
  gap.appendChild(document.createElement('br'))

  const list = line.tagName === 'LI' ? line.parentElement : null

  if (list && isListEl(list)) {
    const items = Array.from(list.children).filter((c) => c.tagName === 'LI')
    const index = items.indexOf(line)
    const following = items.slice(index + 1)
    const parent = list.parentNode

    parent.insertBefore(gap, list.nextSibling)
    if (following.length) {
      const next = document.createElement(list.tagName)
      // Keep the numbering continuous across the gap.
      if (list.tagName === 'OL') next.setAttribute('start', String(index + 2))
      for (const item of following) next.appendChild(item)
      parent.insertBefore(next, gap.nextSibling)
      placeCaret(next.firstElementChild)
    } else {
      placeCaret(gap)
    }
  } else {
    line.parentNode.insertBefore(gap, line.nextSibling)
    placeCaret(gap)
  }
  sync()
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

function exec(cmd, value = null) {
  if (!editor.value) return
  ensureSelection()
  try {
    document.execCommand(cmd, false, value)
  } catch {
    /* Unsupported command in this browser - ignore. */
  }
  sync()
}

function sync() {
  if (editor.value) emit('update:modelValue', editor.value.innerHTML)
}

function onInput() {
  sync()
}

function onPaste() {
  /* Let the browser paste, then normalise the result. */
}

/** Enter inside a list creates the next item, keeping the numbering continuous. */
function onKeydown(e) {
  if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return
  const sel = getSelection()
  if (!sel || !sel.rangeCount) return
  const range = sel.getRangeAt(0)
  const line = lineForNode(range.startContainer)
  if (!line || line.tagName !== 'LI') return

  e.preventDefault()
  const tail = document.createRange()
  tail.setStart(range.startContainer, range.startOffset)
  tail.setEnd(line, line.childNodes.length)
  const fragment = tail.extractContents()

  const next = document.createElement('li')
  next.appendChild(fragment)
  if (!next.textContent.trim() && !next.querySelector('img, video, iframe')) {
    next.appendChild(document.createElement('br'))
  }
  line.after(next)
  if (!line.textContent.trim() && !line.querySelector('img, video, iframe')) {
    line.innerHTML = '<br>'
  }
  placeCaret(next)
  sync()
}

/** Remove empty list items when the editor loses focus. */
function onBlur() {
  const root = editor.value
  if (!root) return
  let changed = false
  for (const li of Array.from(root.querySelectorAll('li'))) {
    if (!li.textContent.trim() && !li.querySelector('img, video, iframe')) {
      li.remove()
      changed = true
    }
  }
  if (changed) sync()
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

      <Button type="button" variant="ghost" size="icon" class="h-8 w-8" title="Bullet list" @mousedown.prevent @click="toggleList('ul')">
        <List class="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" class="h-8 w-8" title="Numbered list" @mousedown.prevent @click="toggleList('ol')">
        <ListOrdered class="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" class="h-8 w-8" title="Indent" @mousedown.prevent @click="exec('indent')">
        <Indent class="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" class="h-8 w-8" title="Outdent" @mousedown.prevent @click="exec('outdent')">
        <Outdent class="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" class="h-8 w-8" title="Gap (space between items)" @mousedown.prevent @click="insertGap">
        <MoveVertical class="h-4 w-4" />
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
      @keydown="onKeydown"
      @blur="onBlur"
    />
  </div>
</template>

<style scoped>
[contenteditable='true']:empty:before {
  content: attr(data-placeholder);
  color: var(--muted-foreground);
  pointer-events: none;
}

[contenteditable='true'] ul,
[contenteditable='true'] ol {
  padding-left: 1.5rem;
}

[contenteditable='true'] li {
  margin: 0.15rem 0;
}
</style>
