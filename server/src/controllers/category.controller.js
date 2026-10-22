import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { toCamel, toSnake } from '../utils/case.js'
import { unwrap } from '../utils/db.js'
import { rlsError, withRlsFallback } from '../utils/rls.js'

/** GET /api/categories */
export const listCategories = asyncHandler(async (req, res) => {
  const rows = await withRlsFallback(
    req,
    (client) =>
      client.from('categories').select('*').order('name', { ascending: true }).then(unwrap),
    (error) => {
      throw rlsError(error)
    },
  )
  res.json({ data: (rows ?? []).map(toCamel) })
})

/** POST /api/categories */
export const createCategory = asyncHandler(async (req, res) => {
  const body = { ...toSnake(req.body), user_id: req.user.id }
  const row = await withRlsFallback(
    req,
    (client) => client.from('categories').insert(body).select().single().then(unwrap),
    (error) => {
      throw rlsError(error)
    },
  )
  res.status(201).json({ data: toCamel(row) })
})

/** PATCH /api/categories/:id */
export const updateCategory = asyncHandler(async (req, res) => {
  const patch = toSnake(req.body)
  if (Object.keys(patch).length === 0) throw ApiError.badRequest('No fields to update')
  const row = await withRlsFallback(
    req,
    (client) =>
      client
        .from('categories')
        .update(patch)
        .eq('id', req.params.id)
        .select()
        .maybeSingle()
        .then(unwrap),
    (error) => {
      throw rlsError(error)
    },
  )
  if (!row) throw ApiError.notFound('Category not found')
  res.json({ data: toCamel(row) })
})

/** DELETE /api/categories/:id */
export const deleteCategory = asyncHandler(async (req, res) => {
  const row = await withRlsFallback(
    req,
    (client) =>
      client
        .from('categories')
        .delete()
        .eq('id', req.params.id)
        .select()
        .maybeSingle()
        .then(unwrap),
    (error) => {
      throw rlsError(error)
    },
  )
  if (!row) throw ApiError.notFound('Category not found')
  res.json({ data: { id: req.params.id } })
})
