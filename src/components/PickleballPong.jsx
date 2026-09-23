import { useCallback, useEffect, useRef, useState } from 'react'
import Section from './Section.jsx'
import { Leaderboard, NameForm } from './Leaderboard.jsx'
import { isFirebaseConfigured } from '../firebase/config.js'
import { loadPlayerName, savePlayerName } from '../firebase/client.js'
import { fetchPongLeaders, submitPongWin } from '../firebase/games.js'

// Same geometry as the hero court: 44 × 20 ft at 10 units per foot.
const W = 480
const H = 240
const LEFT = 20
const RIGHT = 460
const TOP = 20
const BOTTOM = 220
const NET_X = 240
const KITCHEN = 70

const PADDLE_W = 8
const PADDLE_H = 44
const PLAYER_X = 34
const CPU_X = RIGHT - 14 - PADDLE_W
const BALL_R = 7

const START_SPEED = 240
const MAX_SPEED = 580
const SPEEDUP = 1.07
const MAX_BOUNCE_ANGLE = (55 * Math.PI) / 180
const PLAYER_KEY_SPEED = 340
const CPU_SPEED = 165
// The CPU only starts chasing once the ball is close to the net.
const CPU_REACT_X = NET_X - 60
// Chance the CPU misjudges a return; grows with every hit so rallies end.
const CPU_WHIFF_BASE = 0.05
const CPU_WHIFF_PER_HIT = 0.015
const POINT_PAUSE_MS = 900
// No paddle input for this long counts as walking away: freeze the game.
const IDLE_PAUSE_MS = 5000

const WIN_SCORE = 11
const WIN_BY = 2

const FALLBACK_COLORS = {
  court: '#1d5fa6',
  courtDeep: '#15407a',
  kitchen: '#1f8a5c',
  ball: '#dcee4a',
  ballInk: '#5f6b16',
}

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))
const clampPaddle = (y) => clamp(y, TOP + PADDLE_H / 2, BOTTOM - PADDLE_H / 2)

function readColors() {
  const css = getComputedStyle(document.documentElement)
  const pick = (name, fallback) => css.getPropertyValue(name).trim() || fallback
  return {
    court: pick('--color-court', FALLBACK_COLORS.court),
    courtDeep: pick('--color-court-deep', FALLBACK_COLORS.courtDeep),
    kitchen: pick('--color-kitchen', FALLBACK_COLORS.kitchen),
    ball: pick('--color-ball', FALLBACK_COLORS.ball),
    ballInk: pick('--color-ball-ink', FALLBACK_COLORS.ballInk),
  }
}

function newGame() {
  return {
    phase: 'ready', // ready | playing | point | paused | over
    pausedFrom: null,
    lastInput: 0,
    score: { you: 0, cpu: 0 },
    server: 'you',
    resumeAt: 0,
    rally: 0,
    player: { y: H / 2, targetY: null },
    cpu: { y: H / 2, aim: 0 },
    ball: { x: PLAYER_X + PADDLE_W + BALL_R + 2, y: H / 2, vx: 0, vy: 0, speed: START_SPEED },
    keys: { up: false, down: false },
  }
}

function serve(g) {
  const fromYou = g.server === 'you'
  const paddle = fromYou ? g.player : g.cpu
  const angle = (Math.random() * 2 - 1) * (25 * Math.PI) / 180
  g.ball.speed = START_SPEED
  g.ball.x = fromYou ? PLAYER_X + PADDLE_W + BALL_R + 2 : CPU_X - BALL_R - 2
  g.ball.y = paddle.y
  g.ball.vx = Math.cos(angle) * START_SPEED * (fromYou ? 1 : -1)
  g.ball.vy = Math.sin(angle) * START_SPEED
  g.rally = 0
  g.cpu.aim = (Math.random() * 2 - 1) * PADDLE_H * 0.4
  g.phase = 'playing'
}

function bounceOff(g, paddle, dir) {
  const b = g.ball
  const offset = clamp((b.y - paddle.y) / (PADDLE_H / 2 + BALL_R), -1, 1)
  const angle = offset * MAX_BOUNCE_ANGLE
  b.speed = Math.min(b.speed * SPEEDUP, MAX_SPEED)
  b.vx = Math.cos(angle) * b.speed * dir
  b.vy = Math.sin(angle) * b.speed
  g.rally += 1
  // Where on its paddle the CPU will try to meet the next ball. A whiff aims
  // just past the paddle's reach.
  const whiff = dir === 1 && Math.random() < CPU_WHIFF_BASE + CPU_WHIFF_PER_HIT * g.rally
  const side = Math.random() < 0.5 ? -1 : 1
  g.cpu.aim = whiff
    ? side * (PADDLE_H / 2 + BALL_R + 6 + Math.random() * 10)
    : (Math.random() * 2 - 1) * PADDLE_H * 0.4
}

function update(g, dt, now) {
  // Your paddle: pointer wins if present, otherwise held keys.
  const p = g.player
  if (g.keys.up || g.keys.down) {
    p.targetY = null
    p.y += (g.keys.down - g.keys.up) * PLAYER_KEY_SPEED * dt
  } else if (p.targetY != null) {
    p.y = p.targetY
  }
  p.y = clampPaddle(p.y)
  if (g.keys.up || g.keys.down) g.lastInput = now

  if ((g.phase === 'playing' || g.phase === 'point') && now - g.lastInput > IDLE_PAUSE_MS) {
    g.pausedFrom = g.phase
    g.phase = 'paused'
  }

  if (g.phase === 'point' && now >= g.resumeAt) serve(g)
  if (g.phase !== 'playing') {
    // Keep the ball on the server's paddle between points.
    if (g.phase === 'point') g.ball.y = (g.server === 'you' ? g.player : g.cpu).y
    return null
  }

  const b = g.ball
  const c = g.cpu
  const target = b.vx > 0 && b.x > CPU_REACT_X ? b.y + c.aim : H / 2
  const step = CPU_SPEED * dt
  c.y = clampPaddle(c.y + clamp(target - c.y, -step, step))

  b.x += b.vx * dt
  b.y += b.vy * dt

  if (b.y - BALL_R < TOP) {
    b.y = TOP + BALL_R
    b.vy = Math.abs(b.vy)
  } else if (b.y + BALL_R > BOTTOM) {
    b.y = BOTTOM - BALL_R
    b.vy = -Math.abs(b.vy)
  }

  const reach = PADDLE_H / 2 + BALL_R
  if (
    b.vx < 0 &&
    b.x - BALL_R <= PLAYER_X + PADDLE_W &&
    b.x - BALL_R >= PLAYER_X - 6 &&
    Math.abs(b.y - p.y) <= reach
  ) {
    b.x = PLAYER_X + PADDLE_W + BALL_R
    bounceOff(g, p, 1)
  } else if (
    b.vx > 0 &&
    b.x + BALL_R >= CPU_X &&
    b.x + BALL_R <= CPU_X + PADDLE_W + 6 &&
    Math.abs(b.y - c.y) <= reach
  ) {
    b.x = CPU_X - BALL_R
    bounceOff(g, c, -1)
  }

  let winner = null
  if (b.x + BALL_R < LEFT - 6) winner = 'cpu'
  else if (b.x - BALL_R > RIGHT + 6) winner = 'you'
  if (!winner) return null

  g.score[winner] += 1
  g.server = winner
  const { you, cpu } = g.score
  const over = Math.max(you, cpu) >= WIN_SCORE && Math.abs(you - cpu) >= WIN_BY
  g.phase = over ? 'over' : 'point'
  g.resumeAt = now + POINT_PAUSE_MS
  return winner
}

function resume(g, now) {
  g.phase = g.pausedFrom
  g.pausedFrom = null
  // Give a moment to get set before the next serve.
  if (g.phase === 'point') g.resumeAt = now + POINT_PAUSE_MS
}

function drawBall(ctx, x, y, r, colors) {
  ctx.fillStyle = colors.ball
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = colors.ballInk
  ctx.globalAlpha = 0.55
  for (const [dx, dy] of [[0, -0.55], [0.52, -0.17], [0.32, 0.45], [-0.32, 0.45], [-0.52, -0.17], [0, 0]]) {
    ctx.beginPath()
    ctx.arc(x + dx * r, y + dy * r, r * 0.14, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

function draw(ctx, g, colors) {
  ctx.clearRect(0, 0, W, H)

  ctx.fillStyle = colors.kitchen
  ctx.beginPath()
  ctx.roundRect(0, 0, W, H, 18)
  ctx.fill()
  ctx.fillStyle = colors.court
  ctx.fillRect(LEFT, TOP, RIGHT - LEFT, BOTTOM - TOP)
  ctx.fillStyle = colors.courtDeep
  ctx.fillRect(NET_X - KITCHEN, TOP, KITCHEN * 2, BOTTOM - TOP)

  ctx.strokeStyle = 'rgba(255,255,255,0.9)'
  ctx.lineWidth = 3
  ctx.strokeRect(LEFT, TOP, RIGHT - LEFT, BOTTOM - TOP)
  ctx.beginPath()
  ctx.moveTo(NET_X - KITCHEN, TOP)
  ctx.lineTo(NET_X - KITCHEN, BOTTOM)
  ctx.moveTo(NET_X + KITCHEN, TOP)
  ctx.lineTo(NET_X + KITCHEN, BOTTOM)
  ctx.moveTo(LEFT, H / 2)
  ctx.lineTo(NET_X - KITCHEN, H / 2)
  ctx.moveTo(NET_X + KITCHEN, H / 2)
  ctx.lineTo(RIGHT, H / 2)
  ctx.stroke()

  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 4
  ctx.setLineDash([2, 4])
  ctx.beginPath()
  ctx.moveTo(NET_X, 10)
  ctx.lineTo(NET_X, H - 10)
  ctx.stroke()
  ctx.setLineDash([])

  const paddle = (x, y, fill) => {
    ctx.fillStyle = fill
    ctx.beginPath()
    ctx.roundRect(x, y - PADDLE_H / 2, PADDLE_W, PADDLE_H, 4)
    ctx.fill()
  }
  paddle(PLAYER_X, g.player.y, '#ffffff')
  paddle(CPU_X, g.cpu.y, 'rgba(255,255,255,0.6)')

  if (g.phase !== 'over') drawBall(ctx, g.ball.x, g.ball.y, BALL_R, colors)
}

function usePrefersReducedMotion() {
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  return reduced
}

export default function PickleballPong() {
  const canvasRef = useRef(null)
  const gameRef = useRef(newGame())
  const [score, setScore] = useState({ you: 0, cpu: 0 })
  const [phase, setPhase] = useState('ready')
  const [lastPoint, setLastPoint] = useState(null)
  // Leaderboard (only when Firebase is configured).
  const [leaders, setLeaders] = useState(null) // { rows, uid }
  const [lastWin, setLastWin] = useState(null) // { you, cpu, status: 'ask' | 'saving' | 'saved' | 'not-best' | 'error' }
  const winHandled = useRef(false) // each finished game is recorded once

  const loadLeaders = useCallback(() => {
    fetchPongLeaders()
      .then(setLeaders)
      .catch((err) => console.warn('Pong leaderboard unavailable:', err))
  }, [])

  useEffect(() => {
    if (isFirebaseConfigured) loadLeaders()
  }, [loadLeaders])

  const recordWin = useCallback(
    async (win, name) => {
      savePlayerName(name)
      setLastWin({ ...win, status: 'saving' })
      try {
        const saved = await submitPongWin({ name, you: win.you, cpu: win.cpu })
        setLastWin({ ...win, status: saved ? 'saved' : 'not-best' })
        loadLeaders()
      } catch (err) {
        console.warn('Could not save win:', err)
        setLastWin({ ...win, status: 'error' })
      }
    },
    [loadLeaders],
  )

  // A finished game you won goes on the board, using your saved name if any.
  useEffect(() => {
    if (!isFirebaseConfigured || phase !== 'over' || score.you <= score.cpu) return
    if (winHandled.current) return
    winHandled.current = true
    const win = { you: score.you, cpu: score.cpu }
    const name = loadPlayerName()
    if (name) recordWin(win, name)
    else setLastWin({ ...win, status: 'ask' })
  }, [phase, score, recordWin])
  const reducedMotion = usePrefersReducedMotion()

  // Arrive here from the hero court.
  useEffect(() => {
    if (window.location.hash === '#play') {
      document.getElementById('play')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })
    }
  }, [reducedMotion])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const colors = readColors()
    const g = gameRef.current
    let raf = 0
    let last = performance.now()
    let visible = true

    const resize = () => {
      const scale = (canvas.clientWidth / W) * (window.devicePixelRatio || 1)
      canvas.width = Math.round(W * scale)
      canvas.height = Math.round(H * scale)
      ctx.setTransform(scale, 0, 0, scale, 0, 0)
      draw(ctx, g, colors)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    // Stop the loop when the game is scrolled away or the tab is hidden.
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) {
        last = performance.now()
        cancelAnimationFrame(raf)
        raf = requestAnimationFrame(frame)
      }
    })
    io.observe(canvas)

    function frame(now) {
      if (!visible || document.hidden) return
      const dt = Math.min((now - last) / 1000, 1 / 30)
      last = now
      const prevPhase = g.phase
      const winner = update(g, dt, now)
      if (winner) {
        setScore({ ...g.score })
        setLastPoint(winner)
      }
      if (g.phase !== prevPhase) setPhase(g.phase)
      draw(ctx, g, colors)
      raf = requestAnimationFrame(frame)
    }

    const onVisibility = () => {
      if (!document.hidden && visible) {
        last = performance.now()
        cancelAnimationFrame(raf)
        raf = requestAnimationFrame(frame)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const start = () => {
    const g = gameRef.current
    const now = performance.now()
    g.lastInput = now
    if (g.phase === 'paused') {
      resume(g, now)
      setPhase(g.phase)
    }
    if (g.phase === 'over') {
      setLastWin(null)
      winHandled.current = false
      const fresh = newGame()
      fresh.player.y = g.player.y
      Object.assign(g, fresh)
      setScore({ ...g.score })
      setLastPoint(null)
    }
    if (g.phase === 'ready' || g.phase === 'over') {
      g.server = 'you'
      serve(g)
      setPhase(g.phase)
    }
    canvasRef.current?.focus({ preventScroll: true })
  }

  const onPointerMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const g = gameRef.current
    g.player.targetY = ((e.clientY - rect.top) / rect.height) * H
    g.lastInput = performance.now()
  }

  const setKey = (e, down) => {
    const g = gameRef.current
    const k = e.key
    if (k === 'ArrowUp' || k === 'w' || k === 'W') g.keys.up = down
    else if (k === 'ArrowDown' || k === 's' || k === 'S') g.keys.down = down
    else if (down && (k === ' ' || k === 'Enter')) start()
    else return
    g.lastInput = performance.now()
    e.preventDefault()
  }

  const { you, cpu } = score
  const youWon = you > cpu
  let status
  if (phase === 'over') status = youWon ? `You win ${you}–${cpu}!` : `CPU wins ${cpu}–${you}.`
  else if (phase === 'paused') status = 'Paused'
  else if (lastPoint) status = lastPoint === 'you' ? 'Your point.' : 'CPU point.'
  else status = ''

  return (
    <Section id="play" title="Pickleball Pong">
      <p className="max-w-2xl leading-relaxed text-slate-600 dark:text-slate-400">
        A quick rally against the computer. Move your paddle with the mouse,
        your finger, or the arrow keys. First to {WIN_SCORE}, win by {WIN_BY}.
      </p>

      <div className="mt-6 flex items-center justify-between text-sm font-medium">
        <span className="text-slate-900 dark:text-white">
          You <span className="ml-1 tabular-nums text-court dark:text-court-light">{you}</span>
        </span>
        <span className="text-slate-500 dark:text-slate-400" aria-live="polite">
          {status}
        </span>
        <span className="text-slate-900 dark:text-white">
          <span className="mr-1 tabular-nums text-court dark:text-court-light">{cpu}</span> CPU
        </span>
      </div>

      <div className="relative mt-3">
        <canvas
          ref={canvasRef}
          tabIndex={0}
          aria-label="Pickleball Pong game court. Use the up and down arrow keys to move your paddle, Space to serve or resume."
          className="block aspect-[2/1] w-full cursor-none touch-none rounded-[18px] shadow-md outline-none focus-visible:ring-4 focus-visible:ring-ball/60"
          onPointerMove={onPointerMove}
          onPointerDown={(e) => {
            onPointerMove(e)
            start()
          }}
          onKeyDown={(e) => setKey(e, true)}
          onKeyUp={(e) => setKey(e, false)}
          onBlur={() => {
            gameRef.current.keys = { up: false, down: false }
          }}
        />

        {(phase === 'ready' || phase === 'paused' || phase === 'over') && (
          <button
            type="button"
            onClick={start}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ball px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg transition hover:scale-105"
          >
            {{ ready: 'Serve', paused: 'Resume', over: 'Play again' }[phase]}
          </button>
        )}
      </div>

      {isFirebaseConfigured && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Leaderboard
            title="Best wins"
            rows={leaders && leaders.rows.map((r) => ({ id: r.id, name: r.name, detail: `${r.you}–${r.cpu}` }))}
            highlightId={leaders?.uid}
            empty="No wins yet. Beat the CPU to get on the board."
          />
          <div className="text-sm text-slate-600 dark:text-slate-400" aria-live="polite">
            {lastWin?.status === 'ask' ? (
              <NameForm prompt="You won! Add your name to the board:" onSubmit={(name) => recordWin(lastWin, name)} />
            ) : lastWin?.status === 'saving' ? (
              'Saving your win…'
            ) : lastWin?.status === 'saved' ? (
              `Your ${lastWin.you}–${lastWin.cpu} win is on the board.`
            ) : lastWin?.status === 'not-best' ? (
              'Nice win! Your best one is already on the board.'
            ) : lastWin?.status === 'error' ? (
              'Could not save your win right now.'
            ) : (
              'Win a game to post your score. The board ranks wins by margin, so 11–0 is the one to beat.'
            )}
          </div>
        </div>
      )}

      <a
        href="#top"
        className="mt-6 inline-block text-sm text-slate-500 underline-offset-4 transition hover:text-court hover:underline dark:text-slate-400 dark:hover:text-court-light"
      >
        ↑ Back to the portfolio
      </a>
    </Section>
  )
}
