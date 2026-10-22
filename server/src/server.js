import { createApp } from './app.js'
import { env } from './config/env.js'

const app = createApp()

const MAX_RETRIES = 10
const RETRY_DELAY_MS = 300

let currentServer = null

function listen(attempt = 0) {
  const server = app.listen(env.port)
  currentServer = server

  server.once('listening', () => {
    console.log(`Mezgab API listening on http://localhost:${env.port} (${env.nodeEnv})`)
  })

  server.once('error', (error) => {
    // A previous server (or a watcher restart) may take a moment to release the
    // port, so retry briefly before giving up.
    if (error.code === 'EADDRINUSE' && attempt < MAX_RETRIES) {
      if (attempt === 0) {
        console.log(`Port ${env.port} is busy; retrying…`)
      }
      setTimeout(() => listen(attempt + 1), RETRY_DELAY_MS)
      return
    }

    if (error.code === 'EADDRINUSE') {
      console.error(
        `\nPort ${env.port} is already in use by another program.\n` +
          'Stop it (close the other terminal, or run: netstat -ano | findstr :4000)\n' +
          'or set a different PORT in server/.env and start again.\n',
      )
      process.exit(1)
    }

    throw error
  })
}

function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully…`)
  if (currentServer?.listening) currentServer.close(() => process.exit(0))
  else process.exit(0)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

listen()
