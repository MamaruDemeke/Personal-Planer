<script setup>
import { computed, onMounted, ref } from 'vue'
import { Plus, Pencil, Trash2, NotebookPen, Search } from 'lucide-vue-next'

import PageHeader from '@/components/common/PageHeader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ResourceFormDialog from '@/components/forms/ResourceFormDialog.vue'
import ConfirmDeleteDialog from '@/components/common/ConfirmDeleteDialog.vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Select from '@/components/ui/Select.vue'
import { formatRelative } from '@/lib/format'
import { noteSchema } from '@/schemas'
import { useNotesStore } from '@/stores/notes'
import { useCategoriesStore } from '@/stores/categories'
import { useToast } from '@/composables/useToast'

const notesStore = useNotesStore()
const categoriesStore = useCategoriesStore()
const toast = useToast()

const search = ref('')
const categoryFilter = ref('')
const dialogOpen = ref(false)
const editing = ref(null)
const deleteOpen = ref(false)
const deleting = ref(null)
const deleteLoading = ref(false)

onMounted(async () => {
  await Promise.all([notesStore.load(), categoriesStore.load()])
})

const fields = computed(() => [
  { name: 'title', label: 'Title', type: 'text', required: true, span: 2, placeholder: 'Note title' },
  { name: 'content', label: 'Content', type: 'textarea', span: 2, rows: 6, placeholder: 'Write your note...' },
  {
    name: 'categoryId',
    label: 'Category',
    type: 'select',
    options: [
      { label: '— None —', value: '' },
      ...categoriesStore.items.map((c) => ({ label: c.name, value: c.id })),
    ],
  },
  { name: 'tags', label: 'Tags', type: 'tags', placeholder: 'comma, separated' },
])

const categoryById = computed(() => {
  const map = {}
  for (const c of categoriesStore.items) map[c.id] = c
  return map
})

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  return notesStore.items.filter((n) => {
    if (categoryFilter.value && n.categoryId !== categoryFilter.value) return false
    if (term && !`${n.title} ${n.content || ''}`.toLowerCase().includes(term)) return false
    return true
  })
})

function openCreate() {
  editing.value = null
  dialogOpen.value = true
}
function openEdit(note) {
  editing.value = note
  dialogOpen.value = true
}
function askDelete(note) {
  deleting.value = note
  deleteOpen.value = true
}

async function submit(values) {
  try {
    if (editing.value) {
      await notesStore.update(editing.value.id, values)
      toast.success('Note updated')
    } else {
      await notesStore.create(values)
      toast.success('Note created')
    }
  } catch (err) {
    toast.error('Could not save note', err?.message)
    throw err
  }
}

async function confirmDelete() {
  deleteLoading.value = true
  try {
    await notesStore.remove(deleting.value.id)
    toast.success('Note deleted')
    deleteOpen.value = false
  } catch (err) {
    toast.error('Could not delete note', err?.message)
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-4 sm:space-y-6">
    <PageHeader title="Notes" description="Capture ideas, meeting notes and references.">
      <template #actions>
        <Button @click="openCreate">
          <Plus class="h-4 w-4" />
          Add note
        </Button>
      </template>
    </PageHeader>

    <Card>
      <CardContent class="flex flex-col gap-2.5 pt-3.5 sm:flex-row sm:items-center sm:pt-4">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input v-model="search" placeholder="Search notes..." class="pl-9" />
        </div>
        <Select v-model="categoryFilter" class="sm:w-56">
          <option value="">All categories</option>
          <option v-for="c in categoriesStore.items" :key="c.id" :value="c.id">{{ c.name }}</option>
        </Select>
      </CardContent>
    </Card>

    <LoadingState v-if="notesStore.loading && !notesStore.loaded" :rows="3" />

    <EmptyState
      v-else-if="!filtered.length"
      title="No notes found"
      description="Create a note or adjust your search."
    >
      <template #icon><NotebookPen class="h-5 w-5" /></template>
      <template #action>
        <Button @click="openCreate"><Plus class="h-4 w-4" /> Add note</Button>
      </template>
    </EmptyState>

    <div v-else class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      <Card v-for="note in filtered" :key="note.id" class="group flex flex-col">
        <CardHeader class="flex-row items-start justify-between space-y-0">
          <CardTitle class="truncate text-sm sm:text-base">{{ note.title }}</CardTitle>
          <div class="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
            <Button variant="ghost" size="icon" aria-label="Edit note" @click="openEdit(note)">
              <Pencil class="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Delete note" @click="askDelete(note)">
              <Trash2 class="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </CardHeader>
        <CardContent class="flex flex-1 flex-col gap-2">
          <p class="line-clamp-3 flex-1 text-sm text-muted-foreground">{{ note.content }}</p>
          <div class="flex flex-wrap items-center gap-1.5">
            <span
              v-if="categoryById[note.categoryId]"
              class="inline-flex items-center gap-1 text-xs text-muted-foreground"
            >
              <span
                class="h-2 w-2 rounded-full"
                :style="{ backgroundColor: categoryById[note.categoryId].color }"
              />
              {{ categoryById[note.categoryId].name }}
            </span>
            <Badge v-for="tag in note.tags" :key="tag" variant="muted">#{{ tag }}</Badge>
          </div>
          <p class="text-xs text-muted-foreground">Updated {{ formatRelative(note.updatedAt || note.createdAt) }}</p>
        </CardContent>
      </Card>
    </div>

    <ResourceFormDialog
      v-model:open="dialogOpen"
      :title="editing ? 'Edit note' : 'New note'"
      :fields="fields"
      :schema="noteSchema"
      :initial="editing"
      :submit-label="editing ? 'Save changes' : 'Create note'"
      @submit="submit"
    />

    <ConfirmDeleteDialog
      v-model:open="deleteOpen"
      title="Delete note"
      :description="`Delete “${deleting?.title ?? ''}”?`"
      :loading="deleteLoading"
      @confirm="confirmDelete"
    />
  </div>
</template>
