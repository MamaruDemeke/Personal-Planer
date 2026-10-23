<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { BookOpen, Plus, Save, Trash2, Search } from 'lucide-vue-next'

import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Textarea from '@/components/ui/Textarea.vue'
import RichTextEditor from '@/components/common/RichTextEditor.vue'
import { Label } from '@/components/ui/label'
import { useNotesStore } from '@/stores/notes'
import { useToast } from '@/composables/useToast'
import { useAccessGate } from '@/composables/useAccessGate'
import { useI18n } from '@/lib/i18n'
import { formatDate, formatRelative } from '@/lib/format'

const notes = useNotesStore()

function stripTags(html) {
  if (!html) return ''
  return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}
const toast = useToast()
const { ensureWrite } = useAccessGate()
const { t } = useI18n()

const search = ref('')
const selectedId = ref(null)
const draft = ref({ title: '', content: '' })
const saving = ref(false)
const creating = ref(false)

onMounted(async () => {
  await notes.load({}, { force: true }).catch(() => {})
  if (notes.items.length) select(notes.items[0])
})

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return notes.items
  return notes.items.filter(
    (n) =>
      String(n.title ?? '').toLowerCase().includes(term) ||
      String(n.content ?? '').toLowerCase().includes(term),
  )
})

function select(note) {
  selectedId.value = note.id
  draft.value = { title: note.title ?? '', content: note.content ?? '' }
}

function newNote() {
  if (!ensureWrite()) return
  selectedId.value = null
  draft.value = { title: '', content: '' }
  creating.value = true
}

async function save() {
  if (!ensureWrite()) return
  if (!draft.value.title.trim() && !draft.value.content.trim()) {
    toast.error('Empty note', 'Write something first.')
    return
  }
  saving.value = true
  try {
    const payload = {
      title: draft.value.title.trim() || 'Untitled',
      content: draft.value.content,
    }
    if (selectedId.value) {
      const row = await notes.update(selectedId.value, payload)
      select(row)
      toast.success('Note saved')
    } else {
      const row = await notes.create(payload)
      select(row)
      creating.value = false
      toast.success('Note created')
    }
  } catch (err) {
    toast.error('Could not save note', err?.message)
  } finally {
    saving.value = false
  }
}

async function remove() {
  if (!ensureWrite()) return
  if (!selectedId.value) return
  try {
    await notes.remove(selectedId.value)
    selectedId.value = null
    draft.value = { title: '', content: '' }
    if (notes.items.length) select(notes.items[0])
    toast.success('Note deleted')
  } catch (err) {
    toast.error('Could not delete note', err?.message)
  }
}
</script>

<template>
  <div class="space-y-2 sm:space-y-3">
    <PageHeader :title="t('page.diary.title')" :description="t('page.diary.desc')">
      <template #actions>
          <Button @click="newNote">
            <Plus class="h-4 w-4" /> {{ t('diary.newNote') }}
          </Button>
      </template>
    </PageHeader>

    <LoadingState v-if="notes.loading && !notes.loaded" :rows="3" />

    <div v-else class="grid gap-4 lg:grid-cols-3">
      <!-- List -->
      <Card class="group card-hover lg:col-span-1" accent="#ec4899">
        <CardContent class="space-y-3 pt-4">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input v-model="search" :placeholder="t('diary.searchNotes')" class="pl-9" />
          </div>

          <EmptyState
            v-if="!filtered.length"
            :title="t('diary.noNotes')"
            :description="t('diary.createFirst')"
            class="py-6"
          >
            <template #icon><BookOpen class="h-5 w-5" /></template>
            <template #action>
              <Button size="sm" @click="newNote">
                <Plus class="h-4 w-4" /> {{ t('diary.newNote') }}
              </Button>
            </template>
          </EmptyState>

          <ul v-else class="divide-y">
            <li v-for="note in filtered" :key="note.id">
              <button
                type="button"
                class="flex w-full items-center justify-between gap-2 py-2.5 text-left transition-colors hover:text-primary"
                :class="selectedId === note.id && 'text-primary'"
                @click="select(note)"
              >
                <span class="truncate text-sm font-medium">{{ note.title || t('diary.untitled') }}</span>
                <span class="shrink-0 text-[11px] text-muted-foreground">{{ formatDate(note.createdAt) }}</span>
              </button>
            </li>
          </ul>
        </CardContent>
      </Card>

      <!-- Editor -->
      <Card class="group card-hover lg:col-span-2" accent="#8b5cf6">
        <CardContent class="space-y-4 pt-4">
          <div class="space-y-1.5">
            <Label for="note-title">{{ t('diary.title') }}</Label>
            <Input id="note-title" v-model="draft.title" :placeholder="t('diary.noteTitle')" />
          </div>
          <div class="space-y-1.5">
            <Label for="note-content">{{ t('diary.content') }}</Label>
            <RichTextEditor v-model="draft.content" :placeholder="t('diary.writeHere')" :rows="16" />
          </div>
          <div class="flex items-center gap-2">
            <Button :disabled="saving" @click="save">
              <Save class="h-4 w-4" /> {{ saving ? t('common.saving') : t('common.save') }}
            </Button>
            <Button v-if="selectedId" variant="outline" class="text-destructive" @click="remove">
              <Trash2 class="h-4 w-4" /> {{ t('common.delete') }}
            </Button>
            <span v-if="selectedId" class="ml-auto text-xs text-muted-foreground">
              {{ t('diary.created') }} {{ formatDate(notes.items.find((n) => n.id === selectedId)?.createdAt) }} · {{ t('diary.updated') }} {{ formatRelative(notes.items.find((n) => n.id === selectedId)?.updatedAt) }}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
