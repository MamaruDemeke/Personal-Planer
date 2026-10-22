<script setup>
import { reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-vue-next'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useI18n } from '@/lib/i18n'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const toast = useToast()
const { t } = useI18n()

const form = reactive({ email: '', password: '' })
const errors = reactive({})
const submitting = ref(false)
const showPassword = ref(false)

function validate() {
  errors.email = !form.email
    ? 'Email is required'
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
      ? 'Enter a valid email address'
      : ''
  errors.password = !form.password ? 'Password is required' : ''
  return !errors.email && !errors.password
}

async function onSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    await auth.signIn(form.email.trim(), form.password)
    toast.success('Welcome back', 'You are signed in.')
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.replace(redirect)
  } catch (err) {
    toast.error('Sign in failed', err?.message ?? 'Please try again.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
    <AuthLayout :title="t('login.welcomeBack')" :subtitle="t('login.signInSubtitle')">
    <div
      v-if="!auth.isConfigured"
      class="mb-5 flex gap-3 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm"
    >
      <AlertCircle class="mt-0.5 h-4 w-4 shrink-0 text-warning-foreground" />
      <p class="text-muted-foreground">
        Supabase is not configured. Add your keys to <code>client/.env</code> to enable
        authentication.
      </p>
    </div>

    <form class="space-y-4" novalidate @submit.prevent="onSubmit">
      <div class="space-y-2">
          <Label for="email">{{ t('login.email') }}</Label>
        <div class="relative">
          <Mail class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            v-model="form.email"
            type="email"
            autocomplete="email"
            :placeholder="t('login.emailPlaceholder')"
            class="pl-9"
          />
        </div>
        <p v-if="errors.email" class="text-xs text-destructive">{{ errors.email }}</p>
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <Label for="password">{{ t('login.password') }}</Label>
          <RouterLink to="/forgot-password" class="text-xs text-primary hover:underline">
            Forgot password?
          </RouterLink>
        </div>
        <div class="relative">
          <Lock class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            placeholder="••••••••"
            class="pl-9 pr-9"
          />
          <button
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
            @click="showPassword = !showPassword"
          >
            <EyeOff v-if="showPassword" class="h-4 w-4" />
            <Eye v-else class="h-4 w-4" />
          </button>
        </div>
        <p v-if="errors.password" class="text-xs text-destructive">{{ errors.password }}</p>
      </div>

      <Button type="submit" class="w-full" :disabled="submitting || !auth.isConfigured">
        <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
        <span>{{ submitting ? t('login.signingIn') : t('header.signIn') }}</span>
        <ArrowRight v-if="!submitting" class="h-4 w-4" />
      </Button>
    </form>

    <p class="mt-6 text-center text-sm text-muted-foreground">
      Don't have an account?
        <RouterLink to="/register" class="font-medium text-primary hover:underline">
          {{ t('login.createOne') }}
      </RouterLink>
    </p>

    <template #footer>
      <RouterLink
        to="/"
        class="block text-center text-xs text-muted-foreground hover:text-foreground"
      >
        Continue without signing in
      </RouterLink>
    </template>
  </AuthLayout>
</template>
