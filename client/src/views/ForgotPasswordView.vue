<script setup>
import { reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-vue-next'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const auth = useAuthStore()
const toast = useToast()

const form = reactive({ email: '' })
const errors = reactive({})
const submitting = ref(false)
const sent = ref(false)

function validate() {
  errors.email = !form.email
    ? 'Email is required'
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
      ? 'Enter a valid email address'
      : ''
  return !errors.email
}

async function onSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    await auth.sendPasswordReset(form.email.trim())
    sent.value = true
    toast.success('Reset link sent', 'Check your inbox for the recovery email.')
  } catch (err) {
    toast.error('Could not send reset link', err?.message ?? 'Please try again.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout title="Reset your password" subtitle="We'll email you a secure recovery link">
    <div v-if="sent" class="flex flex-col items-center gap-3 py-2 text-center">
      <span class="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
        <CheckCircle2 class="h-6 w-6" />
      </span>
      <p class="text-sm text-muted-foreground">
        If an account exists for <strong>{{ form.email }}</strong>, a recovery link is on its way.
      </p>
    </div>

    <form v-else class="space-y-4" novalidate @submit.prevent="onSubmit">
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
        <Label for="email">Email</Label>
        <div class="relative">
          <Mail class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="email" v-model="form.email" type="email" autocomplete="email" placeholder="you@example.com" class="pl-9" />
        </div>
        <p v-if="errors.email" class="text-xs text-destructive">{{ errors.email }}</p>
      </div>

      <Button type="submit" class="w-full" :disabled="submitting || !auth.isConfigured">
        <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
        <span>{{ submitting ? 'Sending…' : 'Send reset link' }}</span>
      </Button>
    </form>

    <p class="mt-6 text-center text-sm text-muted-foreground">
      <RouterLink to="/login" class="inline-flex items-center gap-1 font-medium text-primary hover:underline">
        <ArrowLeft class="h-3.5 w-3.5" />
        Back to sign in
      </RouterLink>
    </p>
  </AuthLayout>
</template>
