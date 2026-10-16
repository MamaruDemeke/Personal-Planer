import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { toCamel, toSnake } from '../utils/case.js'
import { unwrap } from '../utils/db.js'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** GET /api/reports?from=YYYY-MM-DD&to=YYYY-MM-DD */
export const listReports = asyncHandler(async (req, res) => {
  const { from, to } = req.query
  let query = req.supabase.from('reports').select('*').order('report_date', { ascending: false })
  if (from) query = query.gte('report_date', from)
  if (to) query = query.lte('report_date', to)
  const rows = unwrap(await query)
  res.json({ data: (rows ?? []).map(toCamel) })
})

/** GET /api/reports/date/:date */
export const getReportByDate = asyncHandler(async (req, res) => {
  const { date } = req.params
  if (!DATE_RE.test(date)) throw ApiError.badRequest('Use the format YYYY-MM-DD')
  const row = unwrap(
    await req.supabase.from('reports').select('*').eq('report_date', date).maybeSingle(),
  )
  res.json({ data: row ? toCamel(row) : null })
})

/** GET /api/reports/:id */
export const getReport = asyncHandler(async (req, res) => {
  const row = unwrap(
    await req.supabase.from('reports').select('*').eq('id', req.params.id).maybeSingle(),
  )
  if (!row) throw ApiError.notFound('Report not found')
  res.json({ data: toCamel(row) })
})

/** POST /api/reports — upsert by (user_id, report_date) */
export const createReport = asyncHandler(async (req, res) => {
  const body = { ...toSnake(req.body), user_id: req.user.id }
  const row = unwrap(
    await req.supabase
      .from('reports')
      .upsert(body, { onConflict: 'user_id,report_date' })
      .select()
      .single(),
  )
  res.status(201).json({ data: toCamel(row) })
})

/** PATCH /api/reports/:id */
export const updateReport = asyncHandler(async (req, res) => {
  const patch = toSnake(req.body)
  if (Object.keys(patch).length === 0) throw ApiError.badRequest('No fields to update')
  const row = unwrap(
    await req.supabase.from('reports').update(patch).eq('id', req.params.id).select().maybeSingle(),
  )
  if (!row) throw ApiError.notFound('Report not found')
  res.json({ data: toCamel(row) })
})

/** DELETE /api/reports/:id */
export const deleteReport = asyncHandler(async (req, res) => {
  const row = unwrap(
    await req.supabase.from('reports').delete().eq('id', req.params.id).select().maybeSingle(),
  )
  if (!row) throw ApiError.notFound('Report not found')
  res.json({ data: { id: req.params.id } })
})

/**
 * GET /api/reports/suggest?date=YYYY-MM-DD
 * Suggests report content from the user's tasks: what was completed that day,
 * what is ongoing, and what is still pending.
 */
export const suggestReport = asyncHandler(async (req, res) => {
  const date = req.query.date
  if (!date || !DATE_RE.test(date)) throw ApiError.badRequest('A date (YYYY-MM-DD) is required')

  const start = new Date(`${date}T00:00:00.000Z`).getTime()
  const end = start + 24 * 60 * 60 * 1000

  const rows = unwrap(await req.supabase.from('tasks').select('*')) ?? []
  const tasks = rows.map(toCamel)

  const completed = tasks.filter((t) => {
    if (!t.completedAt) return false
    const at = new Date(t.completedAt).getTime()
    return at >= start && at < end
  })
  const ongoing = tasks.filter((t) => t.status === 'in_progress')
  const pending = tasks.filter((t) => t.status === 'not_started')

  const join = (list) => list.map((t) => `• ${t.title}`).join('\n')

  res.json({
    data: {
      date,
      completed: join(completed),
      ongoing: join(ongoing),
      pending: join(pending),
    },
  })
})
