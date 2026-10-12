<script setup>
import { computed, onMounted, ref } from 'vue'
import { Plus, Pencil, Trash2, Tags } from 'lucide-vue-next'

import PageHeader from '@/components/common/PageHeader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ResourceFormDialog from '@/components/forms/ResourceFormDialog.vue'
import ConfirmDeleteDialog from '@/components/common/ConfirmDeleteDialog.vue'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { categorySchema } from '@/schemas'
import { useCategoriesStore } from '@/stores/categories'
import { useTasksStore } from '@/stores/tasks'
import { useToast } from '@/composables/useToast'

const categoriesStore = useCategoriesStore()
const tasksStore = useTasksStore()
const toast = useToast()

const dialogOpen = ref(false)
const editing = ref(null)
const deleteOpen = ref(false)
const deleting = ref(null)
const deleteLoading = ref(false)

onMounted(async () => {
  await Promise.all([categoriesStore.load(), tasksStore.load()])
})

const fields = [
  { name: 'name', label: 'Name', type: 'text', required: true, span: 2, placeholder: 'e.g. Work' },
  { name: 'color', label: 'Color', type: 'color', default: '#0d9488' },
  { name: 'description', label: 'Description', type: 'textarea', span: 2, rows: 2, placeholder: 'Optional' },
]

const taskCountByCategory = computed(() => {
  const counts = {}
  for (const t of tasksStore.items) {
    if (t.categoryId) counts[t.categoryId] = (counts[t.categoryId] || 0) + 1
  }
  return counts
})

function openCreate() {
  editing.value = null
  dialogOpen.value = true
}
function openEdit(category) {
  editing.value = category
  dialogOpen.value = true
}
function askDelete(category) {
  deleting.value = category
  deleteOpen.value = true
}

async function submit(values) {
  try {
    if (editing.value) {
      await categoriesStore.update(editing.value.id, values)
      toast.success('Category updated')
    } else {
      await categoriesStore.create(values)
      toast.success('Category created')
    }
  } catch (err) {
    toast.error('Could not save category', err?.message)
    throw err
  }
}

async function confirmDelete() {
  deleteLoading.value = true
  try {
    await categoriesStore.remove(deleting.value.id)
    toast.success('Category deleted')
    deleteOpen.value = false
  } catch (err) {
    toast.error('Could not delete category', err?.message)
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Categories" description="Group your tasks, notes and events by color.">
      <template #actions>
        <Button @click="openCreate">
          <Plus class="h-4 w-4" />
          Add category
        </Button>
      </template>
    </PageHeader>

    <LoadingState v-if="categoriesStore.loading && !categoriesStore.loaded" :rows="3" />

    <EmptyState
      v-else-if="!categoriesStore.items.length"
      title="No categories yet"
      description="Create a category to color-code your work."
    >
      <template #icon><Tags class="h-5 w-5" /></template>
      <template #action>
        <Button @click="openCreate"><Plus class="h-4 w-4" /> Add category</Button>
      </template>
    </EmptyState>

    <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Card v-for="category in categoriesStore.items" :key="category.id" class="group">
        <CardContent class="flex items-start gap-3 pt-6">
          <span
            class="mt-0.5 h-8 w-8 shrink-0 rounded-lg"
            :style="{ backgroundColor: category.color }"
          />
          <div class="min-w-0 flex-1">
            <p class="truncate font-medium">{{ category.name }}</p>
            <p class="text-xs text-muted-foreground">
              {{ taskCountByCategory[category.id] || 0 }} task(s)
            </p>
            <p v-if="category.description" class="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {{ category.description }}
            </p>
          </div>
          <div class="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
            <Button variant="ghost" size="icon" aria-label="Edit category" @click="openEdit(category)">
              <Pencil class="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Delete category" @click="askDelete(category)">
              <Trash2 class="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <ResourceFormDialog
      v-model:open="dialogOpen"
      :title="editing ? 'Edit category' : 'New category'"
      :fields="fields"
      :schema="categorySchema"
      :initial="editing"
      :submit-label="editing ? 'Save changes' : 'Create category'"
      @submit="submit"
    />

    <ConfirmDeleteDialog
      v-model:open="deleteOpen"
      title="Delete category"
      :description="`Delete “${deleting?.name ?? ''}”?`"
      :loading="deleteLoading"
      @confirm="confirmDelete"
    />
  </div>
</template>
