import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { toCamel, toSnake } from '../utils/case.js'
import { unwrap } from '../utils/db.js'

/** GET /api/categories */
export const listCategories = asyncHandler(async (req, res) => {
  const rows = unwrap(
    await req.supabase.from('categories').select('*').order('name', { ascending: true }),
  )
  res.json({ data: (rows ?? []).map(toCamel) })
})

/** POST /api/categories */
export const createCategory = asyncHandler(async (req, res) => {
  const body = { ...toSnake(req.body), user_id: req.user.id }
  const row = unwrap(await req.supabase.from('categories').insert(body).select().single())
  res.status(201).json({ data: toCamel(row) })
})

/** PATCH /api/categories/:id */
export const updateCategory = asyncHandler(async (req, res) => {
  const patch = toSnake(req.body)
  if (Object.keys(patch).length === 0) throw ApiError.badRequest('No fields to update')
  const row = unwrap(
    await req.supabase
      .from('categories')
      .update(patch)
      .eq('id', req.params.id)
      .select()
      .maybeSingle(),
  )
  if (!row) throw ApiError.notFound('Category not found')
  res.json({ data: toCamel(row) })
})

/** DELETE /api/categories/:id */
export const deleteCategory = asyncHandler(async (req, res) => {
  const row = unwrap(
    await req.supabase.from('categories').delete().eq('id', req.params.id).select().maybeSingle(),
  )
  if (!row) throw ApiError.notFound('Category not found')
  res.json({ data: { id: req.params.id } })
})
