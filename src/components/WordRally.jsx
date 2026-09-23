import { useCallback, useEffect, useRef, useState } from 'react'
import Section from './Section.jsx'
import { Leaderboard, NameForm } from './Leaderboard.jsx'
import { WORDS } from '../data/words.js'
import { isFirebaseConfigured } from '../firebase/config.js'
import { loadPlayerName, savePlayerName } from '../firebase/client.js'
import { BUCKETS, FAIL, fetchDaily, nameDailyResult, submitDaily } from '../firebase/games.js'

const WORD_LENGTH = 5
const MAX_GUESSES = 6
const KEY_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']

// hit: right letter, right spot. near: in the word, wrong spot. miss: not in it.
const RANK = { miss: 1, near: 2, hit: 3 }

const TILE_STYLES = {
  hit: 'border-green-300 bg-green-300 text-slate-900',
  near: 'border-ball bg-ball text-slate-900',
  miss: 'border-slate-300 bg-slate-300 text-slate-700 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-200',
}

const KEY_STYLES = {
  hit: 'bg-green-300 text-slate-900',
  near: 'bg-ball text-slate-900',
  miss: 'bg-slate-300 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
  none: 'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
}

const LABELS = { hit: 'correct', near: 'in the word, wrong spot', miss: 'not in the word' }

function pickWord(previous) {
  let word
  do word = WORDS[Math.floor(Math.random() * WORDS.length)]
  while (word === previous && WORDS.length > 1)
  return word
}

// Two passes so repeated letters are marked like Wordle: exact matches claim
// their letter first, then leftovers are handed out left to right.
function scoreGuess(guess, answer) {
  const result = Array(WORD_LENGTH).fill('miss')
  const remaining = {}
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === answer[i]) result[i] = 'hit'
    else remaining[answer[i]] = (remaining[answer[i]] || 0) + 1
  }
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] !== 'hit' && remaining[guess[i]] > 0) {
      result[i] = 'near'
      remaining[guess[i]] -= 1
    }
  }
  return result
}

// Typing into these belongs to them, not the game (the Pong canvas included).
const TEXT_TARGETS = ['INPUT', 'TEXTAREA', 'SELECT', 'CANVAS']
// A focused link or button should still activate on Enter.
const ENTER_TARGETS = ['A', 'BUTTON']

function keyBelongsTo(el, key) {
  if (!(el instanceof HTMLElement)) return false
  if (el.isContentEditable || TEXT_TARGETS.includes(el.tagName)) return true
  return key === 'ENTER' && ENTER_TARGETS.includes(el.tagName)
}

// ---- Daily word: the same answer for everyone on a given UTC day ----

const todayKey = () => new Date().toISOString().slice(0, 10)

function dailyWord(day) {
  let h = 2166136261 // FNV-1a, so consecutive days don't give neighbouring words
  for (const ch of day) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return WORDS[(h >>> 0) % WORDS.length]
}

// Progress on today's word survives a reload.
const DAILY_KEY = 'wordRally:daily'

function loadDailyWords(day) {
  try {
    const saved = JSON.parse(localStorage.getItem(DAILY_KEY))
    return saved?.day === day ? saved.words : []
  } catch {
    return []
  }
}

function saveDailyWords(day, words) {
  try {
    localStorage.setItem(DAILY_KEY, JSON.stringify({ day, words }))
  } catch {
    // Storage blocked: today's progress just isn't kept across reloads.
  }
}

function startGame(mode, previousAnswer) {
  if (mode === 'daily') {
    const day = todayKey()
    const answer = dailyWord(day)
    const guesses = loadDailyWords(day).map((word) => ({ word, result: scoreGuess(word, answer) }))
    return { mode, day, answer, guesses }
  }
  return { mode, day: null, answer: pickWord(previousAnswer), guesses: [] }
}

function resultText(guesses, answer) {
  if (guesses.at(-1)?.word === answer) {
    return guesses.length === 1 ? 'First try. Ace!' : `Got it in ${guesses.length}!`
  }
  return guesses.length === MAX_GUESSES ? `The word was ${answer}.` : ''
}

export default function WordRally() {
  const sectionRef = useRef(null)
  const [game, setGame] = useState(() => startGame('daily')) // guesses: [{ word, result }]
  const { mode, day, answer, guesses } = game
  const [current, setCurrent] = useState('')
  const [message, setMessage] = useState('')
  const [shake, setShake] = useState(false)
  const [inView, setInView] = useState(false)
  const [dictionary, setDictionary] = useState(null)

  const won = guesses.at(-1)?.word === answer
  const over = won || guesses.length === MAX_GUESSES

  const keyStatus = {}
  for (const { word, result } of guesses) {
    for (let i = 0; i < WORD_LENGTH; i++) {
      const prev = keyStatus[word[i]]
      if (!prev || RANK[result[i]] > RANK[prev]) keyStatus[word[i]] = result[i]
    }
  }

  const reject = (text) => {
    setMessage(text)
    setShake(true)
  }

  const handleKey = useCallback(
    (key) => {
      if (over) return
      if (key === 'ENTER') {
        if (current.length < WORD_LENGTH) return reject('Not enough letters')
        if (!dictionary) return setMessage('One sec, loading the word list…')
        if (!dictionary.has(current)) return reject('Not in word list')
        const next = [...guesses, { word: current, result: scoreGuess(current, answer) }]
        setGame((g) => ({ ...g, guesses: next }))
        if (mode === 'daily') saveDailyWords(day, next.map((g) => g.word))
        setCurrent('')
        setMessage('')
      } else if (key === 'BACKSPACE') {
        setCurrent((c) => c.slice(0, -1))
        setMessage('')
      } else if (/^[A-Z]$/.test(key) && current.length < WORD_LENGTH) {
        setCurrent((c) => c + key)
        setMessage('')
      }
    },
    [answer, current, day, dictionary, guesses, mode, over],
  )

  // Only listen to the physical keyboard while the game is on screen.
  useEffect(() => {
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.4,
    })
    io.observe(sectionRef.current)
    return () => io.disconnect()
  }, [])

  // The dictionary is ~75 KB, so fetch it only once the game is on screen.
  useEffect(() => {
    if (!inView || dictionary) return
    import('../data/validWords.js').then(({ default: list }) => {
      setDictionary(new Set([...list.toUpperCase().split(' '), ...WORDS]))
    })
  }, [inView, dictionary])

  useEffect(() => {
    if (!inView) return
    const onKeyDown = (e) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return
      const key = e.key.toUpperCase()
      if (keyBelongsTo(e.target, key)) return
      if (key === 'ENTER' || key === 'BACKSPACE' || /^[A-Z]$/.test(key)) {
        e.preventDefault()
        handleKey(key)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [inView, handleKey])

  const play = (nextMode) => {
    setGame(startGame(nextMode, answer))
    setCurrent('')
    setMessage('')
  }

  const rows = Array.from({ length: MAX_GUESSES }, (_, i) => {
    if (i < guesses.length) return guesses[i]
    if (i === guesses.length && !over) return { word: current, result: null, active: true }
    return { word: '', result: null }
  })

  return (
    <Section id="word-rally" title="Word Rally">
      <div ref={sectionRef}>
        <p className="max-w-2xl leading-relaxed text-slate-600 dark:text-slate-400">
          Guess the five-letter word in six tries. Type or tap the keys below.{' '}
          <span className="rounded bg-green-300 px-1 font-medium text-slate-900">Light green</span>{' '}
          means the right letter in the right spot;{' '}
          <span className="rounded bg-ball px-1 font-medium text-slate-900">yellow</span>{' '}
          means it's in the word but somewhere else.
        </p>

        <div className="mt-8 flex flex-col items-center">
          <div className="mb-5 inline-flex rounded-lg border border-slate-200 p-1 text-sm dark:border-slate-800" role="group" aria-label="Mode">
            {[
              ['daily', 'Daily'],
              ['practice', 'Practice'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => mode !== value && play(value)}
                className={`rounded-md px-4 py-1.5 font-medium transition ${
                  mode === value
                    ? 'bg-court text-white dark:bg-ball dark:text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid gap-1.5" role="grid" aria-label="Guesses">
            {rows.map((row, r) => (
              <div
                key={r}
                role="row"
                className={`grid grid-cols-5 gap-1.5 ${row.active && shake ? 'animate-[shake_0.35s_ease-in-out]' : ''}`}
                onAnimationEnd={() => setShake(false)}
              >
                {Array.from({ length: WORD_LENGTH }, (_, c) => {
                  const letter = row.word[c] ?? ''
                  const status = row.result?.[c]
                  const style = status
                    ? TILE_STYLES[status]
                    : letter
                      ? 'border-slate-500 text-slate-900 dark:border-slate-400 dark:text-white'
                      : 'border-slate-300 dark:border-slate-700'
                  return (
                    <div
                      key={c}
                      role="gridcell"
                      aria-label={letter ? `${letter}${status ? `, ${LABELS[status]}` : ''}` : 'empty'}
                      className={`flex h-12 w-12 items-center justify-center rounded-md border-2 text-xl font-bold uppercase transition-colors duration-300 sm:h-14 sm:w-14 sm:text-2xl ${style}`}
                      style={status ? { transitionDelay: `${c * 90}ms` } : undefined}
                    >
                      {letter}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          <p className="mt-4 h-6 text-sm font-medium text-slate-700 dark:text-slate-300" aria-live="polite">
            {message || (over ? resultText(guesses, answer) : '')}
          </p>

          {over ? (
            <div className="mt-2 flex w-full flex-col items-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => play('practice')}
                  className="rounded-lg bg-court px-5 py-2.5 text-sm font-medium text-white transition hover:bg-court-deep dark:bg-ball dark:text-slate-900 dark:hover:bg-ball/85"
                >
                  {mode === 'daily' ? 'Play a practice word' : 'New word'}
                </button>
                {mode === 'daily' && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    A new daily word arrives at midnight UTC.
                  </p>
                )}
              </div>
              {mode === 'daily' && isFirebaseConfigured && (
                <DailyResults day={day} guessCount={won ? guesses.length : FAIL} />
              )}
            </div>
          ) : (
            <div className="mt-2 w-full max-w-lg space-y-1.5" aria-label="Keyboard">
              {KEY_ROWS.map((row, i) => (
                <div key={row} className="flex justify-center gap-1.5">
                  {i === 2 && <Key label="Enter" wide onPress={() => handleKey('ENTER')} />}
                  {[...row].map((k) => (
                    <Key
                      key={k}
                      label={k}
                      status={keyStatus[k]}
                      onPress={() => handleKey(k)}
                    />
                  ))}
                  {i === 2 && <Key label="⌫" ariaLabel="Backspace" wide onPress={() => handleKey('BACKSPACE')} />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Section>
  )
}

function Key({ label, ariaLabel, status, wide, onPress }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel ?? (status ? `${label}, ${LABELS[status]}` : label)}
      // Keep focus off the key so a later physical Enter submits the guess
      // instead of re-pressing this button.
      onPointerDown={(e) => e.preventDefault()}
      onClick={onPress}
      className={`h-12 rounded-md text-sm font-semibold transition-colors ${wide ? 'flex-[1.6] text-xs' : 'flex-1'} min-w-0 ${KEY_STYLES[status ?? 'none']}`}
    >
      {label}
    </button>
  )
}

// ---- Global results for today's word (Firebase) ----

// One submission per day per browser, even if React runs the effect twice.
const submissions = new Map()

function submitOnce(day, guessCount) {
  if (!submissions.has(day)) {
    submissions.set(
      day,
      fetchDaily(day).then((d) =>
        d && !d.mine ? submitDaily(day, { guesses: guessCount, name: loadPlayerName() }) : null,
      ),
    )
  }
  return submissions.get(day)
}

const BUCKET_LABELS = { g1: '1', g2: '2', g3: '3', g4: '4', g5: '5', g6: '6', fail: 'X' }

function DailyResults({ day, guessCount }) {
  const [data, setData] = useState(null)
  const [failed, setFailed] = useState(false)

  const refresh = useCallback(() => fetchDaily(day).then(setData), [day])

  useEffect(() => {
    let cancelled = false
    submitOnce(day, guessCount)
      .then(() => fetchDaily(day))
      .then((d) => !cancelled && setData(d))
      .catch((err) => {
        console.warn('Word Rally results unavailable:', err)
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [day, guessCount])

  if (failed) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Global results are unavailable right now.</p>
  }
  if (!data) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Loading today's results…</p>
  }

  const { stats, leaders, mine, uid } = data
  const total = BUCKETS.reduce((n, b) => n + stats[b], 0)
  const solved = total - stats.fail
  const peak = Math.max(1, ...BUCKETS.map((b) => stats[b]))
  const myBucket = mine ? (mine.guesses === FAIL ? 'fail' : `g${mine.guesses}`) : null

  return (
    <div className="grid w-full max-w-2xl gap-4 text-left sm:grid-cols-2">
      <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Everyone today</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {total} {total === 1 ? 'player' : 'players'} · {total ? Math.round((solved / total) * 100) : 0}% solved
        </p>
        <ul className="mt-3 space-y-1">
          {BUCKETS.map((b) => {
            const count = stats[b]
            const pct = total ? Math.round((count / total) * 100) : 0
            return (
              <li key={b} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-right font-medium text-slate-500 dark:text-slate-400">{BUCKET_LABELS[b]}</span>
                <span className="relative h-5 flex-1">
                  <span
                    className={`absolute inset-y-0 left-0 rounded ${b === myBucket ? 'bg-green-300' : 'bg-slate-200 dark:bg-slate-700'}`}
                    style={{ width: `${Math.max(4, (count / peak) * 100)}%` }}
                  />
                </span>
                <span className="w-16 tabular-nums text-slate-600 dark:text-slate-400">
                  {count} · {pct}%
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="space-y-3">
        <Leaderboard
          title="Today's leaderboard"
          rows={leaders.map((p) => ({ id: p.id, name: p.name, detail: `${p.guesses}/6` }))}
          highlightId={uid}
          empty="No named solvers yet today."
        />
        {mine && mine.name === '' && mine.guesses !== FAIL && (
          <NameForm
            prompt="Add your name:"
            onSubmit={async (name) => {
              await nameDailyResult(day, name)
              savePlayerName(name)
              await refresh()
            }}
          />
        )}
      </div>
    </div>
  )
}
