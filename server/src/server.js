import { createApp } from './app.js'
import { env } from './config/env.js'

const app = createApp()

const server = app.listen(env.port, () => {
  console.log(`Planora API listening on http://localhost:${env.port} (${env.nodeEnv})`)
})

function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully…`)
  server.close(() => process.exit(0))
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
