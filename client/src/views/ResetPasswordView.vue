<script setup>
import { reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { AlertCircle, Loader2, Lock, ShieldCheck } from 'lucide-vue-next'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const auth = useAuthStore()
const router = useRouter()
const toast = useToast()

const form = reactive({ password: '', confirm: '' })
const errors = reactive({})
const submitting = ref(false)

function validate() {
  errors.password = !form.password
    ? 'Password is required'
    : form.password.length < 8
      ? 'Use at least 8 characters'
      : ''
  errors.confirm = form.confirm !== form.password ? 'Passwords do not match' : ''
  return !errors.password && !errors.confirm
}

async function onSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    await auth.updatePassword(form.password)
    toast.success('Password updated', 'You can now sign in with your new password.')
    router.replace('/dashboard')
  } catch (err) {
    toast.error('Could not update password', err?.message ?? 'Please try again.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout title="Choose a new password" subtitle="Set a strong password for your account">
    <div class="mb-5 flex gap-3 rounded-lg border bg-muted/50 p-3 text-sm">
      <ShieldCheck class="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <p class="text-muted-foreground">
        You arrived here from a recovery link. Enter a new password to regain access.
      </p>
    </div>

    <form class="space-y-4" novalidate @submit.prevent="onSubmit">
      <div
        v-if="!auth.isConfigured"
        class="flex gap-3 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm"
      >
        <AlertCircle class="mt-0.5 h-4 w-4 shrink-0 text-warning-foreground" />
        <p class="text-muted-foreground">
          Supabase is not configured. Add your keys to <code>client/.env</code> first.
        </p>
      </div>

      <div class="space-y-2">
        <Label for="password">New password</Label>
        <div class="relative">
          <Lock class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="password" v-model="form.password" type="password" autocomplete="new-password" placeholder="••••••••" class="pl-9" />
        </div>
        <p v-if="errors.password" class="text-xs text-destructive">{{ errors.password }}</p>
      </div>

      <div class="space-y-2">
        <Label for="confirm">Confirm password</Label>
        <Input id="confirm" v-model="form.confirm" type="password" autocomplete="new-password" placeholder="••••••••" />
        <p v-if="errors.confirm" class="text-xs text-destructive">{{ errors.confirm }}</p>
      </div>

      <Button type="submit" class="w-full" :disabled="submitting || !auth.isConfigured">
        <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
        <span>{{ submitting ? 'Updating…' : 'Update password' }}</span>
      </Button>
    </form>

    <p class="mt-6 text-center text-sm text-muted-foreground">
      <RouterLink to="/login" class="font-medium text-primary hover:underline">Back to sign in</RouterLink>
    </p>
  </AuthLayout>
</template>
