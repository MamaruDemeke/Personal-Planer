import { createApp } from '../server/src/app.js'

/**
 * Vercel serverless entry point.
 *
 * Vercel routes every `/api/*` request (see `rewrites` in the root
 * `vercel.json`) to this single function, which delegates to the Express app.
 * Exporting the request handler keeps the same Express routing, middleware and
 * error handling used in local development and on a standalone server.
 */
const app = createApp()

export default function handler(req, res) {
  const url = req.url || '/'
  if (!url.startsWith('/api')) {
    req.url = url === '/' ? '/api' : `/api${url}`
  }
  return app(req, res)
}
