import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { toCamel, toSnake } from '../utils/case.js'
import { unwrap } from '../utils/db.js'

export const listNotes = asyncHandler(async (req, res) => {
  const rows = unwrap(
    await req.supabase.from('notes').select('*').order('updated_at', { ascending: false }),
  )
  res.json({ data: (rows ?? []).map(toCamel) })
})

export const getNote = asyncHandler(async (req, res) => {
  const row = unwrap(
    await req.supabase.from('notes').select('*').eq('id', req.params.id).maybeSingle(),
  )
  if (!row) throw ApiError.notFound('Note not found')
  res.json({ data: toCamel(row) })
})

export const createNote = asyncHandler(async (req, res) => {
  const body = { ...toSnake(req.body), user_id: req.user.id }
  const row = unwrap(await req.supabase.from('notes').insert(body).select().single())
  res.status(201).json({ data: toCamel(row) })
})

export const updateNote = asyncHandler(async (req, res) => {
  const patch = toSnake(req.body)
  if (Object.keys(patch).length === 0) throw ApiError.badRequest('No fields to update')
  const row = unwrap(
    await req.supabase.from('notes').update(patch).eq('id', req.params.id).select().maybeSingle(),
  )
  if (!row) throw ApiError.notFound('Note not found')
  res.json({ data: toCamel(row) })
})

export const deleteNote = asyncHandler(async (req, res) => {
  const row = unwrap(
    await req.supabase.from('notes').delete().eq('id', req.params.id).select().maybeSingle(),
  )
  if (!row) throw ApiError.notFound('Note not found')
  res.json({ data: { id: req.params.id } })
})
