<script setup>
import { computed, ref } from 'vue'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-vue-next'

import PageHeader from '@/components/common/PageHeader.vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import {
  gregorianToEthiopian,
  ethiopianToGregorian,
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

// Major Orthodox Tewahdo feasts (Ethiopian month/day) with descriptions.
const feasts = [
  { m: 1, d: 1, name: 'Enkutatash (Ethiopian New Year)', note: 'Beginning of the year; spring renewal.' },
  { m: 1, d: 17, name: 'Meskel', note: 'Finding of the True Cross — major festival with Demera bonfire.' },
  { m: 3, d: 29, name: 'Genna (Ethiopian Christmas)', note: 'Birth of Christ; celebrated Jan 7 Gregorian.' },
  { m: 4, d: 11, name: 'Timkat (Epiphany)', note: 'Baptism of Christ; tabots carried to water.' },
  { m: 5, d: 11, name: 'Kana Ze-Gelila', note: 'Turning water into wine at Cana.' },
  { m: 6, d: 12, name: 'Hosanna (Palm Sunday)', note: 'Entry of Christ into Jerusalem.' },
  { m: 7, d: 19, name: 'Siklet (Good Friday)', note: 'Crucifixion of Christ.' },
  { m: 7, d: 21, name: 'Tensae (Easter / Fasika)', note: 'Resurrection of Christ.' },
  { m: 8, d: 20, name: 'Rapture / Ascension', note: 'Ascension of Christ.' },
  { m: 9, d: 4, name: 'Pentecost (Paraclete)', note: 'Descent of the Holy Spirit.' },
  { m: 11, d: 7, name: 'Kidane (Covenant of Mercy)', note: 'St. Mary — feast of the Covenant.' },
  { m: 12, d: 16, name: 'Filseta (Assumption of St. Mary)', note: 'Dormition and Assumption of the Virgin Mary.' },
]

const feastsThisMonth = computed(() =>
  feasts.filter((f) => f.m === viewMonth.value).map((f) => ({
    ...f,
    gregorian: ethiopianToGregorian(viewYear.value, f.m, f.d).toLocaleDateString(),
  })),
)

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
          <p class="text-2xl font-bold text-primary">
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

    <!-- Feasts this month -->
    <Card>
      <CardHeader class="pb-2">
        <CardTitle class="text-base">{{ t('eth.feastsThisMonth') }}</CardTitle>
      </CardHeader>
      <CardContent class="space-y-2">
        <div v-if="!feastsThisMonth.length" class="py-4 text-center text-sm text-muted-foreground">
          No major feasts this month.
        </div>
        <div
          v-for="f in feastsThisMonth"
          :key="f.name"
          class="rounded-md border bg-card px-3 py-2"
        >
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium">{{ f.name }}</p>
            <span class="text-xs text-muted-foreground">{{ f.d }} {{ monthName }} · {{ f.gregorian }}</span>
          </div>
          <p class="text-xs text-muted-foreground">{{ f.note }}</p>
        </div>
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
