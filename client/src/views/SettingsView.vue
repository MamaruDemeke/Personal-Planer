<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Sun, Moon, LogOut, UserRound, ShieldCheck, Loader2 } from 'lucide-vue-next'

import PageHeader from '@/components/common/PageHeader.vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import { useToast } from '@/composables/useToast'

const auth = useAuthStore()
const router = useRouter()
const toast = useToast()
const { isDark, setTheme } = useTheme()

const fullName = ref('')
const savingProfile = ref(false)
const newPassword = ref('')
const savingPassword = ref(false)

onMounted(() => {
  if (!auth.initialized) auth.initialize()
  fullName.value = auth.profile?.full_name || auth.user?.user_metadata?.full_name || ''
})

watch(
  () => auth.profile,
  (profile) => {
    if (profile) fullName.value = profile.full_name || ''
  },
)

const email = computed(() => auth.user?.email || '—')

async function saveProfile() {
  savingProfile.value = true
  try {
    await auth.updateProfile({ full_name: fullName.value.trim() })
    toast.success('Profile updated')
  } catch (err) {
    toast.error('Could not update profile', err?.message)
  } finally {
    savingProfile.value = false
  }
}

async function changePassword() {
  if (newPassword.value.length < 6) {
    toast.error('Password too short', 'Use at least 6 characters.')
    return
  }
  savingPassword.value = true
  try {
    await auth.updatePassword(newPassword.value)
    newPassword.value = ''
    toast.success('Password updated')
  } catch (err) {
    toast.error('Could not update password', err?.message)
  } finally {
    savingPassword.value = false
  }
}

async function signOut() {
  await auth.signOut()
  toast.success('Signed out')
  router.push('/login')
}
</script>

<template>
  <div class="space-y-4 sm:space-y-6">
    <PageHeader title="Settings" description="Manage your profile and preferences." />

    <div
      v-if="!auth.isConfigured"
      class="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning-foreground"
    >
      Supabase is not configured. Add your key to
      <code>client/.env</code> to enable accounts, persistence and profile settings.
    </div>

    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <UserRound class="h-4 w-4 text-primary" />
          Profile
        </CardTitle>
        <CardDescription>Your display name and account email.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="settings-name">Full name</Label>
            <Input id="settings-name" v-model="fullName" placeholder="Your name" :disabled="!auth.isConfigured" />
          </div>
          <div class="space-y-2">
            <Label for="settings-email">Email</Label>
            <Input id="settings-email" :model-value="email" disabled />
          </div>
        </div>
        <Button :disabled="!auth.isConfigured || savingProfile" @click="saveProfile">
          <Loader2 v-if="savingProfile" class="h-4 w-4 animate-spin" />
          Save profile
        </Button>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Switch between light and dark themes.</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="flex items-center gap-2">
          <Button :variant="!isDark ? 'default' : 'outline'" @click="setTheme(false)">
            <Sun class="h-4 w-4" />
            Light
          </Button>
          <Button :variant="isDark ? 'default' : 'outline'" @click="setTheme(true)">
            <Moon class="h-4 w-4" />
            Dark
          </Button>
        </div>
      </CardContent>
    </Card>

    <Card v-if="auth.isConfigured">
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <ShieldCheck class="h-4 w-4 text-primary" />
          Security
        </CardTitle>
        <CardDescription>Change your account password.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        <div class="space-y-2 sm:max-w-sm">
          <Label for="settings-password">New password</Label>
          <Input id="settings-password" v-model="newPassword" type="password" placeholder="••••••••" />
        </div>
        <Button :disabled="savingPassword" @click="changePassword">
          <Loader2 v-if="savingPassword" class="h-4 w-4 animate-spin" />
          Update password
        </Button>
      </CardContent>
    </Card>

    <Card v-if="auth.isConfigured">
      <CardHeader>
        <CardTitle>Session</CardTitle>
        <CardDescription>Sign out of this device.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" @click="signOut">
          <LogOut class="h-4 w-4" />
          Sign out
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
