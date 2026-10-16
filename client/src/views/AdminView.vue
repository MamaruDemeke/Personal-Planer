<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  BadgeCheck,
  Ban,
  Clock,
  Image as ImageIcon,
  Loader2,
  Receipt,
  RotateCcw,
  ShieldCheck,
  ShieldMinus,
  ShieldPlus,
  Users,
} from 'lucide-vue-next'

import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Textarea from '@/components/ui/Textarea.vue'
import Select from '@/components/ui/Select.vue'
import Dialog from '@/components/ui/Dialog.vue'
import DialogFooter from '@/components/ui/DialogFooter.vue'
import { useAccessStore } from '@/stores/access'
import { useNotificationsStore } from '@/stores/notifications'
import { useToast } from '@/composables/useToast'
import { api } from '@/services/api'
import { formatDateTime } from '@/lib/format'

const access = useAccessStore()
const notifications = useNotificationsStore()
const toast = useToast()

const loading = ref(true)
const loadError = ref(null)
const users = ref([])
const counts = ref({ total: 0, pending: 0, approved: 0, locked: 0, revoked: 0 })
const payments = ref([])
const acting = ref(false)

const dialog = reactive({
  open: false,
  mode: 'approve',
  user: null,
  payment: null,
  note: '',
  accessDays: '',
})

const pendingPayments = computed(() => payments.value.filter((p) => p.status === 'pending'))

const dialogTitle = computed(() => {
  if (dialog.mode === 'reject') return 'Reject submission'
  if (dialog.mode === 'grant') return 'Grant access'
  return 'Approve payment'
})

async function load() {
  loading.value = true
  loadError.value = null
  try {
    const [usersData, paymentsData] = await Promise.all([
      api.get('/admin/users'),
      api.get('/admin/payments', { status: 'pending' }),
    ])
    users.value = usersData.users ?? []
    counts.value = usersData.counts ?? counts.value
    payments.value = paymentsData.payments ?? []
    notifications.load()
  } catch (err) {
    loadError.value = err?.message ?? 'Could not load the admin dashboard'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function openDialog(mode, options = {}) {
  dialog.mode = mode
  dialog.user = options.user ?? null
  dialog.payment = options.payment ?? null
  dialog.note = ''
  dialog.accessDays = ''
  dialog.open = true
}

async function confirmDialog() {
  acting.value = true
  try {
    const accessDays = dialog.accessDays ? Number(dialog.accessDays) : null
    const body = { note: dialog.note.trim() || null, accessDays }

    if (dialog.mode === 'approve') {
      await api.post(`/admin/payments/${dialog.payment.id}/approve`, body)
      toast.success('Payment approved', 'The account has been unlocked.')
    } else if (dialog.mode === 'reject') {
      await api.post(`/admin/payments/${dialog.payment.id}/reject`, { note: body.note })
      toast.success('Submission rejected', 'The user can submit a new receipt.')
    } else if (dialog.mode === 'grant') {
      await api.post(`/admin/users/${dialog.user.id}/grant`, body)
      toast.success('Access granted')
    }

    dialog.open = false
    await load()
  } catch (err) {
    toast.error('Action failed', err?.message ?? 'Please try again.')
  } finally {
    acting.value = false
  }
}

async function setRole(user, role) {
  try {
    await api.patch(`/admin/users/${user.id}`, { role })
    toast.success(role === 'admin' ? 'Promoted to administrator' : 'Administrator removed')
    await load()
  } catch (err) {
    toast.error('Could not update role', err?.message ?? 'Please try again.')
  }
}

async function setRevoked(user, accessRevoked) {
  try {
    await api.patch(`/admin/users/${user.id}`, { accessRevoked })
    toast.success(accessRevoked ? 'Access revoked' : 'Access restored')
    await load()
  } catch (err) {
    toast.error('Could not update access', err?.message ?? 'Please try again.')
  }
}

function statusBadge(user) {
  if (user.accessRevoked) return { label: 'Revoked', variant: 'destructive' }
  if (user.paymentStatus === 'approved') return { label: 'Approved', variant: 'success' }
  if (user.paymentStatus === 'pending') return { label: 'Pending', variant: 'warning' }
  if (user.paymentStatus === 'rejected') return { label: 'Rejected', variant: 'destructive' }
  return { label: 'Locked', variant: 'muted' }
}

function proofLabel(payment) {
  return payment.proof_type === 'image' ? 'Receipt image' : payment.proof_text
}
</script>

<template>
  <div class="space-y-4 sm:space-y-5">
    <PageHeader
      title="User verification"
      description="Review payment proofs, approve access and manage administrators."
    >
      <template #actions>
        <Button variant="outline" size="sm" :disabled="loading" @click="load">
          <RotateCcw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
          Refresh
        </Button>
      </template>
    </PageHeader>

    <LoadingState v-if="loading && !users.length" />
    <ErrorState v-else-if="loadError" :description="loadError" @retry="load" />

    <template v-else>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Accounts" :value="counts.total" :icon="Users" tone="primary" />
        <StatCard label="Pending" :value="counts.pending" :icon="Clock" tone="warning" />
        <StatCard label="Approved" :value="counts.approved" :icon="BadgeCheck" tone="success" />
        <StatCard label="Locked" :value="counts.locked" :icon="ShieldMinus" tone="info" />
        <StatCard label="Revoked" :value="counts.revoked" :icon="Ban" tone="destructive" />
      </div>

      <!-- Verification queue -->
      <Card>
        <CardHeader class="flex-row items-center justify-between space-y-0">
          <CardTitle class="flex items-center gap-2 text-base">
            <ShieldCheck class="h-4 w-4 text-primary" />
            Pending verification
          </CardTitle>
          <Badge :variant="pendingPayments.length ? 'warning' : 'muted'">
            {{ pendingPayments.length }} waiting
          </Badge>
        </CardHeader>
        <CardContent class="space-y-3">
          <EmptyState
            v-if="!pendingPayments.length"
            title="No payments to verify"
            description="New submissions will appear here."
          />

          <div
            v-for="payment in pendingPayments"
            :key="payment.id"
            class="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-center"
          >
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground"
            >
              <img
                v-if="payment.proof_type === 'image' && payment.proof_image"
                :src="payment.proof_image"
                alt="Receipt"
                class="h-full w-full object-cover"
              />
              <ImageIcon v-else-if="payment.proof_type === 'image'" class="h-5 w-5" />
              <Receipt v-else class="h-5 w-5" />
            </div>

            <div class="min-w-0 flex-1 space-y-1">
              <p class="truncate text-sm font-medium">
                {{ payment.userName || payment.userEmail || payment.user_id }}
              </p>
              <p class="truncate text-xs text-muted-foreground">{{ payment.userEmail }}</p>
              <p class="truncate text-xs text-muted-foreground">
                {{ proofLabel(payment) }} · submitted {{ formatDateTime(payment.created_at) }}
              </p>
            </div>

            <div class="flex shrink-0 gap-2">
              <Button
                size="sm"
                class="bg-success text-white hover:bg-success/90"
                @click="openDialog('approve', { payment })"
              >
                <BadgeCheck class="h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="text-destructive"
                @click="openDialog('reject', { payment })"
              >
                Reject
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Accounts -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">Accounts</CardTitle>
        </CardHeader>
        <CardContent class="p-0">
          <div class="divide-y">
            <div
              v-for="user in users"
              :key="user.id"
              class="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
            >
              <div class="min-w-0 flex-1">
                <p class="flex items-center gap-2 truncate text-sm font-medium">
                  {{ user.fullName || user.email || user.id }}
                  <Badge v-if="user.role === 'admin'" variant="purple">admin</Badge>
                </p>
                <p class="truncate text-xs text-muted-foreground">{{ user.email }}</p>
                <p v-if="user.approvedUntil" class="text-xs text-muted-foreground">
                  Valid until {{ formatDateTime(user.approvedUntil) }}
                </p>
              </div>

              <Badge :variant="statusBadge(user).variant" class="w-fit">
                {{ statusBadge(user).label }}
              </Badge>

              <div class="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" @click="openDialog('grant', { user })">
                  <ShieldPlus class="h-4 w-4" />
                  Grant
                </Button>
                <Button
                  v-if="!user.accessRevoked"
                  variant="outline"
                  size="sm"
                  class="text-destructive"
                  @click="setRevoked(user, true)"
                >
                  <Ban class="h-4 w-4" />
                  Revoke
                </Button>
                <Button v-else variant="outline" size="sm" @click="setRevoked(user, false)">
                  <RotateCcw class="h-4 w-4" />
                  Restore
                </Button>
                <Button
                  v-if="user.role !== 'admin'"
                  variant="outline"
                  size="sm"
                  :disabled="user.id === access.summary?.id"
                  @click="setRole(user, 'admin')"
                >
                  Make admin
                </Button>
                <Button
                  v-else
                  variant="outline"
                  size="sm"
                  @click="setRole(user, 'user')"
                >
                  Remove admin
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </template>

    <!-- Review / grant dialog -->
    <Dialog
      :open="dialog.open"
      :title="dialogTitle"
      :description="
        dialog.mode === 'reject'
          ? 'The user will be notified and can submit a new receipt.'
          : 'Confirm the details below.'
      "
      @update:open="dialog.open = $event"
    >
      <div class="space-y-4">
        <div
          v-if="dialog.mode !== 'grant' && dialog.payment"
          class="rounded-lg border bg-muted/40 p-3 text-sm"
        >
          <p class="font-medium">
            {{ dialog.payment.userName || dialog.payment.userEmail }}
          </p>
          <p class="text-muted-foreground">Proof: {{ proofLabel(dialog.payment) }}</p>
          <img
            v-if="dialog.payment.proof_type === 'image' && dialog.payment.proof_image"
            :src="dialog.payment.proof_image"
            alt="Receipt"
            class="mt-3 max-h-72 w-full rounded-md border object-contain"
          />
        </div>

        <div
          v-else-if="dialog.user"
          class="rounded-lg border bg-muted/40 p-3 text-sm"
        >
          <p class="font-medium">{{ dialog.user.fullName || dialog.user.email }}</p>
          <p class="text-muted-foreground">{{ dialog.user.email }}</p>
        </div>

        <div v-if="dialog.mode !== 'reject'" class="space-y-2">
          <label class="text-sm font-medium">Access period</label>
          <Select v-model="dialog.accessDays">
            <option value="">Permanent (until revoked)</option>
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="365">1 year</option>
          </Select>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">
            {{ dialog.mode === 'reject' ? 'Reason (recommended)' : 'Note (optional)' }}
          </label>
          <Textarea v-model="dialog.note" rows="3" placeholder="Add a note for this decision" />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" :disabled="acting" @click="dialog.open = false">Cancel</Button>
        <Button
          :class="dialog.mode === 'reject' ? 'bg-destructive text-white hover:bg-destructive/90' : ''"
          :disabled="acting"
          @click="confirmDialog"
        >
          <Loader2 v-if="acting" class="h-4 w-4 animate-spin" />
          {{ dialog.mode === 'reject' ? 'Reject' : dialog.mode === 'grant' ? 'Grant access' : 'Approve' }}
        </Button>
      </DialogFooter>
    </Dialog>
  </div>
</template>
