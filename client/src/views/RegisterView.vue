<script setup>
import { reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { AlertCircle, ArrowRight, Loader2, Mail, Lock, User } from 'lucide-vue-next'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const auth = useAuthStore()
const router = useRouter()
const toast = useToast()

const form = reactive({ fullName: '', email: '', password: '', confirm: '' })
const errors = reactive({})
const submitting = ref(false)
const needsConfirmation = ref(false)

function validate() {
  errors.fullName = !form.fullName.trim() ? 'Full name is required' : ''
  errors.email = !form.email
    ? 'Email is required'
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
      ? 'Enter a valid email address'
      : ''
  errors.password = !form.password
    ? 'Password is required'
    : form.password.length < 8
      ? 'Use at least 8 characters'
      : ''
  errors.confirm = form.confirm !== form.password ? 'Passwords do not match' : ''
  return !errors.fullName && !errors.email && !errors.password && !errors.confirm
}

async function onSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    const data = await auth.signUp(form.email.trim(), form.password, form.fullName.trim())
    if (data?.session) {
      toast.success('Account created', 'Welcome to Worker Planner!')
      router.replace('/')
    } else {
      needsConfirmation.value = true
      toast.info('Confirm your email', 'Check your inbox to finish signing up.')
    }
  } catch (err) {
    toast.error('Sign up failed', err?.message ?? 'Please try again.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout title="Create your account" subtitle="Start organizing your work with Worker Planner">
    <div
      v-if="needsConfirmation"
      class="flex gap-3 rounded-lg border border-success/40 bg-success/10 p-4 text-sm"
    >
      <AlertCircle class="mt-0.5 h-4 w-4 shrink-0 text-success" />
      <p class="text-muted-foreground">
        We sent a confirmation link to <strong>{{ form.email }}</strong>. Click it, then
        <RouterLink to="/login" class="font-medium text-primary hover:underline">sign in</RouterLink>.
      </p>
    </div>

    <div
      v-else-if="!auth.isConfigured"
      class="mb-5 flex gap-3 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm"
    >
      <AlertCircle class="mt-0.5 h-4 w-4 shrink-0 text-warning-foreground" />
      <p class="text-muted-foreground">
        Supabase is not configured. Add your keys to <code>client/.env</code> to enable
        registration.
      </p>
    </div>

    <form v-if="!needsConfirmation" class="space-y-4" novalidate @submit.prevent="onSubmit">
      <div class="space-y-2">
        <Label for="fullName">Full name</Label>
        <div class="relative">
          <User class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="fullName" v-model="form.fullName" autocomplete="name" placeholder="Jane Doe" class="pl-9" />
        </div>
        <p v-if="errors.fullName" class="text-xs text-destructive">{{ errors.fullName }}</p>
      </div>

      <div class="space-y-2">
        <Label for="email">Email</Label>
        <div class="relative">
          <Mail class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="email" v-model="form.email" type="email" autocomplete="email" placeholder="you@example.com" class="pl-9" />
        </div>
        <p v-if="errors.email" class="text-xs text-destructive">{{ errors.email }}</p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-2">
          <Label for="password">Password</Label>
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
      </div>

      <Button type="submit" class="w-full" :disabled="submitting || !auth.isConfigured">
        <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
        <span>{{ submitting ? 'Creating account…' : 'Create account' }}</span>
        <ArrowRight v-if="!submitting" class="h-4 w-4" />
      </Button>
    </form>

    <p v-if="!needsConfirmation" class="mt-6 text-center text-sm text-muted-foreground">
      Already have an account?
      <RouterLink to="/login" class="font-medium text-primary hover:underline">Sign in</RouterLink>
    </p>
  </AuthLayout>
</template>
