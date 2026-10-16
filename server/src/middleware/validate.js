/**
 * Zod validation middleware. Replaces the request property with the parsed
 * (and defaulted) value, or forwards the ZodError to the error handler, which
 * responds with 422 and per-field details.
 *
 * @param {import('zod').ZodTypeAny} schema
 * @param {'body' | 'query' | 'params'} [source]
 */
export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source])
    if (!result.success) return next(result.error)
    req[source] = result.data
    next()
  }
}
