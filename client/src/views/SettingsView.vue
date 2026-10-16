<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Bell,
  BellOff,
  Loader2,
  LogOut,
  Moon,
  Plus,
  Save,
  Sun,
  Pencil,
  Trash2,
} from 'lucide-vue-next'

import PageHeader from '@/components/common/PageHeader.vue'
import ResourceFormDialog from '@/components/forms/ResourceFormDialog.vue'
import ConfirmDeleteDialog from '@/components/common/ConfirmDeleteDialog.vue'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { categorySchema } from '@/schemas'
import { useAuthStore } from '@/stores/auth'
import { useCategoriesStore } from '@/stores/categories'
import { useTheme } from '@/composables/useTheme'
import { useReminders } from '@/composables/useReminders'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const auth = useAuthStore()
const categories = useCategoriesStore()
const reminders = useReminders()
const toast = useToast()
const { isDark, toggleTheme } = useTheme()

const profile = reactive({
  fullName: auth.profile?.full_name ?? auth.user?.user_metadata?.full_name ?? '',
  timezone: auth.profile?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
})
const savingProfile = ref(false)

const categoryFields = [
  { name: 'name', label: 'Name', type: 'text', required: true, span: 2, placeholder: 'e.g. Site work' },
  { name: 'color', label: 'Color', type: 'color', span: 2 },
]
const dialogOpen = ref(false)
const editing = ref(null)
const deleteOpen = ref(false)
const deleting = ref(null)
const deleteLoading = ref(false)

onMounted(() => categories.load().catch(() => {}))

const notificationsOn = computed(() => reminders.enabled)

async function saveProfile() {
  savingProfile.value = true
  try {
    await auth.updateProfile({ full_name: profile.fullName.trim(), timezone: profile.timezone.trim() })
    toast.success('Profile saved')
  } catch (err) {
    toast.error('Could not save profile', err?.message)
  } finally {
    savingProfile.value = false
  }
}

async function enableNotifications() {
  const result = await reminders.requestPermission()
  if (result === 'granted') toast.success('Notifications enabled')
  else if (result === 'denied') toast.error('Notifications blocked', 'Allow them in your browser settings.')
}

function openCreateCategory() {
  editing.value = null
  dialogOpen.value = true
}
function openEditCategory(category) {
  editing.value = category
  dialogOpen.value = true
}
function askDeleteCategory(category) {
  deleting.value = category
  deleteOpen.value = true
}

async function submitCategory(values) {
  try {
    if (editing.value) {
      await categories.update(editing.value.id, values)
      toast.success('Category updated')
    } else {
      await categories.create(values)
      toast.success('Category created')
    }
  } catch (err) {
    toast.error('Could not save category', err?.message)
    throw err
  }
}

async function confirmDeleteCategory() {
  deleteLoading.value = true
  try {
    await categories.remove(deleting.value.id)
    toast.success('Category deleted')
    deleteOpen.value = false
  } catch (err) {
    toast.error('Could not delete category', err?.message)
  } finally {
    deleteLoading.value = false
  }
}

async function signOut() {
  await auth.signOut()
  if (auth.isConfigured) router.replace({ name: 'login' })
}
</script>

<template>
  <div class="space-y-4 sm:space-y-6">
    <PageHeader title="Settings" description="Manage your profile, categories and preferences." />

    <!-- Profile -->
    <Card>
      <CardHeader>
        <CardTitle class="text-base">Profile</CardTitle>
        <CardDescription>Your name and timezone.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4 pt-0">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-1.5">
            <Label for="profile-name">Full name</Label>
            <Input id="profile-name" v-model="profile.fullName" placeholder="Your name" />
          </div>
          <div class="space-y-1.5">
            <Label for="profile-tz">Timezone</Label>
            <Input id="profile-tz" v-model="profile.timezone" placeholder="e.g. Africa/Addis_Ababa" />
          </div>
        </div>
        <Button :disabled="savingProfile" @click="saveProfile">
          <Loader2 v-if="savingProfile" class="h-4 w-4 animate-spin" />
          <Save v-else class="h-4 w-4" />
          Save profile
        </Button>
      </CardContent>
    </Card>

    <!-- Appearance -->
    <Card>
      <CardHeader>
        <CardTitle class="text-base">Appearance</CardTitle>
        <CardDescription>Switch between light and dark themes.</CardDescription>
      </CardHeader>
      <CardContent class="pt-0">
        <Button variant="outline" @click="toggleTheme()">
          <Sun v-if="isDark" class="h-4 w-4" />
          <Moon v-else class="h-4 w-4" />
          {{ isDark ? 'Switch to light' : 'Switch to dark' }}
        </Button>
      </CardContent>
    </Card>

    <!-- Notifications -->
    <Card>
      <CardHeader>
        <CardTitle class="text-base">Reminders &amp; notifications</CardTitle>
        <CardDescription>Get alerted about due and overdue tasks.</CardDescription>
      </CardHeader>
      <CardContent class="flex flex-wrap items-center gap-3 pt-0">
        <span
          class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
          :class="notificationsOn ? 'border-success/40 text-success' : 'text-muted-foreground'"
        >
          <Bell v-if="notificationsOn" class="h-4 w-4" />
          <BellOff v-else class="h-4 w-4" />
          {{ notificationsOn ? 'Browser notifications on' : 'Browser notifications off' }}
        </span>
        <Button v-if="reminders.supported && !notificationsOn" variant="outline" @click="enableNotifications">
          Enable notifications
        </Button>
        <span v-if="!reminders.supported" class="text-sm text-muted-foreground">
          This browser does not support notifications.
        </span>
      </CardContent>
    </Card>

    <!-- Categories -->
    <Card>
      <CardHeader class="flex-row items-center justify-between space-y-0">
        <div class="space-y-1">
          <CardTitle class="text-base">Categories</CardTitle>
          <CardDescription>Group tasks by type of work.</CardDescription>
        </div>
        <Button variant="outline" size="sm" @click="openCreateCategory">
          <Plus class="h-4 w-4" />
          Add
        </Button>
      </CardHeader>
      <CardContent class="pt-0">
        <p v-if="!categories.items.length" class="py-6 text-center text-sm text-muted-foreground">
          No categories yet. Add one to organise your tasks.
        </p>
        <ul v-else class="divide-y">
          <li
            v-for="category in categories.items"
            :key="category.id"
            class="flex items-center gap-3 py-2.5"
          >
            <span class="h-3 w-3 shrink-0 rounded-full" :style="{ backgroundColor: category.color }" />
            <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ category.name }}</span>
            <Button variant="ghost" size="icon" aria-label="Edit category" @click="openEditCategory(category)">
              <Pencil class="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Delete category" @click="askDeleteCategory(category)">
              <Trash2 class="h-4 w-4 text-destructive" />
            </Button>
          </li>
        </ul>
      </CardContent>
    </Card>

    <!-- Account -->
    <Card>
      <CardHeader>
        <CardTitle class="text-base">Account</CardTitle>
        <CardDescription>{{ auth.user?.email ?? 'Not signed in' }}</CardDescription>
      </CardHeader>
      <CardContent class="pt-0">
        <Button v-if="auth.isAuthenticated" variant="outline" class="text-destructive" @click="signOut">
          <LogOut class="h-4 w-4" />
          Sign out
        </Button>
      </CardContent>
    </Card>

    <ResourceFormDialog
      v-model:open="dialogOpen"
      :title="editing ? 'Edit category' : 'New category'"
      description="Categories help you group and colour-code your tasks."
      :fields="categoryFields"
      :schema="categorySchema"
      :initial="editing"
      :submit-label="editing ? 'Save changes' : 'Create category'"
      @submit="submitCategory"
    />

    <ConfirmDeleteDialog
      v-model:open="deleteOpen"
      title="Delete category"
      :description="`Delete “${deleting?.name ?? ''}”? Tasks keep their data but lose this category.`"
      :loading="deleteLoading"
      @confirm="confirmDeleteCategory"
    />
  </div>
</template>
