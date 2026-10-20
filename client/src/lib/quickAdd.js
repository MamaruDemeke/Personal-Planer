/**
 * Todoist-style natural language quick-add parser.
 *
 * Input: "Buy milk tomorrow p1 #shopping every week"
 * Output: { title, priority, recurrence, startDate, deadline, plan }
 *
 * Only the bits we can confidently parse are extracted; the rest stays in the
 * title. Parsing is deliberately conservative so we never destroy user input.
 */

const PRIORITY_MAP = {
  p1: 'high',
  p2: 'medium',
  p3: 'low',
  p4: 'low',
  urgent: 'high',
  high: 'high',
  medium: 'medium',
  low: 'low',
}

const RECURRENCE_MAP = {
  daily: 'daily',
  day: 'daily',
  weekly: 'weekly',
  week: 'weekly',
  monthly: 'monthly',
  month: 'monthly',
  yearly: 'yearly',
  year: 'yearly',
  annually: 'yearly',
}

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function nextWeekday(name) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const idx = days.indexOf(name.toLowerCase())
  if (idx < 0) return null
  const now = new Date()
  const diff = (idx - now.getDay() + 7) % 7 || 7
  return addDays(now, diff)
}

export function parseQuickAdd(text) {
  const result = {
    title: text.trim(),
    priority: 'medium',
    recurrence: 'none',
    plan: 'daily',
    startDate: null,
    deadline: null,
  }
  if (!text.trim()) return result

  let working = text

  // Recurrence: "every day/week/month/year" or "daily/weekly/..." at end
  const recMatch = working.match(/\bevery\s+(day|week|month|year|daily|weekly|monthly|yearly)\b/i)
  if (recMatch) {
    const key = recMatch[1].toLowerCase().replace(/ly$/, '')
    result.recurrence = RECURRENCE_MAP[key] || RECURRENCE_MAP[recMatch[1].toLowerCase()] || 'none'
    working = working.replace(recMatch[0], '').trim()
  }

  // Priority tokens: p1, p2, p3, p4, !, !!, !!!
  const prioMatch = working.match(/\b(p[1-4])\b|(!{1,3})\b/i)
  if (prioMatch) {
    if (prioMatch[1]) {
      result.priority = PRIORITY_MAP[prioMatch[1].toLowerCase()] || result.priority
    } else if (prioMatch[2]) {
      const bangs = prioMatch[2].length
      result.priority = bangs >= 3 ? 'high' : bangs === 2 ? 'medium' : 'high'
    }
    working = working.replace(prioMatch[0], '').trim()
  }

  // Date phrases
  const lower = working.toLowerCase()
  const today = startOfDay(new Date())
  let date = null
  let datePhrase = null

  if (/\btoday\b/.test(lower)) {
    date = today
    datePhrase = 'today'
  } else if (/\btomorrow\b/.test(lower)) {
    date = addDays(today, 1)
    datePhrase = 'tomorrow'
  } else if (/\bnext week\b/.test(lower)) {
    date = addDays(today, 7)
    datePhrase = 'next week'
  } else if (/\bin\s+(\d+)\s+days?\b/.test(lower)) {
    const m = lower.match(/\bin\s+(\d+)\s+days?\b/)
    date = addDays(today, parseInt(m[1], 10))
    datePhrase = m[0]
  } else {
    const wdMatch = lower.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/)
    if (wdMatch) {
      date = nextWeekday(wdMatch[1])
      datePhrase = wdMatch[0]
    }
  }

  if (date) {
    result.deadline = date.toISOString()
    if (datePhrase) {
      working = working.replace(new RegExp(datePhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '').trim()
    }
  }

  // Labels: #tag (strip but keep in title? keep as part of title for now)
  result.title = working.replace(/\s+/g, ' ').trim() || text.trim()
  return result
}
