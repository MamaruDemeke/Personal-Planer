<script setup>
import { computed, ref } from 'vue'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-vue-next'

import PageHeader from '@/components/common/PageHeader.vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import {
  gregorianToEthiopian,
  ETHIOPIAN_MONTHS,
  ETHIOPIAN_MONTHS_AMHARIC,
  daysInEthiopianMonth,
  isEthiopianLeapYear,
} from '@/lib/ethiopianCalendar'

const today = new Date()
const ethToday = gregorianToEthiopian(today)
const { t } = useI18n()

const viewYear = ref(ethToday.year)
const viewMonth = ref(ethToday.month)
const showYear = ref(false)

const monthName = computed(() => ETHIOPIAN_MONTHS[viewMonth.value - 1])
const monthNameAm = computed(() => ETHIOPIAN_MONTHS_AMHARIC[viewMonth.value - 1])

const days = computed(() => {
  const total = daysInEthiopianMonth(viewYear.value, viewMonth.value)
  return Array.from({ length: total }, (_, i) => i + 1)
})

function prevMonth() {
  if (viewMonth.value === 1) { viewMonth.value = 13; viewYear.value -= 1 } else viewMonth.value -= 1
}
function nextMonth() {
  if (viewMonth.value === 13) { viewMonth.value = 1; viewYear.value += 1 } else viewMonth.value += 1
}
function goToday() {
  viewYear.value = ethToday.year
  viewMonth.value = ethToday.month
}
</script>

<template>
  <div class="space-y-4 sm:space-y-6">
    <PageHeader :title="t('page.eth.title')" :description="t('page.eth.desc')">
      <template #actions>
        <Button variant="outline" @click="goToday">{{ t('common.today') }}</Button>
        <Button variant="outline" :variant="showYear ? 'default' : 'outline'" @click="showYear = !showYear">
          {{ showYear ? 'Month view' : 'Year view' }}
        </Button>
        <Button variant="outline" size="icon" aria-label="Previous month" @click="prevMonth">
          <ChevronLeft class="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" aria-label="Next month" @click="nextMonth">
          <ChevronRight class="h-4 w-4" />
        </Button>
      </template>
    </PageHeader>

    <!-- Today -->
    <Card class="border-primary/30 bg-primary/5">
      <CardContent class="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs uppercase tracking-wide text-muted-foreground">{{ t('eth.todayEthiopian') }}</p>
          <p class="text-lg font-bold text-primary">
            {{ ethToday.day }} {{ ETHIOPIAN_MONTHS[ethToday.month - 1] }} {{ ethToday.year }}
          </p>
          <p class="text-xs text-muted-foreground">{{ ETHIOPIAN_MONTHS_AMHARIC[ethToday.month - 1] }}</p>
        </div>
        <div class="text-sm text-muted-foreground">
          Gregorian: {{ today.toLocaleDateString() }}
        </div>
      </CardContent>
    </Card>

    <!-- Year view: all 13 months -->
    <div v-if="showYear" class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      <button
        v-for="(mn, idx) in ETHIOPIAN_MONTHS"
        :key="mn"
        type="button"
        class="rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary/40"
        :class="viewMonth === idx + 1 && 'border-primary bg-primary/5'"
        @click="viewMonth = idx + 1; showYear = false"
      >
        <p class="text-sm font-semibold">{{ mn }}</p>
        <p class="text-xs text-muted-foreground">{{ ETHIOPIAN_MONTHS_AMHARIC[idx] }}</p>
        <p class="mt-1 text-xs text-muted-foreground">{{ daysInEthiopianMonth(viewYear, idx + 1) }} days</p>
      </button>
    </div>

    <!-- Month grid -->
    <Card v-else>
      <CardHeader class="pb-2">
        <CardTitle class="flex items-center gap-2 text-base">
          <Calendar class="h-4 w-4 text-primary" />
          {{ monthNameAm }} ({{ monthName }}) {{ viewYear.value }}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-5 gap-1.5 sm:grid-cols-7 md:grid-cols-10">
          <a
            v-for="d in days"
            :key="d"
            :href="`https://www.ethiopianorthodox.org/amharic/holybooks/metsehafesenkesar.html`"
            target="_blank"
            rel="noopener noreferrer"
            class="flex h-9 items-center justify-center rounded-md border text-sm transition-colors"
            :class="[
              viewYear === ethToday.year && viewMonth === ethToday.month && d === ethToday.day
                ? 'border-primary bg-primary text-primary-foreground font-bold'
                : 'bg-card hover:bg-primary/10 hover:border-primary/40',
            ]"
            :title="`${ETHIOPIAN_MONTHS_AMHARIC[viewMonth - 1]} ${d}, ${viewYear} — ስንክሳር`"
          >
            {{ d }}
          </a>
        </div>
        <p class="mt-2 text-xs text-muted-foreground">
          {{ isEthiopianLeapYear(viewYear) ? 'Leap year (Pagume has 6 days).' : 'Pagume has 5 days.' }}
          Click a day to open the Synaxarium (Senksar).
        </p>
      </CardContent>
    </Card>

    <!-- Saint of the day + Synaxarium link -->
    <Card>
      <CardHeader class="pb-2">
        <CardTitle class="text-base">{{ t('eth.saintOfDay') }} ({{ ethToday.day }} {{ ETHIOPIAN_MONTHS[ethToday.month - 1] }})</CardTitle>
      </CardHeader>
      <CardContent class="space-y-3">
        <p class="text-sm text-muted-foreground">
          Today the Ethiopian Orthodox Tewahdo Church commemorates the saints and feasts of
          {{ ETHIOPIAN_MONTHS[ethToday.month - 1] }} {{ ethToday.day }}. Read the full Synaxarium
          (Senksar) entry for today's saints, feasts and history.
        </p>
        <div class="flex flex-wrap gap-2">
          <a
            href="https://www.ethiopianorthodox.org/amharic/holybooks/metsehafesenkesar.html"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            ስንክሳር (Senksar) — Amharic
          </a>
          <a
            href="https://holytrinityeotccharlotte.org/daily-synaxarium/"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            Daily Synaxarium (English)
          </a>
          <a
            href="https://eotbible.com/saints.html"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            Saints list (EOT Bible)
          </a>
        </div>
        <p class="text-xs text-muted-foreground">
          The Synaxarium commemorates saints and feasts for every day of the Ethiopian year.
        </p>
      </CardContent>
    </Card>
  </div>
</template>
