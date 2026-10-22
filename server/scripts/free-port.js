import net from 'node:net'
import { execFileSync } from 'node:child_process'
import { env } from '../src/config/env.js'

const port = env.port
const isWindows = process.platform === 'win32'

function isPortFree() {
  return new Promise((resolve) => {
    const tester = net.createServer()
    tester.once('error', () => resolve(false))
    tester.once('listening', () => tester.close(() => resolve(true)))
    tester.listen(port)
  })
}

async function isOurServer() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/health`, {
        signal: AbortSignal.timeout(1000),
      })
      if (res.ok) {
        const body = await res.json()
        return body?.data?.service === 'mezgab-api' || body?.data?.service === 'worker-planner-api'
      }
    } catch {
      // Not responding yet - the server may still be starting; retry briefly.
    }
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
  return false
}

function listeningPids() {
  const pids = new Set()
  try {
    if (isWindows) {
      const out = execFileSync('netstat', ['-ano', '-p', 'tcp'], { encoding: 'utf8' })
      for (const line of out.split(/\r?\n/)) {
        const parts = line.trim().split(/\s+/)
        if (parts.length < 5) continue
        const [, local, , state, pid] = parts
        if (state !== 'LISTENING') continue
        if (!local.endsWith(`:${port}`)) continue
        pids.add(pid)
      }
    } else {
      const out = execFileSync('lsof', ['-ti', `tcp:${port}`, '-sTCP:LISTEN'], {
        encoding: 'utf8',
      })
      for (const pid of out.split(/\r?\n/)) {
        if (pid.trim()) pids.add(pid.trim())
      }
    }
  } catch {
    // No listener / tool unavailable.
  }
  return [...pids]
}

function killPid(pid) {
  try {
    if (isWindows) execFileSync('taskkill', ['/PID', pid, '/F'], { stdio: 'ignore' })
    else execFileSync('kill', ['-9', pid], { stdio: 'ignore' })
  } catch {
    // Already gone.
  }
}

async function main() {
  if (await isPortFree()) return

  if (!(await isOurServer())) {
    console.error(
      `Port ${port} is in use by another program. Stop it, or set a different PORT in server/.env.`,
    )
    process.exit(1)
  }

  console.log(`Port ${port} is held by a previous Worker Planner server; stopping it…`)
  for (const pid of listeningPids()) killPid(pid)

  for (let i = 0; i < 20; i += 1) {
    if (await isPortFree()) return
    await new Promise((resolve) => setTimeout(resolve, 150))
  }

  console.error(`Could not free port ${port}. Stop the process using it and try again.`)
  process.exit(1)
}

await main()
