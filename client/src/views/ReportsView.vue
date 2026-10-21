<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { format } from 'date-fns'
import { FileText, Loader2, Printer, Save, Sparkles, Trash2, Download } from 'lucide-vue-next'

import PageHeader from '@/components/common/PageHeader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Textarea from '@/components/ui/Textarea.vue'
import RichTextEditor from '@/components/common/RichTextEditor.vue'
import { useReportsStore } from '@/stores/reports'
import { useToast } from '@/composables/useToast'
import { useAccessGate } from '@/composables/useAccessGate'
import { formatDate, formatRelative } from '@/lib/format'

const reports = useReportsStore()

function stripTags(html) {
  if (!html) return ''
  return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}
const toast = useToast()
const { ensureWrite } = useAccessGate()

const PERIODS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]
const period = ref('daily')

const PERIOD_LABELS = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' }

const SECTIONS = computed(() => {
  const suffix =
    period.value === 'daily' ? 'today' : period.value === 'weekly' ? 'this week' : period.value === 'monthly' ? 'this month' : 'this year'
  const base = [
    { key: 'completed', label: `Work completed ${suffix}` },
    { key: 'ongoing', label: 'Work in progress' },
    { key: 'pending', label: 'Pending work' },
    { key: 'blockers', label: 'Blockers / issues' },
    { key: 'achievements', label: 'Achievements' },
  ]
  if (period.value === 'daily') {
    base.push({ key: 'tomorrowPlan', label: "Tomorrow's plan" })
  }
  return base
})

const todayStr = format(new Date(), 'yyyy-MM-dd')

const form = reactive({
  reportDate: todayStr,
  period: 'daily',
  completed: '',
  ongoing: '',
  pending: '',
  blockers: '',
  achievements: '',
  tomorrowPlan: '',
})

const currentId = ref(null)
const loadingReport = ref(false)
const saving = ref(false)
const suggesting = ref(false)

onMounted(() => {
  reports.load({ period: period.value }, { force: true }).catch(() => {})
  loadReport(form.reportDate, period.value)
})

watch(
  () => form.reportDate,
  (date) => {
    if (date) loadReport(date, period.value)
  },
)

watch(period, (p) => {
  form.period = p
  reports.load({ period: p }, { force: true }).catch(() => {})
  loadReport(form.reportDate, p)
})

async function loadReport(date, p = period.value) {
  loadingReport.value = true
  try {
    const report = await reports.getByDate(date, p)
    currentId.value = report?.id ?? null
    for (const { key } of SECTIONS.value) form[key] = report?.[key] ?? ''
  } catch (err) {
    toast.error('Could not load report', err?.message)
  } finally {
    loadingReport.value = false
  }
}

async function suggest() {
  suggesting.value = true
  try {
    const s = await reports.suggest(form.reportDate, period.value)
    form.completed = s.completed || form.completed
    form.ongoing = s.ongoing || form.ongoing
    form.pending = s.pending || form.pending
    toast.success('Filled from your tasks')
  } catch (err) {
    toast.error('Could not build suggestions', err?.message)
  } finally {
    suggesting.value = false
  }
}

async function save() {
  if (!ensureWrite()) return
  saving.value = true
  try {
    const row = await reports.save({ ...form, period: period.value })
    currentId.value = row.id
    toast.success('Report saved')
  } catch (err) {
    toast.error('Could not save report', err?.message)
  } finally {
    saving.value = false
  }
}

async function remove() {
  if (!ensureWrite()) return
  if (!currentId.value) return
  try {
    await reports.remove(currentId.value)
    currentId.value = null
    for (const { key } of SECTIONS.value) form[key] = ''
    toast.success('Report deleted')
  } catch (err) {
    toast.error('Could not delete report', err?.message)
  }
}

function selectReport(report) {
  form.reportDate = report.reportDate
  if (report.period) period.value = report.period
}

const isEmptyReport = computed(() => SECTIONS.value.every(({ key }) => !form[key]?.trim()))

function exportMarkdown() {
  const lines = [`# ${PERIODS.find((p) => p.value === period.value)?.label} Work Report — ${formatDate(form.reportDate)}`, '']
  for (const { key, label } of SECTIONS.value) {
    lines.push(`## ${label}`, stripTags(form[key]) || '—', '')
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `report-${form.reportDate}.md`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('Report exported', `Saved as report-${form.reportDate}.md`)
}

function printReport() {
  const rows = SECTIONS.value.map(({ key, label }) => {
    const value = form[key]?.trim() || '—'
    return `<section><h2>${label}</h2><div>${value}</div></section>`
  }).join('')
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Daily report ${form.reportDate}</title>
    <style>body{font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:720px;margin:40px auto;padding:0 16px;color:#111}
    h1{font-size:20px;border-bottom:2px solid #0d9488;padding-bottom:8px}h2{font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#0d9488;margin:20px 0 4px}
    p{white-space:normal;margin:0;line-height:1.5}</style></head><body>
    <h1>Daily Work Report — ${formatDate(form.reportDate)}</h1>${rows}</body></html>`
  const w = window.open('', '_blank', 'width=800,height=900')
  if (!w) {
    toast.error('Allow pop-ups to print')
    return
  }
  w.document.write(html)
  w.document.close()
  w.focus()
  w.print()
}
</script>

<template>
  <div class="space-y-4 sm:space-y-6">
    <PageHeader :title="`${(PERIODS.find((p) => p.value === period) || PERIODS[0]).label} Reports`" description="Record what you did, blocked on, and plan for the next period.">
      <template #actions>
        <div class="flex items-center gap-1 rounded-md border p-0.5">
          <Button
            v-for="p in PERIODS"
            :key="p.value"
            :variant="period === p.value ? 'default' : 'ghost'"
            size="sm"
            @click="period = p.value"
          >
            {{ p.label }}
          </Button>
        </div>
        <Button variant="outline" :disabled="suggesting" @click="suggest">
          <Loader2 v-if="suggesting" class="h-4 w-4 animate-spin" />
          <Sparkles v-else class="h-4 w-4" />
          Suggest from tasks
        </Button>
        <Button variant="outline" @click="exportMarkdown">
          <Download class="h-4 w-4" />
          Export
        </Button>
        <Button variant="outline" @click="printReport">
          <Printer class="h-4 w-4" />
          Print
        </Button>
        <Button :disabled="saving" @click="save">
          <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
          <Save v-else class="h-4 w-4" />
          Save
        </Button>
      </template>
    </PageHeader>

    <div class="grid gap-4 lg:grid-cols-3">
      <Card class="lg:col-span-2">
        <CardContent class="space-y-4 pt-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="report-date">Report date</Label>
              <Input id="report-date" v-model="form.reportDate" type="date" class="w-full sm:w-56" />
            </div>
            <div class="flex items-end">
              <Button
                v-if="currentId"
                variant="outline"
                class="text-destructive"
                @click="remove"
              >
                <Trash2 class="h-4 w-4" />
                Delete this report
              </Button>
            </div>
          </div>

          <div v-if="loadingReport" class="py-4">
            <Loader2 class="h-5 w-5 animate-spin text-muted-foreground" />
          </div>

          <div v-else class="space-y-4">
            <div v-for="section in SECTIONS" :key="section.key" class="space-y-1.5">
              <Label :for="`report-${section.key}`">{{ section.label }}</Label>
              <RichTextEditor
                v-model="form[section.key]"
                :rows="4"
                :placeholder="`Write the ${section.label.toLowerCase()} here...`"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-base">Recent reports</CardTitle>
        </CardHeader>
        <CardContent class="pt-0">
          <LoadingState v-if="reports.loading && !reports.loaded" :rows="4" />
          <EmptyState
            v-else-if="!reports.items.length"
            title="No reports yet"
            description="Saved reports will appear here."
            class="py-8"
          >
            <template #icon><FileText class="h-5 w-5" /></template>
          </EmptyState>
          <ul v-else class="divide-y">
            <li v-for="report in reports.items.slice(0, 20)" :key="report.id">
              <button
                type="button"
                class="w-full py-2.5 text-left transition-colors hover:text-primary"
                @click="selectReport(report)"
              >
                <p class="text-sm font-medium">{{ formatDate(report.reportDate) }}</p>
                <p class="text-xs text-muted-foreground">Updated {{ formatRelative(report.updatedAt) }}</p>
              </button>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>

    <p v-if="isEmptyReport" class="text-xs text-muted-foreground">
      This report is empty. Fill in a section or use “Suggest from tasks”.
    </p>
  </div>
</template>
