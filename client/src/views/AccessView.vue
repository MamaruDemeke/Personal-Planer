<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  BadgeCheck,
  Clock,
  HardHat,
  Image as ImageIcon,
  Loader2,
  LogOut,
  Mail,
  Phone,
  Receipt,
  ShieldAlert,
  Upload,
  X,
} from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ErrorState from '@/components/common/ErrorState.vue'
import { useAuthStore } from '@/stores/auth'
import { useAccessStore } from '@/stores/access'
import { useToast } from '@/composables/useToast'
import { useI18n } from '@/lib/i18n'
import { api } from '@/services/api'
import { formatDateTime } from '@/lib/format'

const auth = useAuthStore()
const access = useAccessStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const { t } = useI18n()

const MAX_IMAGE_BYTES = 1.4 * 1024 * 1024
const MAX_PROOF_CHARS = 2_000_000

const loading = ref(true)
const loadError = ref(null)
const submissions = ref([])
const proofType = ref('image')
const proofText = ref('')
const proofImage = ref('')
const fileName = ref('')
const submitting = ref(false)
const formError = ref('')

const summary = computed(() => access.summary)
const status = computed(() => access.paymentStatus)
const reason = computed(() => access.reason)

const showForm = computed(() => ['none', 'rejected', 'expired'].includes(reason.value))
const approved = computed(() => access.canUse)
const revoked = computed(() => reason.value === 'revoked')

const statusMeta = computed(() => {
  if (access.isAdmin) return { label: 'Administrator', variant: 'purple' }
  switch (status.value) {
    case 'approved':
      return { label: 'Approved', variant: 'success' }
    case 'pending':
      return { label: 'Awaiting review', variant: 'warning' }
    case 'rejected':
      return { label: 'Rejected', variant: 'destructive' }
    default:
      return { label: 'Not submitted', variant: 'muted' }
  }
})

async function refresh() {
  const data = await api.get('/payments')
  access.setSummary(data.access)
  submissions.value = data.submissions ?? []
}

onMounted(async () => {
  try {
    await refresh()
  } catch (err) {
    loadError.value = err?.message ?? 'Could not load your payment status'
  } finally {
    loading.value = false
  }
})

function resetProof() {
  proofImage.value = ''
  fileName.value = ''
  proofText.value = ''
  formError.value = ''
}

function onFile(event) {
  const file = event.target.files?.[0]
  formError.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    formError.value = 'Choose an image file (PNG, JPG, WEBP or GIF).'
    return
  }
  if (file.size > MAX_IMAGE_BYTES) {
    formError.value = 'That image is larger than 1.4 MB. Please choose a smaller one.'
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    const result = typeof reader.result === 'string' ? reader.result : ''
    if (result.length > MAX_PROOF_CHARS) {
      formError.value = 'That image is too large once encoded. Please choose a smaller one.'
      proofImage.value = ''
      fileName.value = ''
      return
    }
    proofImage.value = result
    fileName.value = file.name
  }
  reader.onerror = () => {
    formError.value = 'Could not read that file. Try another image.'
  }
  reader.readAsDataURL(file)
}

async function submit() {
  formError.value = ''
  if (proofType.value === 'image' && !proofImage.value) {
    formError.value = 'Attach a receipt image first.'
    return
  }
  if (proofType.value === 'transaction' && proofText.value.trim().length < 3) {
    formError.value = 'Enter a valid transaction number.'
    return
  }

  submitting.value = true
  try {
    await api.post('/payments', {
      proofType: proofType.value,
      proofText: proofType.value === 'transaction' ? proofText.value.trim() : null,
      proofImage: proofType.value === 'image' ? proofImage.value : null,
    })
    await refresh()
    resetProof()
    toast.success('Payment submitted', 'An administrator will verify it shortly.')
  } catch (err) {
    formError.value = err?.message ?? 'Could not submit your payment'
    toast.error('Could not submit your payment', err?.message)
  } finally {
    submitting.value = false
  }
}

function continueToApp() {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
  router.replace(redirect)
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'dashboard' })
}

async function signOut() {
  access.invalidate()
  await auth.signOut()
  toast.success('Signed out')
  router.replace({ name: 'login' })
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-muted/30">
    <header class="flex h-14 items-center gap-2.5 border-b bg-card px-4 sm:h-16 sm:px-6">
      <span
        class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-info text-primary-foreground shadow-sm shadow-primary/30"
      >
        <HardHat class="h-5 w-5" />
      </span>
        <span class="text-gradient text-lg font-bold tracking-tight">{{ t('app.name') }}</span>
        <Button variant="ghost" size="sm" class="ml-auto" @click="goBack">
          <ArrowLeft class="h-4 w-4" /> {{ t('access.back') }}
        </Button>
      <Button variant="ghost" size="sm" @click="signOut">
        <LogOut class="h-4 w-4" />
        Sign out
      </Button>
    </header>

    <main class="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-12">
      <div v-if="loading" class="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 class="mr-2 h-5 w-5 animate-spin" />
        Checking your access…
      </div>

      <ErrorState
        v-else-if="loadError && !summary"
        :title="t('access.couldNotLoad')"
        :description="loadError"
        @retry="refresh"
      />

      <template v-else>
        <!-- Approved / administrator -->
        <Card v-if="approved">
          <CardContent class="flex flex-col items-center gap-4 py-12 text-center">
            <div
              class="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success"
            >
              <BadgeCheck class="h-7 w-7" />
            </div>
            <div class="space-y-1">
              <h2 class="text-xl font-semibold">
                {{ access.isAdmin ? 'Administrator access' : 'Access approved' }}
              </h2>
              <p class="text-sm text-muted-foreground">
                {{
                  summary?.approvedUntil
                    ? `Your access is valid until ${formatDateTime(summary.approvedUntil)}.`
                    : 'Your account is fully unlocked.'
                }}
              </p>
            </div>
            <Button @click="continueToApp">{{ t('access.continue') }}</Button>
          </CardContent>
        </Card>

        <template v-else>
          <div
            v-if="loadError"
            class="mb-4 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-warning-foreground"
          >
            {{ loadError }} You can still submit your payment below.
          </div>

          <div class="mb-6 space-y-2 text-center">
            <Badge :variant="statusMeta.variant">{{ statusMeta.label }}</Badge>
            <h1 class="text-2xl font-semibold tracking-tight">{{ t('access.verifyPayment') }}</h1>
            <p class="mx-auto max-w-lg text-sm text-muted-foreground">
              Upload your payment receipt or enter the transaction number. Your planner stays locked
              until an administrator verifies and approves your account.
            </p>
          </div>

          <!-- Revoked -->
          <Card v-if="revoked" class="border-destructive/30">
            <CardContent class="flex flex-col items-center gap-3 py-10 text-center">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"
              >
                <ShieldAlert class="h-6 w-6" />
              </div>
              <h2 class="text-lg font-semibold">Access revoked</h2>
              <p class="max-w-md text-sm text-muted-foreground">
                {{
                  summary?.paymentReviewNote ||
                  'An administrator has revoked your access. Please contact them to restore it.'
                }}
              </p>
            </CardContent>
          </Card>

          <!-- Pending -->
          <Card v-else-if="status === 'pending'" class="border-warning/40">
            <CardContent class="flex flex-col items-center gap-3 py-10 text-center">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full bg-warning/15 text-warning-foreground"
              >
                <Clock class="h-6 w-6" />
              </div>
              <h2 class="text-lg font-semibold">Payment under review</h2>
              <p class="max-w-md text-sm text-muted-foreground">
                Your submission was received
                <template v-if="summary?.paymentSubmittedAt">
                  on {{ formatDateTime(summary.paymentSubmittedAt) }}</template
                >. An administrator will approve it shortly.
              </p>
              <div class="mt-2 flex flex-col items-center gap-1.5 text-sm">
                <p class="text-muted-foreground">Need help or want to follow up? Contact us:</p>
                <a
                  href="tel:0943467433"
                  class="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                >
                  <Phone class="h-4 w-4" />
                  0943467433
                </a>
                <a
                  href="mailto:mamardemeke1221@gmail.com"
                  class="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                >
                  <Mail class="h-4 w-4" />
                  mamardemeke1221@gmail.com
                </a>
              </div>
            </CardContent>
          </Card>

          <!-- Rejected notice + form -->
          <template v-if="showForm">
            <div
              v-if="status === 'rejected'"
              class="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm"
            >
              <p class="font-medium text-destructive">Your last payment was rejected</p>
              <p class="text-muted-foreground">
                {{ summary?.paymentReviewNote || 'Please submit a valid receipt to try again.' }}
              </p>
            </div>
            <div
              v-else-if="status === 'expired'"
              class="mb-4 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm"
            >
              <p class="font-medium text-warning-foreground">Your access period has expired</p>
              <p class="text-muted-foreground">Renew your payment to unlock the planner again.</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle class="text-base">Submit your payment proof</CardTitle>
              </CardHeader>
              <CardContent class="space-y-4">
                <div class="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    class="flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors"
                    :class="
                      proofType === 'image'
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'hover:bg-accent'
                    "
                    @click="proofType = 'image'"
                  >
                    <ImageIcon class="h-5 w-5 text-primary" />
                    <span class="text-sm font-medium">Receipt image</span>
                    <span class="text-xs text-muted-foreground">Upload a photo or screenshot</span>
                  </button>
                  <button
                    type="button"
                    class="flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors"
                    :class="
                      proofType === 'transaction'
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'hover:bg-accent'
                    "
                    @click="proofType = 'transaction'"
                  >
                    <Receipt class="h-5 w-5 text-primary" />
                    <span class="text-sm font-medium">Transaction number</span>
                    <span class="text-xs text-muted-foreground">Type the payment reference</span>
                  </button>
                </div>

                <div v-if="proofType === 'image'" class="space-y-2">
                  <label
                    class="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground transition-colors hover:bg-accent"
                  >
                    <Upload class="h-4 w-4" />
                    {{ fileName || 'Choose an image (max 1.4 MB)' }}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      class="sr-only"
                      @change="onFile"
                    />
                  </label>
                  <div v-if="proofImage" class="relative overflow-hidden rounded-lg border">
                    <img :src="proofImage" alt="Receipt preview" class="max-h-64 w-full object-contain" />
                    <button
                      type="button"
                      class="absolute right-2 top-2 rounded-full bg-background/90 p-1 shadow"
                      aria-label="Remove image"
                      @click="resetProof"
                    >
                      <X class="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div v-else class="space-y-2">
                  <label class="text-sm font-medium" for="tx">Transaction number</label>
                  <Input
                    id="tx"
                    v-model="proofText"
                    placeholder="e.g. CBE-8F29K1 or 0912345678"
                    maxlength="120"
                  />
                </div>

                <p v-if="formError" class="text-sm text-destructive">{{ formError }}</p>

                <Button class="w-full" :disabled="submitting" @click="submit">
                  <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
                  Submit for verification
                </Button>
              </CardContent>
            </Card>
          </template>

          <!-- History -->
          <div v-if="submissions.length" class="mt-6 space-y-3">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Submission history
            </h2>
            <div
              v-for="item in submissions"
              :key="item.id"
              class="flex items-center gap-3 rounded-lg border bg-card p-3"
            >
              <span
                class="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground"
              >
                <ImageIcon v-if="item.proof_type === 'image'" class="h-4 w-4" />
                <Receipt v-else class="h-4 w-4" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium">
                  {{ item.proof_type === 'image' ? 'Receipt image' : item.proof_text }}
                </p>
                <p class="text-xs text-muted-foreground">{{ formatDateTime(item.created_at) }}</p>
              </div>
              <Badge
                :variant="
                  item.status === 'approved'
                    ? 'success'
                    : item.status === 'rejected'
                      ? 'destructive'
                      : 'warning'
                "
              >
                {{ item.status }}
              </Badge>
            </div>
          </div>
        </template>
      </template>
    </main>
  </div>
</template>
