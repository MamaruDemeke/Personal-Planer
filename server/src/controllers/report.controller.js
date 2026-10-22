import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { toCamel, toSnake } from '../utils/case.js'
import { unwrap } from '../utils/db.js'
import { rlsError, withRlsFallback } from '../utils/rls.js'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** GET /api/reports?from=YYYY-MM-DD&to=YYYY-MM-DD&period=daily */
export const listReports = asyncHandler(async (req, res) => {
  const { from, to, period } = req.query
  const rows = await withRlsFallback(
    req,
    async (client) => {
      let query = client.from('reports').select('*').order('report_date', { ascending: false })
      if (from) query = query.gte('report_date', from)
      if (to) query = query.lte('report_date', to)
      if (period) query = query.eq('period', period)
      return unwrap(await query)
    },
    (error) => {
      throw rlsError(error)
    },
  )
  res.json({ data: (rows ?? []).map(toCamel) })
})

/** GET /api/reports/date/:date?period=daily */
export const getReportByDate = asyncHandler(async (req, res) => {
  const { date } = req.params
  if (!DATE_RE.test(date)) throw ApiError.badRequest('Use the format YYYY-MM-DD')
  const period = (req.query.period ?? 'daily').toString()
  const row = await withRlsFallback(
    req,
    (client) =>
      client
        .from('reports')
        .select('*')
        .eq('report_date', date)
        .eq('period', period)
        .maybeSingle()
        .then(unwrap),
    (error) => {
      throw rlsError(error)
    },
  )
  res.json({ data: row ? toCamel(row) : null })
})

/** GET /api/reports/:id */
export const getReport = asyncHandler(async (req, res) => {
  const row = await withRlsFallback(
    req,
    (client) =>
      client
        .from('reports')
        .select('*')
        .eq('id', req.params.id)
        .maybeSingle()
        .then(unwrap),
    (error) => {
      throw rlsError(error)
    },
  )
  if (!row) throw ApiError.notFound('Report not found')
  res.json({ data: toCamel(row) })
})

/** POST /api/reports — upsert by (user_id, report_date, period) */
export const createReport = asyncHandler(async (req, res) => {
  const body = { ...toSnake(req.body), user_id: req.user.id }
  const row = await withRlsFallback(
    req,
    (client) =>
      client
        .from('reports')
        .upsert(body, { onConflict: 'user_id,report_date,period' })
        .select()
        .single()
        .then(unwrap),
    (error) => {
      throw rlsError(error)
    },
  )
  res.status(201).json({ data: toCamel(row) })
})

/** PATCH /api/reports/:id */
export const updateReport = asyncHandler(async (req, res) => {
  const patch = toSnake(req.body)
  if (Object.keys(patch).length === 0) throw ApiError.badRequest('No fields to update')
  const row = await withRlsFallback(
    req,
    (client) =>
      client
        .from('reports')
        .update(patch)
        .eq('id', req.params.id)
        .select()
        .maybeSingle()
        .then(unwrap),
    (error) => {
      throw rlsError(error)
    },
  )
  if (!row) throw ApiError.notFound('Report not found')
  res.json({ data: toCamel(row) })
})

/** DELETE /api/reports/:id */
export const deleteReport = asyncHandler(async (req, res) => {
  const row = await withRlsFallback(
    req,
    (client) =>
      client
        .from('reports')
        .delete()
        .eq('id', req.params.id)
        .select()
        .maybeSingle()
        .then(unwrap),
    (error) => {
      throw rlsError(error)
    },
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
  const period = (req.query.period ?? 'daily').toString()

  const anchor = new Date(`${date}T00:00:00.000Z`)
  let start, end
  if (period === 'weekly') {
    const day = anchor.getUTCDay() || 7
    start = new Date(anchor)
    start.setUTCDate(anchor.getUTCDate() - (day - 1))
    start.setUTCHours(0, 0, 0, 0)
    end = new Date(start)
    end.setUTCDate(start.getUTCDate() + 7)
  } else if (period === 'monthly') {
    start = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1))
    end = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 1))
  } else if (period === 'yearly') {
    start = new Date(Date.UTC(anchor.getUTCFullYear(), 0, 1))
    end = new Date(Date.UTC(anchor.getUTCFullYear() + 1, 0, 1))
  } else {
    start = new Date(`${date}T00:00:00.000Z`)
    end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  }

  const rows =
    (await withRlsFallback(
      req,
      (client) => client.from('tasks').select('*').then(unwrap),
      (error) => {
        throw rlsError(error)
      },
    )) ?? []
  const tasks = rows.map(toCamel)

  const completed = tasks.filter((t) => {
    if (!t.completedAt) return false
    const at = new Date(t.completedAt).getTime()
    return at >= start.getTime() && at < end.getTime()
  })
  const ongoing = tasks.filter((t) => t.status === 'in_progress')
  const pending = tasks.filter((t) => t.status === 'not_started')

  const join = (list) => list.map((t) => `• ${t.title}`).join('\\n')

  res.json({
    data: {
      date,
      period,
      completed: join(completed),
      ongoing: join(ongoing),
      pending: join(pending),
    },
  })
})
