// Dev-only fake Buggregator server for the self-update UI (Settings › About &
// updates, the header pill). Runs inside `vite serve` when MOCK_UPDATE=1 and
// never in a build:
//
//   MOCK_UPDATE=1 yarn dev            (leave VITE_EVENTS_REST_API unset)
//
// It answers /api/settings, /api/projects, /api/events* (empty) and
// /api/update*, and speaks enough of the Centrifugo protocol on
// /connection/websocket to push `update.progress`. Pick a state with
//
//   http://localhost:3000/__update-mock?preset=available
//
// Presets: uptodate, never, available, memory, downloading, verifying,
// installing, restarting, done, failed, rolledback, restartreq, docker,
// kubernetes, binaryro, off, unsupported (404, an older server).
// Flags for the live flow started by «Update»: fail=download|verify|install,
// rollback=1, windows=1 (restart by hand), down=<ms the server is away>,
// pct=<frozen download percent for the downloading preset>.
import { WebSocketServer } from 'ws'

const OLD = '2.9.0'
const NEW = '2.10.0'
const SIZE = 39_741_440
const RELEASE_URL = `https://github.com/buggregator/server/releases/tag/v${NEW}`
const DOWNLOAD_MS = 6000
const STEP_MS = 1500

const NOTES = `## Before you upgrade
- **Sentry requests larger than 64 MB are no longer stored.** Real Sentry events are far smaller.

## Added
- **Sentry: a project per service**, even with a numeric DSN.
- **SMS: Twilio's send API.**

## Fixed
- Projects from \`buggregator.yaml\` exist from the first start.
- **Sentry timestamps are returned in UTC**, so the UI shows the right local time.
- HTTP proxy: compressed bodies decoded, large bodies pass through whole ([#412](https://github.com/buggregator/server/pull/412)).`

const COMMANDS = {
  docker: [
    { id: 'docker', label: 'Docker', command: `docker pull ghcr.io/buggregator/server:${NEW}\n# then recreate the container with the same docker run options` },
    { id: 'compose', label: 'Compose', command: 'docker compose pull buggregator\ndocker compose up -d buggregator' },
  ],
  kubernetes: [{ id: 'helm', label: 'Helm', command: `helm upgrade buggregator ./helm-chart --set image.tag=${NEW}` }],
  binary: [
    { id: 'sh', label: 'Linux / macOS', command: 'curl -fsSL https://raw.githubusercontent.com/buggregator/server/master/scripts/install.sh | sh' },
    { id: 'ps', label: 'Windows', command: 'irm https://raw.githubusercontent.com/buggregator/server/master/scripts/install.ps1 | iex' },
  ],
}

const iso = (ms) => new Date(ms).toISOString()
const idleState = () => ({ phase: 'idle', version: '', bytes: 0, total: 0, error: '', at: '', failed_step: '', previous: '', log: '' })

const createSim = () => ({
  supported: true,
  current: OLD,
  latest: NEW,
  available: true,
  checkedAt: Date.now() - 2 * 3600_000,
  mode: 'self',
  reason: '',
  install: 'binary',
  commands: [],
  memoryDb: false,
  restartManual: false,
  os: 'linux',
  state: idleState(),
  lastCheck: 0,
  flow: { fail: '', rollback: false, down: 5000 },
  run: null,
  downUntil: 0,
})

let sim = createSim()

const statusBody = () => ({
  current: sim.current,
  ...(sim.checkedAt ? { latest: sim.latest, url: RELEASE_URL.replace(NEW, sim.latest), checked_at: iso(sim.checkedAt) } : {}),
  available: !!sim.checkedAt && sim.available,
  notes: sim.checkedAt ? NOTES : '',
  mode: sim.mode,
  reason: sim.reason,
  install: sim.install,
  commands: sim.commands,
  memory_db: sim.memoryDb,
  restart_manual: sim.restartManual,
  check_enabled: true,
  os: sim.os,
  state: sim.state,
})

// --- WebSocket (Centrifugo v5 JSON, the part the client needs) ---

const sockets = new Set()
const wss = new WebSocketServer({ noServer: true })

const send = (socket, message) => {
  if (socket.readyState === 1) socket.send(JSON.stringify(message))
}

const broadcastState = () => {
  for (const socket of sockets) {
    send(socket, {
      push: {
        channel: 'events.project.default',
        pub: { data: { event: 'update.progress', data: sim.state } },
      },
    })
  }
}

wss.on('connection', (socket) => {
  sockets.add(socket)
  const ping = setInterval(() => send(socket, {}), 20_000)
  socket.on('close', () => {
    sockets.delete(socket)
    clearInterval(ping)
  })
  socket.on('message', (raw) => {
    for (const line of String(raw).split('\n').filter(Boolean)) {
      let command
      try {
        command = JSON.parse(line)
      } catch {
        continue
      }
      if (command.connect !== undefined) {
        send(socket, {
          id: command.id,
          connect: { client: 'dev-update-mock', version: '0.0.1', ping: 25, pong: true, subs: { 'events.project.default': {} } },
        })
      } else if (command.rpc) {
        send(socket, { id: command.id, error: { code: 100, message: 'RPC not supported by the dev mock' } })
      } else if (command.id) {
        send(socket, { id: command.id })
      }
    }
  })
})

const dropSockets = () => {
  for (const socket of sockets) socket.terminate()
  sockets.clear()
}

// --- the update flow ---

const setState = (patch) => {
  sim.state = { ...sim.state, ...patch }
  broadcastState()
}

const stopRun = () => {
  if (sim.run) clearInterval(sim.run.timer)
  sim.run = null
}

const finishRestart = () => {
  if (sim.flow.rollback) {
    sim.state = {
      ...sim.state,
      phase: 'rolled_back',
      failed_step: 'restart',
      error: 'exited 3 s after start: listen tcp :1025: bind: address already in use',
      log: `time=${iso(Date.now())} level=INFO msg="starting buggregator" version=${NEW}\ntime=${iso(Date.now())} level=ERROR msg="smtp server" err="listen tcp :1025: bind: address already in use"`,
      at: iso(Date.now()),
    }
    return
  }
  sim.current = sim.latest
  sim.available = false
  sim.state = { ...idleState(), phase: 'done', version: sim.latest, previous: OLD, at: iso(Date.now()) }
}

const tick = () => {
  const elapsed = Date.now() - sim.run.startedAt
  const { fail } = sim.flow
  const failWith = (step, error, bytes = SIZE) => {
    stopRun()
    setState({ phase: 'failed', failed_step: step, error, bytes, at: iso(Date.now()) })
  }

  if (elapsed < DOWNLOAD_MS) {
    const bytes = Math.round((SIZE * elapsed) / DOWNLOAD_MS)
    if (fail === 'download' && elapsed > DOWNLOAD_MS * 0.4) {
      failWith('download', 'connection reset after 15.9 of 37.9 MB', bytes)
      return
    }
    setState({ phase: 'downloading', bytes })
    return
  }
  if (elapsed < DOWNLOAD_MS + STEP_MS) {
    if (fail === 'verify') return failWith('verify', 'sha256 does not match checksums.txt')
    if (sim.state.phase !== 'verifying') setState({ phase: 'verifying', bytes: SIZE })
    return
  }
  if (elapsed < DOWNLOAD_MS + 2 * STEP_MS) {
    if (fail === 'install') return failWith('install', 'rename /usr/local/bin/buggregator: permission denied')
    if (sim.state.phase !== 'installing') setState({ phase: 'installing' })
    return
  }

  stopRun()
  if (sim.restartManual) {
    setState({ phase: 'restart_required', at: iso(Date.now()) })
    return
  }
  setState({ phase: 'restarting', at: iso(Date.now()) })
  // The process exits: sockets close, nothing answers for a while.
  setTimeout(() => {
    sim.downUntil = Date.now() + sim.flow.down
    dropSockets()
    setTimeout(finishRestart, sim.flow.down)
  }, 300)
}

const startRun = (version) => {
  sim.state = { ...idleState(), phase: 'downloading', version, total: SIZE, previous: sim.current, at: iso(Date.now()) }
  sim.run = { startedAt: Date.now(), timer: setInterval(tick, 250) }
  broadcastState()
}

// --- presets ---

const frozen = (phase, patch = {}) => {
  sim.state = { ...idleState(), phase, version: NEW, previous: OLD, total: SIZE, bytes: SIZE, at: iso(Date.now() - 60_000), ...patch }
}

const applyPreset = (query) => {
  stopRun()
  sim = createSim()
  sim.flow = {
    fail: query.get('fail') || '',
    rollback: query.get('rollback') === '1',
    down: Number(query.get('down') || 5000),
  }
  if (query.get('windows') === '1') {
    sim.restartManual = true
    sim.os = 'windows'
  }
  const pct = Number(query.get('pct') || 42)

  switch (query.get('preset') || 'available') {
    case 'uptodate':
      sim.current = NEW
      sim.available = false
      break
    case 'never':
      sim.checkedAt = 0
      sim.available = false
      break
    case 'memory':
      sim.memoryDb = true
      break
    case 'downloading':
      frozen('downloading', { bytes: Math.round((SIZE * pct) / 100) })
      break
    case 'verifying':
    case 'installing':
    case 'restarting':
      frozen(query.get('preset'))
      break
    case 'done':
      sim.current = NEW
      sim.available = false
      frozen('done', { at: iso(Date.now() - 60_000) })
      break
    case 'failed':
      frozen('failed', { failed_step: 'download', bytes: Math.round(SIZE * 0.42), error: 'connection reset after 15.9 of 37.9 MB' })
      break
    case 'rolledback':
      frozen('rolled_back', {
        failed_step: 'restart',
        error: 'exited 3 s after start: listen tcp :1025: bind: address already in use',
        log: 'level=ERROR msg="smtp server" err="listen tcp :1025: bind: address already in use"',
      })
      break
    case 'restartreq':
      sim.restartManual = true
      sim.os = 'windows'
      frozen('restart_required')
      break
    case 'docker':
    case 'kubernetes':
      sim.mode = 'manual'
      sim.install = query.get('preset')
      sim.commands = COMMANDS[sim.install]
      sim.reason = sim.install === 'docker'
        ? 'Buggregator runs in a container: pull the new image and recreate the container. Your data stays if it is on a volume.'
        : 'Buggregator runs in Kubernetes: upgrade the release with the new image tag. Your data stays if it is on a persistent volume.'
      break
    case 'binaryro':
      sim.mode = 'manual'
      sim.commands = COMMANDS.binary
      sim.reason = 'Buggregator cannot replace /usr/local/bin/buggregator (no write access). Run the installer yourself, then restart Buggregator.'
      break
    case 'off':
      sim.mode = 'off'
      sim.reason = 'Sign-in is off and this server is reachable from the network, so anyone who opens this page could restart it. Turn on sign-in, or set update.self_update: on (env UPDATE_SELF=on) if you accept that.'
      break
    case 'unsupported':
      sim.supported = false
      break
  }
}

// --- HTTP ---

const json = (res, status, body) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

const readBody = (req) =>
  new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'))
      } catch {
        resolve({})
      }
    })
  })

const handleApi = async (req, res, path) => {
  const method = req.method || 'GET'

  if (path === '/api/settings') {
    return json(res, 200, { version: sim.current, auth: { enabled: false, login_url: '/login' } })
  }
  if (path === '/api/projects') {
    return json(res, 200, { data: [{ key: 'default', name: 'Default project', is_default: true }] })
  }
  // No Xdebug proxy here: the sidebar hides it.
  if (path === '/api/xdebug') {
    return json(res, 200, { enabled: false })
  }
  if (path === '/api/events/preview' || path === '/api/events') {
    return method === 'GET' ? json(res, 200, { data: [], meta: { grid: [] } }) : json(res, 200, { status: true })
  }

  if (path === '/api/update' || path === '/api/update/check') {
    if (!sim.supported) return json(res, 404, { message: 'Not found', code: 404 })

    if (path === '/api/update/check' && method === 'POST') {
      const wait = 60 - Math.floor((Date.now() - sim.lastCheck) / 1000)
      if (sim.lastCheck && wait > 0) {
        return json(res, 429, { message: 'Checked less than a minute ago', code: 429, retry_after: wait })
      }
      await new Promise((resolve) => setTimeout(resolve, 1200))
      sim.lastCheck = Date.now()
      sim.checkedAt = Date.now()
      return json(res, 200, statusBody())
    }

    if (path === '/api/update' && method === 'POST') {
      const { version } = await readBody(req)
      if (sim.mode !== 'self') return json(res, 403, { message: sim.reason || 'Updating from the interface is off', code: 403 })
      if (sim.run || ['downloading', 'verifying', 'installing', 'restarting'].includes(sim.state.phase)) {
        return json(res, 409, { message: 'An update is already running', code: 409 })
      }
      if (!version || version !== sim.latest || !sim.available) {
        return json(res, 400, { message: `Version ${version} is not the latest release`, code: 400 })
      }
      startRun(version)
      return json(res, 202, statusBody())
    }

    return json(res, 200, statusBody())
  }

  return json(res, 404, { message: 'Not in the dev update mock', code: 404 })
}

export const devUpdateMock = () => ({
  name: 'buggregator-dev-update-mock',
  apply: 'serve',
  configureServer(server) {
    server.httpServer?.on('upgrade', (req, socket, head) => {
      if (!req.url?.startsWith('/connection/websocket')) return
      if (Date.now() < sim.downUntil) {
        socket.destroy()
        return
      }
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req))
    })

    server.middlewares.use((req, res, next) => {
      const url = new URL(req.url || '/', 'http://localhost')

      if (url.pathname === '/__update-mock') {
        if (url.searchParams.has('preset')) applyPreset(url.searchParams)
        return json(res, 200, { preset: url.searchParams.get('preset'), flow: sim.flow, status: statusBody() })
      }

      if (!url.pathname.startsWith('/api/')) return next()

      // The server is restarting: nothing answers.
      if (Date.now() < sim.downUntil) {
        req.socket.destroy()
        return
      }

      handleApi(req, res, url.pathname).catch((e) => json(res, 500, { message: String(e), code: 500 }))
    })

    server.config.logger.info('  dev update mock: /api/update*, /connection/websocket — pick a state at /__update-mock?preset=available')
  },
})
