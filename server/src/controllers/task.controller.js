import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { toCamel, toSnake } from '../utils/case.js'
import { unwrap } from '../utils/db.js'

/** Add server-derived fields (overdue, on-time) to a task row. */
function decorate(task) {
  const isCompleted = task.status === 'completed'
  const deadline = task.deadline ? new Date(task.deadline).getTime() : null
  const overdue = !isCompleted && deadline !== null && deadline < Date.now()
  return {
    ...task,
    isCompleted,
    overdue,
    onTime: isCompleted && deadline !== null ? !task.completedLate : null,
  }
}

const SORTS = {
  created_at: 'created_at',
  updated_at: 'updated_at',
  deadline: 'deadline',
  start_date: 'start_date',
  priority: 'priority',
  progress: 'progress',
  title: 'title',
}

/** GET /api/tasks */
export const listTasks = asyncHandler(async (req, res) => {
  const { search, status, priority, categoryId, from, to } = req.query
  const sortCol = SORTS[req.query.sort] ?? 'created_at'
  const ascending = String(req.query.order).toLowerCase() === 'asc'

  let query = req.supabase.from('tasks').select('*')

  if (search && String(search).trim()) {
    const term = String(search)
      .trim()
      .replace(/[%,()*]/g, ' ')
    query = query.or(
      `title.ilike.%${term}%,description.ilike.%${term}%,notes.ilike.%${term}%`,
    )
  }
  if (priority) query = query.eq('priority', priority)
  if (categoryId) query = query.eq('category_id', categoryId)

  const nowIso = new Date().toISOString()
  if (status === 'overdue') {
    query = query.neq('status', 'completed').lt('deadline', nowIso)
  } else if (status === 'active') {
    query = query.neq('status', 'completed')
  } else if (status) {
    query = query.eq('status', status)
  }

  if (from) query = query.gte('deadline', from)
  if (to) query = query.lte('deadline', to)

  query = query.order(sortCol, { ascending, nullsFirst: false })

  const data = unwrap(await query)
  res.json({ data: (data ?? []).map(toCamel).map(decorate) })
})

/** GET /api/tasks/:id */
export const getTask = asyncHandler(async (req, res) => {
  const row = unwrap(
    await req.supabase.from('tasks').select('*').eq('id', req.params.id).maybeSingle(),
  )
  if (!row) throw ApiError.notFound('Task not found')
  res.json({ data: decorate(toCamel(row)) })
})

/** POST /api/tasks */
export const createTask = asyncHandler(async (req, res) => {
  const body = { ...toSnake(req.body), user_id: req.user.id }
  const row = unwrap(await req.supabase.from('tasks').insert(body).select().single())
  res.status(201).json({ data: decorate(toCamel(row)) })
})

/** PATCH /api/tasks/:id */
export const updateTask = asyncHandler(async (req, res) => {
  const patch = toSnake(req.body)
  if (Object.keys(patch).length === 0) throw ApiError.badRequest('No fields to update')
  const row = unwrap(
    await req.supabase.from('tasks').update(patch).eq('id', req.params.id).select().maybeSingle(),
  )
  if (!row) throw ApiError.notFound('Task not found')
  res.json({ data: decorate(toCamel(row)) })
})

/** DELETE /api/tasks/:id */
export const deleteTask = asyncHandler(async (req, res) => {
  const row = unwrap(
    await req.supabase.from('tasks').delete().eq('id', req.params.id).select().maybeSingle(),
  )
  if (!row) throw ApiError.notFound('Task not found')
  res.json({ data: { id: req.params.id } })
})
